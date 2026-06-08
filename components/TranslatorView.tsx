import React, { useState, useEffect, useRef, useCallback } from 'react';
import { translateTextGroq, analyzeSentimentGroq, transcribeAudioGroq, generateSpeechGroq, isGroqTtsActive } from '../services/groqService';
import { SentimentResult, Language, HistoryItem, SentimentLabel } from '../types';
import { LANGUAGES } from '../constants';
import SentimentDisplay from './SentimentDisplay';
import FramePlayer from './FramePlayer';
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
}

type TranslationMode = 'native' | 'industrial' | 'customer';

const TranslatorView: React.FC<TranslatorViewProps> = ({ onAskAssistant }) => {
  const [inputText, setInputText] = useState<string>('');
  const [debouncedInputText, setDebouncedInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [displayedTranslatedText, setDisplayedTranslatedText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [targetLanguage, setTargetLanguage] = useState<string>('es');

  // Dynamic translation mode
  const [translationMode, setTranslationMode] = useState<TranslationMode>('industrial');

  const [inputLanguage, setInputLanguage] = useState<string>('auto');
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

  const isCjkInput = ['zh', 'ja', 'ko'].includes(inputLanguage) || ['zh', 'ja', 'ko'].includes(detectedLanguageCode);
  const isCjkTarget = ['zh', 'ja', 'ko'].includes(targetLanguage);

  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Silence detection refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Dynamic layout styling config based on translation mode
  const modeStyles = {
    native: {
      primary: 'emerald-600',
      accent: 'emerald-500',
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-200',
      focusRing: 'focus-within:ring-emerald-200',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      badge: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
      text: 'text-emerald-700',
      rawText: 'Colloquial Native Translator'
    },
    industrial: {
      primary: 'blue-600',
      accent: 'blue-500',
      bg: 'bg-blue-50/50',
      border: 'border-blue-200',
      focusRing: 'focus-within:ring-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      badge: 'bg-blue-50 border border-blue-200 text-blue-700',
      text: 'text-blue-700',
      rawText: 'Industrialized Technical Translator'
    },
    customer: {
      primary: 'amber-600',
      accent: 'amber-500',
      bg: 'bg-amber-50/50',
      border: 'border-amber-200',
      focusRing: 'focus-within:ring-amber-200',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
      badge: 'bg-amber-50 border border-amber-200 text-amber-700',
      text: 'text-amber-700',
      rawText: 'Customer Satisfaction Translator'
    }
  };

  const style = modeStyles[translationMode];

  // Load history
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    } catch (e) { console.error('Failed to load history', e); }
  }, []);

  // Save history
  useEffect(() => {
    try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history)); }
    catch (e) { console.error('Failed to save history', e); }
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
    }, 40 + Math.random() * 25);

    return () => {
      clearInterval(interval);
      setIsStreaming(false);
    };
  }, [translatedText]);

  const addToHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    setHistory(prev => {
      const newItem: HistoryItem = { ...item, id: new Date().toISOString() + Math.random(), timestamp: Date.now() };
      if (prev.some(h => h.inputText === newItem.inputText && h.translatedText === newItem.translatedText && h.targetLanguage === newItem.targetLanguage)) return prev;
      return [newItem, ...prev].slice(0, 30);
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

      // Map translation mode style instruction
      let styleInstruction = '';
      if (translationMode === 'native') {
        styleInstruction = 'Translate in a natural, colloquial, and fluent native style appropriate for standard, everyday conversation.';
      } else if (translationMode === 'industrial') {
        styleInstruction = 'Translate in a precise, professional, technical, and corporate style suitable for engineering sprints and professional tasks.';
      } else if (translationMode === 'customer') {
        styleInstruction = 'Translate in an extremely polite, welcoming, empathetic, and customer-focused customer satisfaction style.';
      }

      const tp = translateTextGroq(debouncedInputText, inputLanguage, targetLanguage, styleInstruction)
        .then(res => {
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
        .catch(e => { console.error('Translation error:', e); translationError = true; return ''; })
        .finally(() => setIsTranslating(false));

      const sp = analyzeSentimentGroq(debouncedInputText)
        .then(r => { setSentiment(r); currentSentiment = r; return r; })
        .catch(e => { console.error('Sentiment error:', e); return null; })
        .finally(() => setIsAnalyzingSentiment(false));

      await Promise.all([tp, sp]);

      if (translationError) {
        setError('Failed to translate text. Please try again.');
      } else if (currentTranslation && currentSentiment) {
        const targetLanguageName = LANGUAGES.find(l => l.code === targetLanguage)?.name || '';
        addToHistory({ 
          inputText: debouncedInputText, 
          translatedText: currentTranslation, 
          sentiment: currentSentiment, 
          targetLanguage, 
          targetLanguageName,
          languageConfidence: currentConf,
          qualityScore: currentQual,
          clarityScore: currentClar,
          detectedLanguageName: currentDetLang
        });
      }
    };

    run();
  }, [debouncedInputText, inputLanguage, targetLanguage, translationMode, addToHistory]);

  // Speech Recognition (Web API)
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = inputLanguage === 'auto' ? (navigator.language || 'en') : inputLanguage;
    
    recognition.onstart = () => { setIsRecording(true); setError(''); };
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) setInputText(prev => { const t = prev.trim(); return t ? `${t} ${finalTranscript.trim()}` : finalTranscript.trim(); });
    };
    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') { setError('Microphone access denied.'); setIsRecording(false); }
      else if (event.error !== 'no-speech') { setError(`Speech recognition error: ${event.error}`); setIsRecording(false); }
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

        setIsTranslating(true);
        try {
          const text = await transcribeAudioGroq(audioBlob, inputLanguage);
          if (text.trim()) setInputText(prev => { const t = prev.trim(); return t ? `${t} ${text.trim()}` : text.trim(); });
        } catch (err: any) { setError('Transcription failed: ' + err.message); }
        finally { setIsTranslating(false); }
      };

      // VAD / silence auto-termination logic
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
          
          if (Date.now() - lastSoundTime > 3000) { // 3-second pause auto-termination
            console.log("Silence auto-termination triggered. Stopping recording.");
            stopWhisperRecording();
          } else {
            animationFrameRef.current = requestAnimationFrame(checkSilence);
          }
        };
        
        animationFrameRef.current = requestAnimationFrame(checkSilence);
      } catch (vadErr) {
        console.error("VAD initialization failed:", vadErr);
      }

      mediaRecorder.start();
      setIsWhisperRecording(true);
    } catch (err: any) { setError('Failed to access microphone: ' + err.message); }
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
    if (!recognitionRef.current) { setError('Speech recognition is not supported in this browser.'); return; }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setError('');
      recognitionRef.current.lang = inputLanguage;
      try { recognitionRef.current.start(); } catch (e) { setError('Could not start microphone. Refresh and try again.'); }
    }
  };

  const handleSpeak = useCallback(async () => {
    if (!translatedText) return;
    if (isSpeaking) { audioRef.current?.pause(); window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    setIsSpeaking(true); setError('');

    const hasGroqKey = !!import.meta.env.VITE_GROQ_API_KEY;
    if (hasGroqKey && isGroqTtsActive()) {
      try {
        const blob = await generateSpeechGroq(translatedText, targetLanguage);
        const url = URL.createObjectURL(blob);
        if (!audioRef.current) {
          const audio = new Audio(url);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => { speakNative(); };
          audioRef.current = audio;
        } else { audioRef.current.src = url; }
        audioRef.current.playbackRate = speechRate;
        audioRef.current.play();
      } catch { speakNative(); }
    } else { speakNative(); }

    function speakNative() {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(translatedText);
      u.lang = targetLanguage; u.rate = speechRate;

      let wordCount = translatedText.split(/\s+/).length;
      if (['zh', 'ja', 'ko'].some(langCode => targetLanguage.startsWith(langCode))) {
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
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
  }, []);
  useEffect(() => { if (isSpeaking) { window.speechSynthesis.cancel(); audioRef.current?.pause(); setIsSpeaking(false); } }, [translatedText]);

  const deleteHistoryItem = (id: string) => setHistory(prev => prev.filter(item => item.id !== id));
  const clearHistory = () => setHistory([]);
  const loadFromHistory = (item: HistoryItem) => {
    setInputText(item.inputText);
    setTargetLanguage(item.targetLanguage);
    if (item.detectedLanguageName) setDetectedLanguage(item.detectedLanguageName);
    if (item.languageConfidence) setLanguageConfidence(item.languageConfidence);
    if (item.qualityScore) setQualityScore(item.qualityScore);
    if (item.clarityScore) setClarityScore(item.clarityScore);
  };

  const renderSentimentIcon = (s: SentimentLabel) => {
    const cls = 'w-4 h-4';
    switch (s) {
      case SentimentLabel.Positive: return <PositiveIcon className={`${cls} text-emerald-500`} />;
      case SentimentLabel.Negative: return <NegativeIcon className={`${cls} text-red-500`} />;
      default: return <NeutralIcon className={`${cls} text-slate-400`} />;
    }
  };

  const selectCls = 'bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm outline-none font-semibold cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm';

  return (
    <>
      {/* Left Column - Decryptor Workspace (70%) */}
      <div className="col-span-full lg:col-span-7 flex flex-col gap-6">
        
        {/* Settings Control Panel */}
        <div className="cyber-terminal p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Translator Mode dynamic selector */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Engine:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {(['native', 'industrial', 'customer'] as TranslationMode[]).map((modeOpt) => {
                const isActive = translationMode === modeOpt;
                let activeClass = '';
                if (modeOpt === 'native') activeClass = isActive ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900';
                if (modeOpt === 'industrial') activeClass = isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900';
                if (modeOpt === 'customer') activeClass = isActive ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900';

                return (
                  <button
                    key={modeOpt}
                    onClick={() => setTranslationMode(modeOpt)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all duration-200 capitalize ${activeClass}`}
                  >
                    {modeOpt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center justify-end">
            {/* Source Lang dropdown */}
            <div className="w-full sm:w-auto relative">
              <select value={inputLanguage} onChange={e => setInputLanguage(e.target.value)} className={selectCls}>
                <option value="auto">🔍 Auto-Detect Language</option>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>

            <div className="hidden sm:flex items-center justify-center text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>

            {/* Target Lang dropdown */}
            <div className="w-full sm:w-auto">
              <select value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} className={selectCls}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Main Studio workspace Grid */}
        <div className="grid grid-cols-1 grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-6">

          {/* Input box */}
          <div className={`container-query-parent relative group flex flex-col min-h-[300px] cyber-terminal transition-all duration-300 responsive-card ${style.focusRing}`}>
            
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full bg-${style.primary} animate-pulse`} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans">
                  Source Text ({inputLanguage === 'auto' ? `Detecting${detectedLanguage ? `: ${detectedLanguage}` : ''}` : LANGUAGES.find(l => l.code === inputLanguage)?.name})
                </span>
              </div>
              {inputText && (
                <button 
                  onClick={() => { setInputText(''); setTranslatedText(''); setSentiment(null); setError(''); textareaRef.current?.focus(); }} 
                  className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer" 
                  title="Clear content"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type or speak text here..."
              className={`flex-grow w-full p-6 bg-transparent border-none resize-y min-h-[220px] focus:ring-0 text-sm leading-relaxed text-slate-800 placeholder-slate-400 outline-none responsive-text font-sans`}
            />

            {/* Character counter & Whisper/recording trigger */}
            <div className="p-4 flex items-center justify-between border-t border-slate-100 bg-slate-50">
              <span className="text-xs text-slate-400 font-medium font-sans">{inputText.length} characters</span>
              <div className="relative">
                {(isWhisperRecording || isRecording) && (
                  <span className="absolute -inset-1.5 bg-red-500 rounded-full animate-ping opacity-25" />
                )}
                <button
                  onClick={handleToggleRecording}
                  className={`p-3 rounded-xl transition-all duration-300 shadow-md ${
                    isRecording || isWhisperRecording
                      ? 'bg-red-600 text-white scale-105'
                      : `cyber-button-${translationMode === 'native' ? 'pink' : translationMode === 'industrial' ? 'cyan' : 'pink'} rounded-xl`
                  } cursor-pointer`}
                  title={isRecording || isWhisperRecording ? 'Stop Recording' : 'Voice Input'}
                >
                  {isRecording || isWhisperRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Output box */}
          <div className="container-query-parent relative flex flex-col min-h-[300px] cyber-terminal transition-all duration-300 responsive-card">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full bg-${style.accent} animate-pulse`} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans">
                  Translation Output ({LANGUAGES.find(l => l.code === targetLanguage)?.name})
                </span>
              </div>
              {isTranslating && <SpinnerIcon className="w-4 h-4 animate-spin text-slate-500" />}
            </div>

            <div className="flex-grow p-6 min-h-[220px] text-sm font-sans">
              {displayedTranslatedText ? (
                <p className="leading-relaxed text-slate-800 whitespace-pre-wrap responsive-text">
                  {displayedTranslatedText}
                  {isStreaming && (
                    <span className={`inline-block w-1.5 h-4 ml-1 bg-${style.primary} animate-pulse`} />
                  )}
                </p>
              ) : isTranslating ? (
                <p className="text-slate-400 italic animate-pulse">AI generating translation...</p>
              ) : (
                <p className="text-slate-400 italic">Waiting for text input...</p>
              )}
              {error && <p className="text-red-500 text-sm mt-4 font-medium">{error}</p>}
            </div>

            {/* Quick Co-pilot & Speak controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {translatedText && (
                  <>
                    <button
                      onClick={() => onAskAssistant(`I am working on this translation from ${inputLanguage === 'auto' ? 'Auto-Detect' : LANGUAGES.find(l => l.code === inputLanguage)?.name} to ${LANGUAGES.find(l => l.code === targetLanguage)?.name}:\n\nInput: "${inputText}"\nTranslated: "${translatedText}"\n\nCan you explain the key grammar structures or suggest idiomatic alternatives?`)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`}
                    >
                      ✨ Grammar & Phrases
                    </button>

                    {/* Speech rate slider */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm font-sans text-xs">
                      <span className="text-[10px] font-bold text-slate-400 w-6 text-right">{speechRate}x</span>
                      <input
                        type="range" min="0.5" max="2" step="0.25" value={speechRate}
                        onChange={e => setSpeechRate(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </>
                )}
              </div>

              {translatedText && (
                <button
                  onClick={handleSpeak}
                  className={`p-2.5 rounded-lg border transition-all shadow-sm ${isSpeaking ? 'bg-indigo-50 border-indigo-200 text-indigo-600 scale-105' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'} cursor-pointer`}
                  title="Speak Text"
                >
                  {isSpeaking ? <StopIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Translation History Timeline */}
        {history.length > 0 && (
          <div className="cyber-terminal overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans">Translation History</span>
              </div>
              <button 
                onClick={clearHistory} 
                className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <TrashIcon className="w-3.5 h-3.5" /> Clear History
              </button>
            </div>
            
            <div className="p-6">
              <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-6">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className="relative group cursor-pointer animate-in fade-in duration-300"
                    onClick={() => loadFromHistory(item)}
                  >
                    {/* Circle dot on the line */}
                    <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-200 group-hover:border-indigo-500 transition-colors flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors" />
                    </span>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 group-hover:border-slate-200 rounded-xl transition-all">
                      <div className="flex-grow min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-[10px] font-bold text-indigo-600 uppercase">
                            {item.detectedLanguageName ? `${item.detectedLanguageName} → ${item.targetLanguageName}` : `Auto → ${item.targetLanguageName}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate font-sans">{item.inputText}</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5 font-sans">{item.translatedText}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                        {item.sentiment && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-600 shadow-sm font-sans">
                            {renderSentimentIcon(item.sentiment.sentiment)}
                            <span className="capitalize">{item.sentiment.sentiment}</span>
                          </div>
                        )}
                        
                        <button
                          onClick={e => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 shadow-sm transition-all cursor-pointer"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - AI Insights (30%) */}
      <div className="col-span-full lg:col-span-3 flex flex-col gap-6">
        
        {/* Detection Confidence Card */}
        {detectedLanguage && inputLanguage === 'auto' && (
          <div className="cyber-terminal p-4 flex items-center justify-between bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Detected Language</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600">
                {detectedLanguage.toUpperCase()}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {Math.round(languageConfidence * 100)}% Match
              </span>
            </div>
          </div>
        )}

        {/* Translation Quality Metrics */}
        {translatedText && !isTranslating && (
          <div className="flex flex-col gap-4">
            {[
              { label: 'Translation Quality', score: qualityScore, color: 'from-emerald-600 to-green-400' },
              { label: 'Grammar & Clarity', score: clarityScore, color: 'from-blue-600 to-indigo-400' },
              { label: 'Confidence Match', score: languageConfidence, color: 'from-purple-600 to-pink-500' }
            ].map((stat, sIdx) => {
              const pct = Math.round(stat.score * 100);
              return (
                <div key={sIdx} className="cyber-terminal p-4 flex flex-col justify-between bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-2 font-sans">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                    <span className="text-sm font-extrabold text-slate-800">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sentiment Insights Panel */}
        <div className="cyber-terminal overflow-hidden flex flex-col flex-shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans">Tone & Sentiment Analysis</span>
          </div>
          <div className="p-5 bg-transparent">
            <SentimentDisplay sentimentResult={sentiment} isLoading={isAnalyzingSentiment} />
          </div>
        </div>

        {/* Dynamic Video Guide Walkthrough */}
        <div className="cyber-terminal bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Live Translation Walkthrough</h4>
          <video
            src="/trail.mp4"
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-lg overflow-hidden border border-slate-100 shadow-sm"
            style={{ display: 'block' }}
          />
          <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
            Click the play button to see how the system captures voices, draws real-time wave signals, and translates speech on the fly.
          </p>
        </div>
      </div>
    </>
  );
};

export default TranslatorView;
