import React, { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudioGroq, generateSpeechGroq, chatWithGroqConversation, isGroqTtsActive } from '../services/groqService';
import { MicrophoneIcon, StopIcon, SpinnerIcon, SpeakerIcon, HistoryIcon, CloseIcon, TrashIcon } from './icons';
import WaveformVisualizer from './WaveformVisualizer';
import { LANGUAGES } from '../constants';

type TranscriptEntry = {
  speaker: 'You' | 'AI';
  text: string;
  languageCode?: string;
};

interface ConversationViewProps {
  onAskAssistant: (prompt: string) => void;
  inputLanguage: string;
  setInputLanguage: (lang: string) => void;
  clearHistoryTrigger: number;
}

const ConversationView: React.FC<ConversationViewProps> = ({
  onAskAssistant,
  inputLanguage,
  setInputLanguage,
  clearHistoryTrigger,
}) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'speaking' | 'error'>('idle');
  const [isLoopActive, setIsLoopActive] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string>('');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  // Layout states
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Silence detection refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Refs to keep values fresh in loops
  const statusRef = useRef(status);
  const isLoopActiveRef = useRef(isLoopActive);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isLoopActiveRef.current = isLoopActive;
  }, [isLoopActive]);

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [transcript]);

  // Sync clear trigger from parent
  useEffect(() => {
    if (clearHistoryTrigger > 0) {
      setTranscript([]);
    }
  }, [clearHistoryTrigger]);

  useEffect(() => () => {
    window.speechSynthesis.cancel();
    audioRef.current?.pause();
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
  }, []);

  const speakNative = (text: string, lang: string = 'en') => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;

    const wordCount = text.split(/\s+/).length;
    const estimatedDurationMs = Math.max(3000, wordCount * 400 + 3000);

    let didComplete = false;
    const completeSpeech = () => {
      if (didComplete) return;
      didComplete = true;
      clearTimeout(backupTimer);
      setStatus('idle');
      if (isLoopActiveRef.current) {
        setTimeout(startRecording, 450);
      }
    };

    u.onend = completeSpeech;
    u.onerror = completeSpeech;

    const backupTimer = setTimeout(() => {
      if (!didComplete) {
        window.speechSynthesis.cancel();
        completeSpeech();
      }
    }, estimatedDurationMs);

    window.speechSynthesis.speak(u);
  };

  const speakText = async (text: string, lang: string = 'en') => {
    setStatus('speaking');
    if (lang === 'en' && isGroqTtsActive()) {
      try {
        const blob = await generateSpeechGroq(text, 'en');
        const url = URL.createObjectURL(blob);
        if (!audioRef.current) {
          const audio = new Audio(url);
          audio.onended = () => {
            setStatus('idle');
            if (isLoopActiveRef.current) {
              setTimeout(startRecording, 450);
            }
          };
          audio.onerror = () => speakNative(text, 'en');
          audioRef.current = audio;
        } else {
          audioRef.current.src = url;
          audioRef.current.onended = () => {
            setStatus('idle');
            if (isLoopActiveRef.current) {
              setTimeout(startRecording, 450);
            }
          };
          audioRef.current.onerror = () => speakNative(text, 'en');
        }
        audioRef.current.play();
      } catch (err) {
        speakNative(text, 'en');
      }
    } else {
      speakNative(text, lang);
    }
  };

  const startRecording = async () => {
    setError('');
    setStatus('recording');
    window.speechSynthesis.cancel();
    audioRef.current?.pause();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        setAudioStream(null);

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }

        processAudioInput(audioBlob);
      };

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        let lastSoundTime = Date.now();

        const checkSilence = () => {
          if (statusRef.current !== 'recording') return;
          analyser.getByteTimeDomainData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            const deviation = (dataArray[i] - 128) / 128;
            sum += deviation * deviation;
          }
          const rms = Math.sqrt(sum / bufferLength);

          const threshold = 0.015;
          if (rms > threshold) {
            lastSoundTime = Date.now();
          }

          // Stop recording after 1.6 seconds of silence
          if (Date.now() - lastSoundTime > 1600) {
            stopRecording();
          } else {
            animationFrameRef.current = requestAnimationFrame(checkSilence);
          }
        };

        animationFrameRef.current = requestAnimationFrame(checkSilence);
      } catch (vadErr) {
        console.error('VAD initialization failed:', vadErr);
      }

      mediaRecorder.start();
    } catch (err: any) {
      setError('Could not access microphone: ' + err.message);
      setStatus('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudioInput = async (audioBlob: Blob) => {
    setStatus('processing');
    try {
      const hasGroqKey = !!import.meta.env.VITE_GROQ_API_KEY;
      if (!hasGroqKey) throw new Error('VITE_GROQ_API_KEY is not set. Please add it to your .env file.');

      const userText = await transcribeAudioGroq(audioBlob, inputLanguage);
      if (!userText.trim()) {
        setError('No speech detected. Please try again.');
        setStatus('idle');
        if (isLoopActiveRef.current) {
          setTimeout(startRecording, 1000);
        }
        return;
      }

      const newTranscript = [...transcript, { speaker: 'You' as const, text: userText }];
      setTranscript(newTranscript);

      const formattedHistory = newTranscript.map((e) => ({
        role: (e.speaker === 'You' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: e.text,
      }));
      const res = await chatWithGroqConversation(formattedHistory, inputLanguage);
      if (!res.responseText.trim()) throw new Error('Empty response from AI model.');

      setTranscript((prev) => [
        ...prev,
        {
          speaker: 'AI' as const,
          text: res.responseText,
          languageCode: res.languageCode,
        },
      ]);

      await speakText(res.responseText, res.languageCode);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setStatus('error');
      if (isLoopActiveRef.current) {
        setTimeout(startRecording, 2000);
      }
    }
  };

  const handleMicClick = () => {
    if (status === 'recording') {
      setIsLoopActive(false);
      stopRecording();
    } else if (status === 'speaking') {
      window.speechSynthesis.cancel();
      audioRef.current?.pause();
      setStatus('idle');
      setIsLoopActive(false);
    } else {
      setIsLoopActive(true);
      startRecording();
    }
  };

  const handleClearTranscript = () => {
    setTranscript([]);
    setError('');
    setStatus('idle');
  };

  // Color mappings for pulsing Voice Core Orb
  const orbGlowColor = {
    idle: 'from-indigo-600/30 to-purple-600/30 hover:scale-[1.03]',
    recording: 'from-blue-600/60 to-purple-600/60 scale-[1.08] shadow-[0_0_80px_rgba(37,99,235,0.45)]',
    processing: 'from-amber-500/50 to-orange-500/50 scale-[1.05] shadow-[0_0_80px_rgba(245,158,11,0.35)]',
    speaking: 'from-emerald-500/60 to-teal-500/60 scale-[1.07] shadow-[0_0_80px_rgba(16,185,129,0.4)]',
    error: 'from-red-600/50 to-pink-600/50',
  }[status];

  const stateIndicatorText = {
    idle: 'Core Standby — Click Orb to Talk',
    recording: 'Listening to speech capture...',
    processing: 'Resolving meaning context...',
    speaking: 'Synthesizing voice response...',
    error: 'System error. Click to clear.',
  }[status];

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[65vh] relative max-w-4xl">
      
      {/* Top Selector Dock (Boundary-less) */}
      <div className="glass-pill px-6 py-2.5 flex items-center justify-between w-full max-w-md shadow-[0_8px_32px_rgba(0,0,0,0.15)] mb-12">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-550 dark:text-zinc-400 font-bold">Locale:</span>
          <select
            value={inputLanguage}
            onChange={(e) => setInputLanguage(e.target.value)}
            className="bg-transparent text-xs font-bold text-zinc-700 dark:text-zinc-300 border-none outline-none cursor-pointer hover:text-black dark:hover:text-white transition-colors"
          >
            <option value="auto" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-300">🔍 Auto-Detect Speech</option>
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-300">
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsLogsOpen(true)}
          className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-800/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
          title="Open Conversation Logs"
        >
          <HistoryIcon className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Logs</span>
        </button>
      </div>

      {/* Center Stage: Immersive Morphing Voice Core Orb */}
      <div className="relative flex items-center justify-center w-80 h-80 flex-shrink-0 mb-10">
        
        {/* Decorative glass rings rotating around orb (Awwwards/Vision Pro styling) */}
        <div className={`absolute inset-0 border border-white/5 rounded-full transition-all duration-[2s] pointer-events-none ${
          status !== 'idle' ? 'rotate-180 scale-105 opacity-30 border-indigo-500/20' : 'opacity-10'
        }`} />
        <div className={`absolute inset-4 border border-white/5 rounded-full transition-all duration-[3s] pointer-events-none ${
          status !== 'idle' ? '-rotate-180 scale-95 opacity-40 border-emerald-500/10' : 'opacity-10'
        }`} />

        <button
          onClick={handleMicClick}
          disabled={status === 'processing'}
          className={`relative w-44 h-44 rounded-full bg-gradient-to-tr voice-core-orb hover-scale cursor-pointer flex items-center justify-center z-10 select-none ${orbGlowColor}`}
        >
          {/* Internal state icon indicators */}
          {status === 'idle' && <MicrophoneIcon className="w-12 h-12 text-white/80" />}
          {status === 'recording' && <StopIcon className="w-12 h-12 text-white animate-pulse" />}
          {status === 'processing' && <SpinnerIcon className="w-12 h-12 text-white animate-spin" />}
          {status === 'speaking' && <SpeakerIcon className="w-12 h-12 text-white animate-bounce" />}
          {status === 'error' && <span className="text-white text-3xl font-black font-mono">!</span>}
        </button>
      </div>

      {/* Contextual Subtitle Subtitle Overlay */}
      <div className="w-full max-w-xl text-center min-h-[72px] flex items-center justify-center text-sm px-6 font-semibold tracking-wide text-zinc-800 dark:text-zinc-200 text-glow transition-all duration-300">
        {status === 'recording' && <span className="text-zinc-700 dark:text-zinc-300 animate-pulse">🎙️ Spoken signal capture engaged...</span>}
        {status === 'processing' && <span className="text-zinc-600 dark:text-zinc-400 animate-pulse">⏳ Deep translation resolving...</span>}
        {status === 'speaking' && (
          <p className="leading-relaxed">
            🤖 AI: "{transcript[transcript.length - 1]?.text}"
          </p>
        )}
        {status === 'idle' && (
          <span className="text-zinc-500 font-medium">Click the core to speak and generate instant voice link response</span>
        )}
      </div>

      {/* Custom Waveform oscilloscope */}
      <div className="w-full max-w-md pt-8 space-y-2.5">
        <h4 className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase text-center font-mono">
          {stateIndicatorText}
        </h4>

        <WaveformVisualizer
          isActive={status !== 'idle'}
          mode={status}
          audioStream={audioStream}
        />
      </div>

      {error && (
        <div className="absolute top-20 left-6 right-6 border border-red-500/20 text-red-400 bg-red-950/20 backdrop-blur-md px-5 py-3.5 rounded-2xl text-xs font-semibold text-center z-20 shadow-lg animate-pulse">
          ⚠️ Voice matrix error: {error}
        </div>
      )}

      {/* Dynamic Slide-out Dialogue Logs Sidebar Overlay */}
      {isLogsOpen && (
        <div
          onClick={() => setIsLogsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm glass-panel h-full rounded-l-3xl rounded-r-none border-l border-zinc-200 dark:border-white/10 p-6 flex flex-col justify-between overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/50 dark:border-white/5">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-indigo-650 dark:text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">Conversation Logs</span>
              </div>
              <button
                onClick={() => setIsLogsOpen(false)}
                className="text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-200 p-1 hover:bg-zinc-800/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-grow overflow-y-auto py-6 space-y-4">
              {transcript.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500 text-xs italic text-center">
                  No speech dialogs captured yet. Trigger the core to record.
                </div>
              ) : (
                transcript.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`flex ${entry.speaker === 'You' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 border rounded-2xl text-xs leading-relaxed ${
                        entry.speaker === 'You'
                          ? 'bg-indigo-600 text-white border-indigo-600 rounded-br-none shadow-sm'
                          : 'bg-zinc-800/5 dark:bg-white/5 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-white/10 rounded-bl-none'
                      } flex items-center gap-2.5`}
                    >
                      <div className="min-w-0 flex-grow text-left">
                        <span
                          className={`block text-[8px] font-bold uppercase mb-0.5 ${
                            entry.speaker === 'You' ? 'text-indigo-200' : 'text-zinc-550 dark:text-zinc-400'
                          }`}
                        >
                          {entry.speaker}
                        </span>
                        <p className="whitespace-pre-wrap">{entry.text}</p>
                      </div>
                      {entry.speaker === 'AI' && (
                        <button
                          onClick={() => speakText(entry.text, entry.languageCode || 'en')}
                          className="p-1 rounded-lg hover:bg-zinc-800/10 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors flex-shrink-0 cursor-pointer"
                          title="Replay speech"
                        >
                          <SpeakerIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* AI Summary integration & chat clear */}
            {transcript.length > 0 && (
              <div className="pt-4 border-t border-zinc-200/50 dark:border-white/5 flex flex-col gap-2">
                <button
                  onClick={() => {
                    const formatted = transcript.map((e) => `${e.speaker}: ${e.text}`).join('\n');
                    onAskAssistant(
                      `Summarize this voice conversation and provide language feedback:\n\n${formatted}`
                    );
                    setIsLogsOpen(false);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  ✨ Analyze Conversation
                </button>

                <button
                  onClick={handleClearTranscript}
                  className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-650 dark:text-red-450 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Wipe Logs
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationView;
