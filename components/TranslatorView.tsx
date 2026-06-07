import React, { useState, useEffect, useRef, useCallback } from 'react';
import { translateTextGroq, analyzeSentimentGroq, transcribeAudioGroq, generateSpeechGroq, isGroqTtsActive } from '../services/groqService';
import { SentimentResult, Language, HistoryItem, SentimentLabel } from '../types';
import { LANGUAGES } from '../constants';
import SentimentDisplay from './SentimentDisplay';
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
  addXp?: (amount: number) => void;
}

const TranslatorView: React.FC<TranslatorViewProps> = ({ onAskAssistant, addXp }) => {
  const [inputText, setInputText] = useState<string>('');
  const [debouncedInputText, setDebouncedInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [displayedTranslatedText, setDisplayedTranslatedText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [targetLanguage, setTargetLanguage] = useState<string>('es');

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

      const tp = translateTextGroq(debouncedInputText, inputLanguage, targetLanguage)
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
        if (addXp) addXp(15); // Trigger XP reward!
      }
    };

    run();
  }, [debouncedInputText, inputLanguage, targetLanguage, addToHistory]);

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
        } catch (err: any) { setError('Whisper transcription failed: ' + err.message); }
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
            console.log("Silence auto-termination triggered (3 second pause). Stopping recording.");
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
        wordCount = translatedText.length; // Use character count for CJK languages
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
          console.warn("SpeechSynthesis onend failed to fire. Triggering backup resume.");
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
      case SentimentLabel.Positive: return <PositiveIcon className={`${cls} text-teal-500`} />;
      case SentimentLabel.Negative: return <NegativeIcon className={`${cls} text-red-500`} />;
      default: return <NeutralIcon className={`${cls} text-muted`} />;
    }
  };

  const selectCls = 'bg-black border border-primary text-primary px-4 py-3 text-xs outline-none font-bold cursor-pointer font-mono tracking-widest';

  return (
    <>
      {/* Left Column - Decryptor Workspace (70%) */}
      <div className="lg:col-span-7 flex flex-col gap-6 lg:overflow-y-auto pr-2 lg:h-full min-h-0 scrollbar-thin">
        
        {/* Settings Control Panel */}
        <div className="cyber-terminal p-4 rounded-none flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/40">
          <div className="flex flex-col sm:flex-row gap-3 w-full items-center">
            
            {/* Source Lang dropdown */}
            <div className="w-full sm:w-auto relative">
              <select value={inputLanguage} onChange={e => setInputLanguage(e.target.value)} className={selectCls}>
                <option value="auto">🔍 AUTO-DETECT SIGNAL</option>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="hidden sm:flex items-center justify-center text-primary/70 animate-pulse">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>

            {/* Target Lang dropdown */}
            <div className="w-full sm:w-auto">
              <select value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} className={selectCls}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>🗺️ {l.name.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Main Studio workspace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Input box */}
          <div className="container-query-parent relative group flex flex-col h-[380px] md:h-[420px] cyber-terminal overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 transition-all duration-300 responsive-card">
            
            <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-black/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-primary animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
                  RAW INPUT FREQUENCY LOG ({inputLanguage === 'auto' ? `Auto-Detect${detectedLanguage ? `: ${detectedLanguage}` : ''}` : LANGUAGES.find(l => l.code === inputLanguage)?.name})
                </span>
              </div>
              {inputText && (
                <button 
                  onClick={() => { setInputText(''); setTranslatedText(''); setSentiment(null); setError(''); textareaRef.current?.focus(); }} 
                  className="text-muted hover:text-red-500 p-1 rounded-none hover:bg-red-500/5 transition-colors cursor-pointer" 
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
              placeholder="Inject encrypted data stream or start vocal capture..."
              className={`flex-grow w-full p-6 bg-transparent border-none resize-none focus:ring-0 text-sm leading-relaxed text-foreground placeholder-muted outline-none scrollbar-thin responsive-text ${isCjkInput ? 'font-sans' : 'font-mono'}`}
            />

            {/* Character counter & Whisper/recording trigger */}
            <div className="p-4 flex items-center justify-between border-t border-primary/20 bg-black/40">
              <span className="text-xs text-muted font-mono">{inputText.length} bits</span>
              <div className="relative">
                {(isWhisperRecording || isRecording) && (
                  <span className="absolute -inset-1.5 bg-red-500 rounded-full animate-ping opacity-25" />
                )}
                <button
                  onClick={handleToggleRecording}
                  className={`p-3.5 transition-all duration-300 shadow-md ${
                    isRecording || isWhisperRecording
                      ? 'bg-red-600 text-white scale-105'
                      : 'cyber-button rounded-none'
                  } cursor-pointer`}
                  title={isRecording || isWhisperRecording ? 'Terminate Stream' : 'Vocal Uplink'}
                >
                  {isRecording || isWhisperRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Output box */}
          <div className="container-query-parent relative flex flex-col h-[380px] md:h-[420px] cyber-terminal overflow-hidden transition-all duration-300 responsive-card">
            
            <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-black/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-accent animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-accent font-mono">
                  DECRYPTED DATAPACK PAYLOAD ({LANGUAGES.find(l => l.code === targetLanguage)?.name})
                </span>
              </div>
              {isTranslating && <SpinnerIcon className="w-4 h-4 animate-spin text-accent" />}
            </div>

            <div className={`flex-grow p-6 overflow-y-auto min-h-[160px] scrollbar-thin text-sm ${isCjkTarget ? 'font-sans' : 'font-mono'}`}>
              {displayedTranslatedText ? (
                <p className={`leading-relaxed text-foreground whitespace-pre-wrap responsive-text ${isCjkTarget ? 'font-sans' : 'font-mono'}`}>
                  {displayedTranslatedText}
                  {isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-accent animate-pulse shadow-[0_0_8px_var(--accent)]" />
                  )}
                </p>
              ) : isTranslating ? (
                <p className="text-muted italic animate-pulse">Mainframe AI decrypting stream...</p>
              ) : (
                <p className="text-muted italic">Waiting for target signal payload...</p>
              )}
              {error && <p className="text-red-500 text-sm mt-4 font-medium">{error}</p>}
            </div>

            {/* Quick Co-pilot & Speak controls */}
            <div className="p-4 bg-black/40 border-t border-primary/20 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {translatedText && (
                  <>
                    <button
                      onClick={() => onAskAssistant(`I am working on this translation from ${inputLanguage === 'auto' ? 'Auto-Detect' : LANGUAGES.find(l => l.code === inputLanguage)?.name} to ${LANGUAGES.find(l => l.code === targetLanguage)?.name}:\n\nInput: "${inputText}"\nTranslated: "${translatedText}"\n\nCan you explain the key grammar structures or suggest idiomatic alternatives?`)}
                      className="cyber-button px-4 py-2 text-xs"
                    >
                      ✨ ANALYZE CO-PILOT
                    </button>

                    {/* Speech rate slider */}
                    <div className="flex items-center gap-2 bg-black/80 px-3 py-1.5 border border-primary/20 shadow-inner font-mono">
                      <span className="text-[10px] font-mono font-bold text-muted w-6 text-right">{speechRate}x</span>
                      <input
                        type="range" min="0.5" max="2" step="0.25" value={speechRate}
                        onChange={e => setSpeechRate(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </>
                )}
              </div>

              {translatedText && (
                <button
                  onClick={handleSpeak}
                  className={`p-2.5 transition-all shadow-sm border border-primary/45 ${isSpeaking ? 'bg-primary/20 text-primary scale-105' : 'text-muted hover:text-primary'} cursor-pointer`}
                  title="Speak Text"
                >
                  {isSpeaking ? <StopIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chronological History Timeline */}
        {history.length > 0 && (
          <div className="cyber-terminal overflow-hidden bg-black/20">
            <div className="p-4 border-b border-primary/20 bg-black/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">MEM-BUFFER COGNITIVE TIMELINE</span>
              </div>
              <button 
                onClick={clearHistory} 
                className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1 border border-red-500/20 hover:bg-red-500/5 transition-all flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <TrashIcon className="w-3.5 h-3.5" /> PURGE BUFFER
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[300px] scrollbar-thin">
              <div className="relative border-l border-primary/30 ml-3 pl-6 space-y-6">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className="relative group cursor-pointer"
                    onClick={() => loadFromHistory(item)}
                  >
                    {/* Circle dot on the line */}
                    <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 bg-black border border-primary group-hover:bg-primary transition-colors flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-white/0 group-hover:bg-white transition-colors" />
                    </span>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-black/40 hover:bg-black border border-primary/10 hover:border-primary/40 transition-all">
                      <div className="flex-grow min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-mono text-muted">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className="text-[10px] font-bold text-primary uppercase font-mono">
                            {item.detectedLanguageName ? `${item.detectedLanguageName} → ${item.targetLanguageName}` : `Auto → ${item.targetLanguageName}`}
                          </span>
                        </div>
                        <p className={`text-xs text-muted truncate ${['zh', 'ja', 'ko'].some(code => item.inputText.includes(code)) ? 'font-sans' : 'font-mono'}`}>{item.inputText}</p>
                        <p className={`text-sm font-bold text-foreground mt-0.5 ${['zh', 'ja', 'ko'].includes(item.targetLanguage) ? 'font-sans' : 'font-mono'}`}>{item.translatedText}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                        {item.sentiment && (
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-black border border-primary/20 text-[9px] font-bold text-muted shadow-sm font-mono">
                            {renderSentimentIcon(item.sentiment.sentiment)}
                            <span>{item.sentiment.sentiment.toUpperCase()}</span>
                          </div>
                        )}
                        
                        <button
                          onClick={e => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 bg-black border border-red-500/30 text-muted hover:text-red-500 shadow-sm transition-all cursor-pointer"
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
      <div className="lg:col-span-3 flex flex-col gap-6 lg:overflow-y-auto pr-2 lg:h-full min-h-0 scrollbar-thin">
        
        {/* Detection Confidence Card */}
        {detectedLanguage && inputLanguage === 'auto' && (
          <div className="cyber-terminal p-4 flex items-center justify-between bg-black/40">
            <span className="text-xs font-bold text-muted uppercase tracking-wider font-mono">detected locale</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 border border-primary/30 text-xs font-black text-primary font-mono">
                {detectedLanguage.toUpperCase()}
              </span>
              <span className="text-xs font-mono font-bold text-muted">
                {Math.round(languageConfidence * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Translation Quality Metrics */}
        {translatedText && !isTranslating && (
          <div className="flex flex-col gap-4">
            {[
              { label: 'Translation Quality', score: qualityScore, color: 'from-emerald-600 to-green-400' },
              { label: 'Grammar & Clarity', score: clarityScore, color: 'from-cyan-600 to-blue-400' },
              { label: 'AI Match Confidence', score: languageConfidence, color: 'from-fuchsia-600 to-pink-500' }
            ].map((stat, sIdx) => {
              const pct = Math.round(stat.score * 100);
              return (
                <div key={sIdx} className="cyber-terminal p-4 flex flex-col justify-between bg-black/40">
                  <div className="flex justify-between items-center mb-2 font-mono">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">{stat.label}</span>
                    <span className="text-sm font-black text-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 border border-primary/20 rounded-none overflow-hidden">
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
        <div className="cyber-terminal-cyan overflow-hidden flex flex-col flex-shrink-0 bg-black/20">
          <div className="p-4 border-b border-accent/20 bg-black/60 flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-accent animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-accent font-mono">BIOMETRIC PSYCHE READOUT</span>
          </div>
          <div className="p-5 bg-transparent">
            <SentimentDisplay sentimentResult={sentiment} isLoading={isAnalyzingSentiment} />
          </div>
        </div>
      </div>
    </>
  );
};

export default TranslatorView;
