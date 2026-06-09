import React, { useState, useEffect, useRef, useCallback } from 'react';
import { translateTextGroq, analyzeSentimentGroq, transcribeAudioGroq, generateSpeechGroq, isGroqTtsActive } from '../services/groqService';
import { SentimentResult, Language, HistoryItem, SentimentLabel } from '../types';
import { LANGUAGES } from '../constants';
import { MicrophoneIcon, StopIcon, SpinnerIcon, SpeakerIcon, HistoryIcon, TrashIcon, CloseIcon, PositiveIcon, NegativeIcon, NeutralIcon } from './icons';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const HISTORY_STORAGE_KEY = 'translationHistory';

interface TranslatorViewProps {
  onAskAssistant: (prompt: string) => void;
  inputLanguage: string;
  setInputLanguage: (lang: string) => void;
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  translationMode: 'native' | 'industrial' | 'customer';
  setTranslationMode: (mode: 'native' | 'industrial' | 'customer') => void;
  clearHistoryTrigger: number;
}

const TranslatorView: React.FC<TranslatorViewProps> = ({
  onAskAssistant,
  inputLanguage,
  setInputLanguage,
  targetLanguage,
  setTargetLanguage,
  translationMode,
  setTranslationMode,
  clearHistoryTrigger,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [debouncedInputText, setDebouncedInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [displayedTranslatedText, setDisplayedTranslatedText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Stats / AI feedback
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [detectedLanguageCode, setDetectedLanguageCode] = useState<string>('');
  const [languageConfidence, setLanguageConfidence] = useState<number>(0);
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [clarityScore, setClarityScore] = useState<number>(0);

  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [isWhisperRecording, setIsWhisperRecording] = useState<boolean>(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  // Layout UI states
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Silence detection refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const styleConfig = {
    native: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20 animate-pulse',
      desc: 'Colloquial standard'
    },
    industrial: {
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20 animate-pulse',
      desc: 'Technical precise'
    },
    customer: {
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20 animate-pulse',
      desc: 'Empathetic corporate'
    }
  };

  const currentStyle = styleConfig[translationMode];

  // Load history
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  // Sync clear history signal from parent
  useEffect(() => {
    if (clearHistoryTrigger > 0) {
      setHistory([]);
    }
  }, [clearHistoryTrigger]);

  // Save history
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  // Debounce input text
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedInputText(inputText), 800);
    return () => clearTimeout(handler);
  }, [inputText]);

  // Streaming animation for translated text
  useEffect(() => {
    if (!translatedText) {
      setDisplayedTranslatedText('');
      setIsStreaming(false);
      return;
    }

    setIsStreaming(true);
    const words = translatedText.split(' ');
    let currentText = '';
    let index = 0;

    const interval = setInterval(() => {
      if (index < words.length) {
        currentText += (index === 0 ? '' : ' ') + words[index];
        setDisplayedTranslatedText(currentText);
        index++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 35 + Math.random() * 20);

    return () => {
      clearInterval(interval);
      setIsStreaming(false);
    };
  }, [translatedText]);

  const addToHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    setHistory((prev) => {
      const newItem: HistoryItem = { ...item, id: new Date().toISOString() + Math.random(), timestamp: Date.now() };
      if (prev.some((h) => h.inputText === newItem.inputText && h.translatedText === newItem.translatedText && h.targetLanguage === newItem.targetLanguage)) return prev;
      return [newItem, ...prev].slice(0, 25);
    });
  }, []);

  // Run translation & sentiment
  useEffect(() => {
    if (!debouncedInputText.trim()) {
      setTranslatedText('');
      setSentiment(null);
      setError('');
      setDetectedLanguage('');
      setLanguageConfidence(0);
      setQualityScore(0);
      setClarityScore(0);
      return;
    }

    const run = async () => {
      setError('');
      setIsTranslating(true);
      setIsAnalyzingSentiment(true);

      let currentTranslation = '';
      let currentSentiment: SentimentResult | null = null;
      let currentConf = 0.9;
      let currentQual = 0.9;
      let currentClar = 0.9;
      let currentDetLang = '';
      let translationError = false;

      let styleInstruction = '';
      if (translationMode === 'native') {
        styleInstruction = 'Translate in a natural, colloquial, and fluent native style appropriate for standard, everyday conversation.';
      } else if (translationMode === 'industrial') {
        styleInstruction = 'Translate in a precise, professional, technical, and corporate style suitable for engineering sprints and professional tasks.';
      } else if (translationMode === 'customer') {
        styleInstruction = 'Translate in an extremely polite, welcoming, empathetic, and customer-focused customer satisfaction style.';
      }

      const tp = translateTextGroq(debouncedInputText, inputLanguage, targetLanguage, styleInstruction)
        .then((res) => {
          setTranslatedText(res.translatedText);
          currentTranslation = res.translatedText;
          if (res.detectedLanguageName) {
            setDetectedLanguage(res.detectedLanguageName);
            currentDetLang = res.detectedLanguageName;
          }
          if (res.detectedLanguageCode) {
            setDetectedLanguageCode(res.detectedLanguageCode);
          }
          if (res.languageConfidence) {
            setLanguageConfidence(res.languageConfidence);
            currentConf = res.languageConfidence;
          }
          if (res.qualityScore) {
            setQualityScore(res.qualityScore);
            currentQual = res.qualityScore;
          }
          if (res.clarityScore) {
            setClarityScore(res.clarityScore);
            currentClar = res.clarityScore;
          }
          return res.translatedText;
        })
        .catch((e) => {
          console.error('Translation error:', e);
          translationError = true;
          return '';
        })
        .finally(() => setIsTranslating(false));

      const sp = analyzeSentimentGroq(debouncedInputText)
        .then((r) => {
          setSentiment(r);
          currentSentiment = r;
          return r;
        })
        .catch((e) => {
          console.error('Sentiment error:', e);
          return null;
        })
        .finally(() => setIsAnalyzingSentiment(false));

      await Promise.all([tp, sp]);

      if (translationError) {
        setError('Failed to translate text. Please try again.');
      } else if (currentTranslation && currentSentiment) {
        const targetLanguageName = LANGUAGES.find((l) => l.code === targetLanguage)?.name || '';
        addToHistory({
          inputText: debouncedInputText,
          translatedText: currentTranslation,
          sentiment: currentSentiment,
          targetLanguage,
          targetLanguageName,
          languageConfidence: currentConf,
          qualityScore: currentQual,
          clarityScore: currentClar,
          detectedLanguageName: currentDetLang,
        });
      }
    };

    run();
  }, [debouncedInputText, inputLanguage, targetLanguage, translationMode, addToHistory]);

  // Speech Recognition setup (Web API)
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = inputLanguage === 'auto' ? (navigator.language || 'en') : inputLanguage;

    recognition.onstart = () => {
      setIsRecording(true);
      setError('');
    };
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) {
        setInputText((prev) => {
          const t = prev.trim();
          return t ? `${t} ${finalTranscript.trim()}` : finalTranscript.trim();
        });
      }
    };
    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied.');
        setIsRecording(false);
      } else if (event.error !== 'no-speech') {
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      }
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    return () => recognitionRef.current?.abort();
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = inputLanguage === 'auto' ? (navigator.language || 'en') : inputLanguage;
      if (isRecording) recognitionRef.current.stop();
    }
  }, [inputLanguage]);

  const startWhisperRecording = async () => {
    try {
      setError('');
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

        setIsTranslating(true);
        try {
          const text = await transcribeAudioGroq(audioBlob, inputLanguage);
          if (text.trim()) {
            setInputText((prev) => {
              const t = prev.trim();
              return t ? `${t} ${text.trim()}` : text.trim();
            });
          }
        } catch (err: any) {
          setError('Transcription failed: ' + err.message);
        } finally {
          setIsTranslating(false);
        }
      };

      // Silence detection trigger
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
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
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

          if (Date.now() - lastSoundTime > 3000) {
            stopWhisperRecording();
          } else {
            animationFrameRef.current = requestAnimationFrame(checkSilence);
          }
        };

        animationFrameRef.current = requestAnimationFrame(checkSilence);
      } catch (vadErr) {
        console.error('VAD initialization failed:', vadErr);
      }

      mediaRecorder.start();
      setIsWhisperRecording(true);
    } catch (err: any) {
      setError('Failed to access microphone: ' + err.message);
    }
  };

  const stopWhisperRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsWhisperRecording(false);
    }
  };

  const handleToggleRecording = () => {
    const hasGroqKey = !!import.meta.env.VITE_GROQ_API_KEY;
    if (hasGroqKey) {
      isWhisperRecording ? stopWhisperRecording() : startWhisperRecording();
      return;
    }
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setError('');
      recognitionRef.current.lang = inputLanguage;
      try {
        recognitionRef.current.start();
      } catch (e) {
        setError('Could not start microphone. Refresh and try again.');
      }
    }
  };

  const handleSpeak = useCallback(async () => {
    if (!translatedText) return;
    if (isSpeaking) {
      audioRef.current?.pause();
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    setError('');

    const hasGroqKey = !!import.meta.env.VITE_GROQ_API_KEY;
    if (hasGroqKey && isGroqTtsActive()) {
      try {
        const blob = await generateSpeechGroq(translatedText, targetLanguage);
        const url = URL.createObjectURL(blob);
        if (!audioRef.current) {
          const audio = new Audio(url);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => speakNative();
          audioRef.current = audio;
        } else {
          audioRef.current.src = url;
        }
        audioRef.current.playbackRate = speechRate;
        audioRef.current.play();
      } catch {
        speakNative();
      }
    } else {
      speakNative();
    }

    function speakNative() {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(translatedText);
      u.lang = targetLanguage;
      u.rate = speechRate;

      let wordCount = translatedText.split(/\s+/).length;
      if (['zh', 'ja', 'ko'].some((langCode) => targetLanguage.startsWith(langCode))) {
        wordCount = translatedText.length;
      }
      const estimatedDurationMs = Math.max(3000, (wordCount * 400) / speechRate + 3000);

      let didComplete = false;
      const completeSpeech = () => {
        if (didComplete) return;
        didComplete = true;
        clearTimeout(backupTimer);
        setIsSpeaking(false);
      };

      u.onend = completeSpeech;
      u.onerror = () => {
        setError('Text-to-speech error.');
        completeSpeech();
      };

      const backupTimer = setTimeout(() => {
        if (!didComplete) {
          window.speechSynthesis.cancel();
          completeSpeech();
        }
      }, estimatedDurationMs);

      window.speechSynthesis.speak(u);
    }
  }, [translatedText, targetLanguage, isSpeaking, speechRate]);

  useEffect(() => () => {
    window.speechSynthesis.cancel();
    audioRef.current?.pause();
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
  }, []);

  useEffect(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      audioRef.current?.pause();
      setIsSpeaking(false);
    }
  }, [translatedText]);

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const loadFromHistory = (item: HistoryItem) => {
    setInputText(item.inputText);
    setTargetLanguage(item.targetLanguage);
    if (item.detectedLanguageName) setDetectedLanguage(item.detectedLanguageName);
    if (item.languageConfidence) setLanguageConfidence(item.languageConfidence);
    if (item.qualityScore) setQualityScore(item.qualityScore);
    if (item.clarityScore) setClarityScore(item.clarityScore);
  };

  const renderSentimentBadge = () => {
    if (!sentiment) return null;
    const colors = {
      [SentimentLabel.Positive]: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      [SentimentLabel.Negative]: 'text-red-400 bg-red-500/10 border-red-500/20',
      [SentimentLabel.Neutral]: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
    };
    return (
      <div
        className={`px-3 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${colors[sentiment.sentiment]}`}
        title={`${sentiment.explanation} (Intensity: ${Math.round(sentiment.intensity * 100)}%)`}
      >
        <span>
          {sentiment.sentiment === SentimentLabel.Positive && '😊'}
          {sentiment.sentiment === SentimentLabel.Negative && '😢'}
          {sentiment.sentiment === SentimentLabel.Neutral && '😐'}
        </span>
        <span className="capitalize">{sentiment.sentiment}</span>
        <span className="text-white/30">|</span>
        <span className="text-[9px]">Tone: {sentiment.tone}</span>
      </div>
    );
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {}
  };

  return (
    <div className="w-full flex flex-col gap-8 items-center justify-center min-h-[70vh]">
      
      {/* Floating Workspace Settings Panel (Boundary-less glass capsule) */}
      <div className="glass-pill px-6 py-2.5 flex items-center justify-between gap-6 w-full max-w-4xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        
        {/* Language Flow Selector */}
        <div className="flex items-center gap-3">
          <select
            value={inputLanguage}
            onChange={(e) => setInputLanguage(e.target.value)}
            className="bg-transparent text-xs font-bold text-zinc-700 dark:text-zinc-300 border-none outline-none cursor-pointer hover:text-black dark:hover:text-white transition-colors"
          >
            <option value="auto" className="bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-300">Auto-Detect Language</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-300">
                {l.name}
              </option>
            ))}
          </select>

          <span className="text-zinc-400 dark:text-zinc-500 text-xs">→</span>

          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="bg-transparent text-xs font-bold text-zinc-700 dark:text-zinc-300 border-none outline-none cursor-pointer hover:text-black dark:hover:text-white transition-colors"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-300">
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Translation Register Switches */}
        <div className="flex items-center gap-3">
          
          <div className="flex items-center bg-zinc-800/10 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl p-0.5">
            {(['native', 'industrial', 'customer'] as const).map((modeOpt) => {
              const active = translationMode === modeOpt;
              return (
                <button
                  key={modeOpt}
                  onClick={() => setTranslationMode(modeOpt)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    active ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {modeOpt}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4 bg-zinc-200 dark:bg-white/10" />

          {/* History drawer trigger button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200 hover:bg-zinc-800/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
            title="Open Timeline History"
          >
            <HistoryIcon className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Timeline</span>
          </button>
        </div>

      </div>

      {/* Boundary-less Split Pane Studio Workspace */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Left column: Boundary-less Writing Space */}
        <div className="glass-panel p-8 flex flex-col justify-between min-h-[360px] relative transition-all duration-300 group hover:border-zinc-300/40 dark:hover:border-white/15">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-white/5">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse`} />
              Source Input
            </span>
            {inputText && (
              <button
                onClick={() => {
                  setInputText('');
                  setTranslatedText('');
                  setSentiment(null);
                  setError('');
                }}
                className="text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-lg hover:bg-zinc-800/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Clear input"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write a message or trigger voice capture..."
            className="flex-grow w-full py-6 bg-transparent border-none text-base leading-relaxed text-zinc-850 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none resize-none min-h-[220px]"
          />

          <div className="pt-4 border-t border-zinc-200/50 dark:border-white/5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-550">
            <span>{inputText.length} characters</span>

            {/* Glowing Micro-Mic Button */}
            <div className="relative">
              {(isWhisperRecording || isRecording) && (
                <span className="absolute -inset-1.5 bg-red-500 rounded-full animate-ping opacity-30" />
              )}
              <button
                onClick={handleToggleRecording}
                className={`p-3 rounded-full hover-scale cursor-pointer transition-all duration-300 shadow-md ${
                  isRecording || isWhisperRecording
                    ? 'bg-red-600 text-white'
                    : 'bg-indigo-600 text-white shadow-lg'
                }`}
                title={isRecording || isWhisperRecording ? 'Stop speech capturing' : 'Start speech capturing'}
              >
                {isRecording || isWhisperRecording ? (
                  <StopIcon className="w-4 h-4" />
                ) : (
                  <MicrophoneIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Translucent Translation Bubble View */}
        <div className="glass-panel p-8 flex flex-col justify-between min-h-[360px] relative border-l border-zinc-200/50 dark:border-white/5 transition-all duration-300 group hover:border-zinc-300/40 dark:hover:border-white/15">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-white/5">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${currentStyle.color} ${currentStyle.border}`} />
              Translation Link
            </span>
            {isTranslating && <SpinnerIcon className="w-4 h-4 animate-spin text-zinc-500 dark:text-zinc-400" />}
          </div>

          <div className="flex-grow py-6 min-h-[220px]">
            {displayedTranslatedText ? (
              <div className="space-y-4">
                <p className="text-base leading-relaxed text-zinc-850 dark:text-zinc-100 text-glow">
                  {displayedTranslatedText}
                  {isStreaming && <span className={`inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse`} />}
                </p>

                {/* Floating Metric badging inline */}
                {!isTranslating && (
                  <div className="flex flex-wrap items-center gap-2 pt-4">
                    {renderSentimentBadge()}
                    
                    {qualityScore > 0 && (
                      <span
                        className="px-2 py-0.5 rounded-full bg-zinc-800/5 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[9px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                        title={`Clarity translation score: ${Math.round(qualityScore * 100)}%`}
                      >
                        Quality: {Math.round(qualityScore * 100)}%
                      </span>
                    )}

                    {clarityScore > 0 && (
                      <span
                        className="px-2 py-0.5 rounded-full bg-zinc-800/5 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[9px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                        title={`Readability score: ${Math.round(clarityScore * 100)}%`}
                      >
                        Clarity: {Math.round(clarityScore * 100)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : isTranslating ? (
              <p className="text-zinc-550 dark:text-zinc-500 italic text-sm animate-pulse">Engaging neural translation...</p>
            ) : (
              <p className="text-zinc-550 dark:text-zinc-500 italic text-sm">Awaiting input stream to begin translation link...</p>
            )}

            {error && <p className="text-red-500 dark:text-red-400 text-xs mt-4 font-semibold">{error}</p>}
          </div>

          {/* Inline speak & grammar features */}
          <div className="pt-4 border-t border-zinc-200/50 dark:border-white/5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {translatedText && (
                <>
                  <button
                    onClick={() =>
                      onAskAssistant(
                        `Explain vocabulary rules or give feedback on this translation:\nSource text: "${inputText}"\nTranslated: "${translatedText}"`
                      )
                    }
                    className="px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-zinc-800/5 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white cursor-pointer transition-colors"
                  >
                    ✨ Grammar Breakdown
                  </button>

                  {/* Playback speed slider */}
                  <div className="flex items-center gap-1.5 bg-zinc-800/5 dark:bg-white/5 px-2.5 py-1.5 border border-zinc-200 dark:border-white/10 rounded-xl">
                    <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 w-5">{speechRate}x</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.25"
                      value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      className="w-12 h-1 bg-zinc-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            {translatedText && (
              <button
                onClick={handleSpeak}
                className={`p-2.5 rounded-full border hover-scale transition-all ${
                  isSpeaking ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-zinc-800/5 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-550 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200'
                } cursor-pointer`}
                title="Speak text"
              >
                {isSpeaking ? <StopIcon className="w-4 h-4" /> : <SpeakerIcon className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Dynamic Slide-out History Timeline Overlay */}
      {isHistoryOpen && (
        <div
          onClick={() => setIsHistoryOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm glass-panel h-full rounded-l-3xl rounded-r-none border-l border-zinc-200 dark:border-white/10 p-6 flex flex-col justify-between overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/50 dark:border-white/5">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">Timeline Logs</span>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-1 hover:bg-zinc-800/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Timeline scroll area */}
            <div className="flex-grow overflow-y-auto py-6 divide-y divide-zinc-200/50 dark:divide-white/5">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500 text-xs italic text-center">
                  No log entries stored yet. Write messages to populate.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      loadFromHistory(item);
                      setIsHistoryOpen(false);
                    }}
                    className="py-4 first:pt-0 cursor-pointer group flex flex-col gap-1 text-left"
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                      <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-indigo-650 dark:text-indigo-400 uppercase font-bold tracking-wider">
                        {item.detectedLanguageName ? `${item.detectedLanguageName} → ${item.targetLanguageName}` : `Auto → ${item.targetLanguageName}`}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-650 dark:text-zinc-400 truncate group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors mt-0.5">{item.inputText}</p>
                    <p className="text-xs text-zinc-850 dark:text-zinc-100 font-semibold truncate mt-0.5">{item.translatedText}</p>

                    <div className="flex items-center gap-3 mt-1 text-[9px]">
                      {item.sentiment && (
                        <span className="text-zinc-500 dark:text-zinc-400 capitalize">
                          Tone: {item.sentiment.tone}
                        </span>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 ml-auto text-zinc-550 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer"
                        title="Delete log"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer wipe */}
            {history.length > 0 && (
              <div className="pt-4 border-t border-zinc-200/50 dark:border-white/5">
                <button
                  onClick={handleClearHistory}
                  className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-650 dark:text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Wipe Timeline
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslatorView;
