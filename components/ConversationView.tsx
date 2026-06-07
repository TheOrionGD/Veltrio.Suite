import React, { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudioGroq, generateSpeechGroq, chatWithGroqConversation, isGroqTtsActive } from '../services/groqService';
import { MicrophoneIcon, StopIcon, SpinnerIcon, SpeakerIcon } from './icons';
import WaveformVisualizer from './WaveformVisualizer';
import { LANGUAGES } from '../constants';

type TranscriptEntry = { 
    speaker: 'You' | 'AI'; 
    text: string;
    languageCode?: string;
};

interface ConversationViewProps {
  onAskAssistant: (prompt: string) => void;
  addXp?: (amount: number) => void;
}

const ConversationView: React.FC<ConversationViewProps> = ({ onAskAssistant, addXp }) => {
    const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'speaking' | 'error'>('idle');
    const [isLoopActive, setIsLoopActive] = useState<boolean>(false);
    const [inputLanguage, setInputLanguage] = useState<string>('auto');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string>('');
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // Silence detection refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Refs to keep values fresh in callbacks and loops
    const statusRef = useRef(status);
    const isLoopActiveRef = useRef(isLoopActive);
    
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        isLoopActiveRef.current = isLoopActive;
    }, [isLoopActive]);

    const scrollToBottom = () => transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [transcript]);

    useEffect(() => () => {
        window.speechSynthesis.cancel();
        audioRef.current?.pause();
        if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
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
                setTimeout(startRecording, 400);
            }
        };

        u.onend = completeSpeech;
        u.onerror = completeSpeech;

        const backupTimer = setTimeout(() => {
            if (!didComplete) {
                console.warn("SpeechSynthesis onend failed to fire. Triggering backup resume.");
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
                            setTimeout(startRecording, 400);
                        }
                    };
                    audio.onerror = () => speakNative(text, 'en');
                    audioRef.current = audio;
                } else { 
                    audioRef.current.src = url; 
                    audioRef.current.onended = () => {
                        setStatus('idle');
                        if (isLoopActiveRef.current) {
                            setTimeout(startRecording, 400);
                        }
                    };
                    audioRef.current.onerror = () => speakNative(text, 'en');
                }
                audioRef.current.play();
            } catch (err) { speakNative(text, 'en'); }
        } else { 
            speakNative(text, lang); 
        }
    };

    const startRecording = async () => {
        setError(''); setStatus('recording');
        window.speechSynthesis.cancel(); audioRef.current?.pause();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioStream(stream);
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(t => t.stop());
                setAudioStream(null);
                
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
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
                    
                    if (Date.now() - lastSoundTime > 1600) {
                        stopRecording();
                    } else {
                        animationFrameRef.current = requestAnimationFrame(checkSilence);
                    }
                };
                
                animationFrameRef.current = requestAnimationFrame(checkSilence);
            } catch (vadErr) {
                console.error("VAD initialization failed:", vadErr);
            }

            mediaRecorder.start();
        } catch (err: any) { setError('Could not access microphone: ' + err.message); setStatus('idle'); }
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

            const formattedHistory = newTranscript.map(e => ({
                role: (e.speaker === 'You' ? 'user' : 'assistant') as 'user' | 'assistant',
                content: e.text
            }));
            const res = await chatWithGroqConversation(formattedHistory, inputLanguage);
            if (!res.responseText.trim()) throw new Error('Empty response from AI model.');
            
            setTranscript(prev => [...prev, { 
                speaker: 'AI' as const, 
                text: res.responseText, 
                languageCode: res.languageCode 
            }]);
            
            if (addXp) addXp(35); // Trigger Voice XP reward!
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

    // Pitch Red and Black Mixed configs
    const centerRingGlow = {
        idle: 'border-red-600/40 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse rounded-full',
        recording: 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-ping [animation-duration:2.5s] rounded-full',
        processing: 'border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-spin [animation-duration:3s] rounded-full',
        speaking: 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse rounded-full',
        error: 'border-red-700 shadow-[0_0_25px_rgba(239,68,68,0.5)] rounded-full',
    }[status];

    const innerSphereColor = {
        idle: 'bg-black/90 border-red-600/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] rounded-full',
        recording: 'bg-black/95 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] rounded-full',
        processing: 'bg-black/95 border-red-400 text-red-400 animate-pulse rounded-full',
        speaking: 'bg-black/95 border-red-500 text-red-500 rounded-full',
        error: 'bg-black/95 border-red-700 text-red-700 rounded-full',
    }[status];

    const stateLabel = {
        idle: 'Ready to listen',
        recording: 'VAD Active (Listening...)',
        processing: 'Analyzing voice...',
        speaking: 'AI is responding...',
        error: 'Voice mode error',
    }[status];

    return (
        <>
            {/* Full width container, no background, no borders, no cards */}
            <div className="col-span-full flex flex-col lg:h-full min-h-0 relative font-mono">

                {/* Advanced HUD Telemetry Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 z-10 flex-shrink-0 text-red-500">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-red-600 animate-ping rounded-full" />
                      <span className="text-sm font-black uppercase tracking-widest text-red-500 cyber-glow-red">
                        [NODE: NEURAL_UPLINK_V3]
                      </span>
                      <span className="hidden xl:inline text-[9px] opacity-75 font-semibold">
                        [AUDIO_DECK_GATE: 85%] [LINK_BALANCE: AUTO] [LOGS_ACTIVE: {transcript.length}]
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* LOCALE selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-wider text-muted font-bold">LOCALE_GATE:</span>
                          <select
                            value={inputLanguage}
                            onChange={(e) => setInputLanguage(e.target.value)}
                            className="bg-black border border-red-500/40 text-red-500 text-[10px] px-2 py-0.5 outline-none font-bold"
                          >
                            <option value="auto">AUTO_DETECT</option>
                            {LANGUAGES.map(lang => (
                              <option key={lang.code} value={lang.code}>
                                {lang.name.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Mode indicator */}
                        <div className="flex bg-black border border-red-500/40 p-1 px-3 shadow-inner">
                            <span className="text-[10px] font-black uppercase text-red-500 cyber-glow-red animate-pulse">
                                ⚡ VAD ACTIVE
                            </span>
                        </div>

                        {transcript.length > 0 && (
                            <button
                                onClick={handleClearTranscript}
                                className="text-[10px] font-bold text-red-600 hover:text-red-500 px-3 py-1 border border-red-500/35 hover:bg-red-500/5 transition-all cursor-pointer animate-pulse"
                            >
                                PURGE_LOGS
                            </button>
                        )}
                    </div>
                </div>

                {/* Central Stage */}
                <div className="flex-grow flex flex-col items-center justify-center p-6 space-y-6 relative overflow-hidden min-h-0">
                    
                    {/* Pulsating Voice HUD Core */}
                    <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center z-10 flex-shrink-0">
                        <div className={`absolute inset-0 border transition-all duration-500 ${centerRingGlow}`} />
                        <div className={`w-28 h-28 md:w-32 md:h-32 border flex items-center justify-center transition-all duration-500 ${innerSphereColor} relative overflow-hidden bg-black/40`}>
                            <img 
                                src="/logo.png" 
                                alt="Veltrio System Core" 
                                className={`w-16 h-16 md:w-20 md:h-20 object-contain ${
                                    status === 'recording' ? 'animate-pulse scale-105' :
                                    status === 'processing' ? 'animate-spin [animation-duration:12s]' : ''
                                }`} 
                            />
                            {status !== 'idle' && (
                              <span className={`absolute bottom-2.5 right-1/2 translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                                status === 'recording' ? 'bg-red-500' :
                                status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                                status === 'speaking' ? 'bg-red-400' : 'bg-red-700'
                              }`} />
                            )}
                        </div>
                    </div>

                    {/* Active Voice Subtitle/Log Panel (Hacker console style) */}
                    <div className="w-full max-w-md bg-black/80 border border-red-500/30 p-2.5 text-center min-h-[44px] flex items-center justify-center text-[10px] text-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)] flex-shrink-0">
                      {status === 'recording' && <span className="animate-pulse">🎙️ DETECTING INPUT STREAM...</span>}
                      {status === 'processing' && <span className="animate-pulse">⏳ RUNNING WHISPER TRANSLATION SYNC...</span>}
                      {status === 'speaking' && (
                        <span className="text-red-400 animate-pulse">
                          🤖 AI: "{transcript[transcript.length - 1]?.text || 'Synthesizing voice response...'}"
                        </span>
                      )}
                      {status === 'idle' && (
                        <span className="text-muted font-bold">AWAITING VOCAL CAPTURE</span>
                      )}
                    </div>

                    {/* Interactive Canvas Waveform Visualizer */}
                    <div className="text-center z-10 w-full max-w-md space-y-1 flex-shrink-0">
                        <h4 className="text-[10px] font-extrabold text-red-500/70 tracking-widest uppercase">
                            {stateLabel}
                        </h4>
                        
                        <WaveformVisualizer 
                            isActive={status !== 'idle'} 
                            mode={status} 
                            audioStream={audioStream} 
                        />
                    </div>

                    {/* Neural logs panel - expanded height to prevent unnecessary scrolls */}
                    <div className="w-full max-w-xl h-64 border border-red-500/20 bg-black/35 p-4 flex flex-col justify-between flex-shrink-0 text-xs">
                        <div className="overflow-y-auto flex-grow space-y-3 pr-2 scrollbar-thin scrollbar-red font-mono">
                            {transcript.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted/50 text-[10px] uppercase font-bold italic">
                                    No active neural logs. Awaiting voice uplinks...
                                </div>
                            ) : (
                                transcript.map((entry, idx) => (
                                    <div key={idx} className={`flex ${entry.speaker === 'You' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] px-3 py-1.5 border text-[11px] leading-relaxed ${
                                            entry.speaker === 'You'
                                                ? 'bg-black text-red-500 border-red-500/40'
                                                : 'bg-black text-red-400 border-red-500/30'
                                        } flex items-center gap-2 shadow-sm`}>
                                            <div className="flex-grow">
                                                <span className="block text-[8px] opacity-75 font-bold uppercase mb-0.5 text-muted">{entry.speaker}</span>
                                                <p>{entry.text}</p>
                                            </div>
                                            {entry.speaker === 'AI' && (
                                                <button
                                                    onClick={() => speakText(entry.text, entry.languageCode || 'en')}
                                                    className="p-1 rounded-none hover:bg-surface text-muted hover:text-red-500 transition-colors flex-shrink-0 cursor-pointer"
                                                    title="Replay Audio"
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

                        {/* Interactive floating buttons inside logs box */}
                        <div className="pt-3 border-t border-red-500/20 flex items-center justify-between flex-shrink-0">
                            <button
                                onClick={handleMicClick}
                                disabled={status === 'processing'}
                                className="cyber-button-pink px-5 py-2 text-[10px] tracking-wider uppercase"
                            >
                                {status === 'recording' ? 'STOP DECK SIGNAL' : 'OPEN VOCAL UPLINK'}
                            </button>

                            {transcript.length > 0 && (
                                <button
                                  onClick={() => {
                                    const formatted = transcript.map(e => `${e.speaker}: ${e.text}`).join('\n');
                                    onAskAssistant(`I am reviewing this conversation context from the Live Voice Mode:\n\n${formatted}\n\nCan you summarize the main discussion or provide phrasing tips based on this conversation?`);
                                  }}
                                  className="cyber-button-pink px-4 py-2 text-[10px]"
                                >
                                  ✨ QUERY SYSTEM AI
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="absolute top-16 left-6 right-6 border border-red-500/30 text-red-500 bg-black px-4 py-2.5 rounded-none text-xs font-semibold text-center backdrop-blur-md z-20 animate-pulse">
                        ⚠️ UPLINK ERROR: {error}
                    </div>
                )}
            </div>
        </>
    );
};

export default ConversationView;
