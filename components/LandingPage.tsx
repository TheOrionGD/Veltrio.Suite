import React, { useEffect, useState, useRef } from 'react';
import { translateTextGroq, analyzeSentimentGroq } from '../services/groqService';
import { SentimentResult, SentimentLabel } from '../types';
import { LANGUAGES } from '../constants';
import { PositiveIcon, NegativeIcon, NeutralIcon, SpinnerIcon } from './icons';

interface LandingPageProps {
  onStart: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

interface StageConfig {
  label: string;
  title: string;
  desc: string;
  leftHUD: string;
  rightHUD: string;
  bottomLeft: string;
  align: 'left' | 'right' | 'center';
}

const DESKTOP_STAGES: StageConfig[] = [
  {
    label: '01 / ACOUSTIC CAPTURE',
    title: 'Understanding Begins With Listening',
    desc: 'Veltrio captures every spoken word — mapping vocal frequencies and acoustic signals the moment a conversation begins.',
    leftHUD: 'STT AUDIO PIPELINE: ACTIVE',
    rightHUD: 'WHISPER-V3 MODEL: RUNNING (16KHZ)',
    bottomLeft: 'CORE INTERFACE SYNC',
    align: 'right',
  },
  {
    label: '02 / SPEECH CAPTURE',
    title: 'Fragile Acoustic Threads',
    desc: 'When we cannot share our reality, our shared understanding breaks. The thread becomes fragile, tangling thoughts and isolating ideas.',
    leftHUD: 'SIGNAL FAULT CHECK: ACTIVE',
    rightHUD: 'LATENCY PACKET DEPTH: 120ms',
    bottomLeft: 'SIGNAL QUALITY ERROR',
    align: 'left',
  },
  {
    label: '03 / COGNITIVE FEED',
    title: 'Every Word Is A Signal',
    desc: 'Raw audio is isolated, cleaned, and passed into Veltrio\'s speech capture engine for precise phoneme-level transcription.',
    leftHUD: 'SPEECH CAPTURE: ENGAGED',
    rightHUD: 'PHONEME RESOLUTION: 98.7% ACCURACY',
    bottomLeft: 'CORE SPEECH CAPTURE',
    align: 'right',
  },
  {
    label: '04 / LANGUAGE SEGMENTS',
    title: 'The Babel Separation',
    desc: 'Yet, humanity is divided by over 7,000 languages. In this acoustic maze, nuance gets lost, emotion flattens, and meaning gets distorted.',
    leftHUD: 'DIALECT DISTORTION DETECTED',
    rightHUD: 'SYNTAX MATCH RATE: < 40%',
    bottomLeft: 'SEMANTIC GAP ENGINE',
    align: 'left',
  },
  {
    label: '05 / LANGUAGE DETECTION',
    title: 'Language Identity, Resolved Instantly',
    desc: 'Advanced language detection identifies dialect, script, and linguistic origin — so translation is always precisely targeted.',
    leftHUD: 'LANGUAGE DETECTION: RUNNING',
    rightHUD: 'DETECTION LATENCY: < 80ms',
    bottomLeft: 'INTELLIGENT ROUTER ONLINE',
    align: 'right',
  },
  {
    label: '06 / SENTIMENT ANALYSIS',
    title: 'Tone Decoded Beyond Words',
    desc: 'Veltrio reads emotional tone, intent, and sentiment from every sentence — ensuring meaning is never lost in translation.',
    leftHUD: 'SENTIMENT ENGINE: ONLINE',
    rightHUD: 'VALENCY CONFIDENCE: 98.4% (EXCELLENT)',
    bottomLeft: 'EMOTIONAL INSIGHT STACK',
    align: 'left',
  },
  {
    label: '07 / HUMAN SYNC',
    title: 'Human Sync Delivered',
    desc: 'Speech Capture · Translation · Sentiment Analysis — unified in a single real-time pipeline. Language barriers dissolve.',
    leftHUD: 'FULL PIPELINE: SPEECH · TRANSLATION · SENTIMENT',
    rightHUD: 'PEER-TO-PEER LATENCY: < 5ms',
    bottomLeft: 'REALTIME SYNERGY CORE',
    align: 'right',
  },
  {
    label: '08 / EXPERIENCE ENTRY',
    title: 'Interact with Language',
    desc: 'Try the live engine below. Speak or type to see Veltrio capture meaning, analyze emotion, and translate instantly.',
    leftHUD: 'SANDBOX DESCRIPTOR ONLINE',
    rightHUD: 'VITE LOCAL DEV SERVER',
    bottomLeft: 'VELTRIO EXPERIENCE GATEWAY',
    align: 'center',
  },
];

const MOBILE_STAGES: StageConfig[] = [
  {
    label: '01 / CONVERSATION BEGINS',
    title: 'Two Languages, One Conversation',
    desc: 'Veltrio bridges professionals across languages in real-time — the moment they speak, the system listens.',
    leftHUD: 'VOICE LINK: ESTABLISHED',
    rightHUD: 'WHISPER-V3 MODEL: RUNNING (16KHZ)',
    bottomLeft: 'MOBILE INTERFACE SYNC',
    align: 'center',
  },
  {
    label: '02 / SIGNAL GAP',
    title: 'Acoustic Separation',
    desc: 'When we cannot share our reality, our shared understanding breaks. The thread becomes fragile, isolating ideas.',
    leftHUD: 'ACOUSTIC SHIFT DETECTED',
    rightHUD: 'SIGNAL QUALITY ERROR',
    bottomLeft: 'MOBILE INTERFACE SYNC',
    align: 'center',
  },
  {
    label: '03 / ACOUSTIC BRIDGE',
    title: 'Sound Becomes Data',
    desc: 'Audio waves are captured the instant they leave your lips — English, Spanish, any language — processed immediately.',
    leftHUD: 'SPEECH CAPTURE: ACTIVE',
    rightHUD: 'LANGUAGE PAIR: EN ↔ ES',
    bottomLeft: 'MOBILE INTERFACE SYNC',
    align: 'center',
  },
  {
    label: '04 / BABEL DIVISION',
    title: 'The Translation Gap',
    desc: 'Divided by over 7,000 languages. In this acoustic maze, nuance gets lost, emotion flattens, and meaning gets distorted.',
    leftHUD: 'DIALECT SEGMENTATION ERROR',
    rightHUD: 'SYNTAX MATCH RATE: < 40%',
    bottomLeft: 'MOBILE INTERFACE SYNC',
    align: 'center',
  },
  {
    label: '05 / AI LAYER STACK',
    title: 'Intelligence Stacked In Layers',
    desc: 'Speech Capture · Transcription · Language Detection · Translation Intelligence · Sentiment Analysis · Speech Synthesis.',
    leftHUD: 'PIPELINE LAYERS: 6 ACTIVE',
    rightHUD: 'STACK LATENCY: < 140ms TOTAL',
    bottomLeft: 'AI PIPELINE SYNC',
    align: 'left',
  },
  {
    label: '06 / LIVE TRANSLATION',
    title: 'Words Translated As You Speak',
    desc: '"Hello" becomes "Gracias". "Thank You" arrives instantly. Real-time translation with no delay and no errors.',
    leftHUD: 'TRANSLATION INTELLIGENCE: LIVE',
    rightHUD: 'ACTIVE VOICES: 5 LANGUAGES',
    bottomLeft: 'TRANSLATION MATRIX SYNC',
    align: 'left',
  },
  {
    label: '07 / FULL SYSTEM ONLINE',
    title: 'Every Layer Working As One',
    desc: 'The complete AI pipeline is live — transcription, detection, translation, sentiment, and speech synthesis firing simultaneously.',
    leftHUD: 'SYSTEM STATUS: ALL LAYERS ONLINE',
    rightHUD: 'PEER-TO-PEER LATENCY: < 5ms',
    bottomLeft: 'MOBILE INTERFACE SYNC',
    align: 'center',
  },
  {
    label: '08 / EXPERIENCE ENTRY',
    title: 'Interact with Language',
    desc: 'Try the live engine below. Speak or type to see Veltrio capture meaning, analyze emotion, and translate instantly.',
    leftHUD: 'SANDBOX DESCRIPTOR ONLINE',
    rightHUD: 'VITE LOCAL DEV SERVER',
    bottomLeft: 'VELTRIO MOBILE GATEWAY',
    align: 'center',
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onStart, theme, toggleTheme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Desktop frames: frame_one (49 landscape jpgs)
  const desktopImagesRef = useRef<HTMLImageElement[]>([]);
  const [desktopLoaded, setDesktopLoaded] = useState(false);

  // Mobile frames: frame_two (50 portrait jpgs)
  const mobileImagesRef = useRef<HTMLImageElement[]>([]);
  const [mobileLoaded, setMobileLoaded] = useState(false);

  // Track viewport width
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const activeStages = isMobile ? MOBILE_STAGES : DESKTOP_STAGES;

  // Scroll LERP values
  const [lerpedProgress, setLerpedProgress] = useState(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  const activeImagesRef = isMobile ? mobileImagesRef : desktopImagesRef;
  const activeTotalFrames = isMobile ? 50 : 49;
  const imagesLoaded = isMobile ? mobileLoaded : desktopLoaded;

  // Loader states
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [loaderText, setLoaderText] = useState('Initializing Veltrio...');
  const [showLoader, setShowLoader] = useState(true);

  // Sandbox interactive states
  const [sandboxText, setSandboxText] = useState('Hello! It is an absolute pleasure to talk with you.');
  const [sandboxTargetLang, setSandboxTargetLang] = useState('es');
  const [sandboxTranslated, setSandboxTranslated] = useState('');
  const [sandboxSentiment, setSandboxSentiment] = useState<SentimentResult | null>(null);
  const [sandboxIsTranslating, setSandboxIsTranslating] = useState(false);
  const [sandboxError, setSandboxError] = useState('');

  // 3s loader loop
  useEffect(() => {
    const duration = 2500;
    const interval = 50;
    const totalSteps = duration / interval;
    let currentStep = 0;

    const phrases = [
      'Preloading neural engine...',
      'Opening acoustic matrix...',
      'Binding language classifiers...',
      'Synergy Core online.'
    ];

    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min(100, Math.floor((currentStep / totalSteps) * 100));
      setLoaderProgress(progress);

      const phraseIndex = Math.min(
        phrases.length - 1,
        Math.floor((progress / 100) * phrases.length)
      );
      setLoaderText(phrases[phraseIndex]);

      if (progress >= 100) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const isReady = loaderProgress === 100 && imagesLoaded;

  useEffect(() => {
    if (isReady) {
      const timeout = setTimeout(() => {
        setShowLoader(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isReady]);

  // Handle screen resizing
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload frame buffers
  useEffect(() => {
    let count = 0;
    const imgs: HTMLImageElement[] = [];
    for (let i = 1; i <= 49; i++) {
      const img = new Image();
      img.src = `/frames/frame_one/f1_${i}.jpg`;
      const done = () => { count++; if (count === 49) setDesktopLoaded(true); };
      img.onload = done;
      img.onerror = done;
      imgs.push(img);
    }
    desktopImagesRef.current = imgs;
  }, []);

  useEffect(() => {
    let count = 0;
    const imgs: HTMLImageElement[] = [];
    for (let i = 1; i <= 50; i++) {
      const img = new Image();
      img.src = `/frames/frame_two/f2_${i}.jpg`;
      const done = () => { count++; if (count === 50) setMobileLoaded(true); };
      img.onload = done;
      img.onerror = done;
      imgs.push(img);
    }
    mobileImagesRef.current = imgs;
  }, []);

  // Calculate scroll ratio based on container height
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalHeight = rect.height - window.innerHeight;
      if (totalHeight <= 0) return;

      const progress = Math.min(1, Math.max(0, -rect.top / totalHeight));
      targetProgressRef.current = progress;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // LERP scroll animation loop
  useEffect(() => {
    let rafId: number;

    const animateProgress = () => {
      const ease = isMobile ? 0.2 : 0.08;
      const diff = targetProgressRef.current - currentProgressRef.current;

      if (Math.abs(diff) > 0.0001) {
        currentProgressRef.current += diff * ease;
        setLerpedProgress(currentProgressRef.current);
      } else if (currentProgressRef.current !== targetProgressRef.current) {
        currentProgressRef.current = targetProgressRef.current;
        setLerpedProgress(currentProgressRef.current);
      }

      rafId = requestAnimationFrame(animateProgress);
    };

    rafId = requestAnimationFrame(animateProgress);
    return () => cancelAnimationFrame(rafId);
  }, [isMobile]);

  // Draw frame on canvas
  const drawFrame = (progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded || activeImagesRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalFrames = activeTotalFrames;
    const frameIndex = Math.min(
      totalFrames,
      Math.max(1, Math.floor(progress * (totalFrames - 1)) + 1)
    );

    const img = activeImagesRef.current[frameIndex - 1];
    if (!img || !img.complete) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.width;
    const imgHeight = img.height;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      drawHeight = canvasHeight;
      offsetX = (canvasWidth - drawWidth) / 2;
    }

    // Canvas filter for subtle contrast on background images
    ctx.filter = theme === 'dark' ? 'brightness(0.4) contrast(1.1)' : 'brightness(0.9) contrast(0.95)';
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  useEffect(() => {
    drawFrame(lerpedProgress);
  }, [lerpedProgress, imagesLoaded, isMobile, theme]);

  // Canvas resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      drawFrame(currentProgressRef.current);
    };

    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(parent);
    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [imagesLoaded, isMobile]);

  // Execute interactive sandbox translation
  const handleSandboxTranslate = async () => {
    if (!sandboxText.trim() || sandboxIsTranslating) return;
    setSandboxIsTranslating(true);
    setSandboxError('');
    setSandboxTranslated('');
    setSandboxSentiment(null);

    try {
      const hasGroqKey = !!import.meta.env.VITE_GROQ_API_KEY;
      if (!hasGroqKey) {
        // Fallback mock translation if API key is not present
        setTimeout(() => {
          setSandboxTranslated(`[Demo Fallback] Translated "${sandboxText}" to Spanish.`);
          setSandboxSentiment({
            sentiment: SentimentLabel.Positive,
            tone: 'Warm & Empathetic',
            explanation: 'The tone is highly positive and polite.',
            intensity: 0.9,
            emotionalInsights: ['Friendly', 'Welcoming'],
            confidence: 0.95
          });
          setSandboxIsTranslating(false);
        }, 1200);
        return;
      }

      const tp = translateTextGroq(
        sandboxText,
        'auto',
        sandboxTargetLang,
        'Translate in a colloquial native style.'
      );
      const sp = analyzeSentimentGroq(sandboxText);

      const [trResult, sResult] = await Promise.all([tp, sp]);
      setSandboxTranslated(trResult.translatedText);
      setSandboxSentiment(sResult);
    } catch (err: any) {
      setSandboxError(err.message || 'Could not complete translation. Try workspace launch directly.');
    } finally {
      setSandboxIsTranslating(false);
    }
  };

  // Run initial sandbox trigger on final slide reveal
  const hasTriggeredSandbox = useRef(false);
  useEffect(() => {
    if (lerpedProgress > 0.85 && !hasTriggeredSandbox.current) {
      hasTriggeredSandbox.current = true;
      handleSandboxTranslate();
    }
  }, [lerpedProgress]);

  const renderSentimentIcon = (label: SentimentLabel) => {
    const cls = 'w-4 h-4';
    if (label === SentimentLabel.Positive) return <PositiveIcon className={`${cls} text-emerald-500`} />;
    if (label === SentimentLabel.Negative) return <NegativeIcon className={`${cls} text-red-500`} />;
    return <NeutralIcon className={`${cls} text-zinc-400`} />;
  };

  return (
    <div className="relative w-full min-h-screen text-foreground font-sans selection:bg-[#44b3cc] selection:text-white flex flex-col z-0 transition-colors duration-1000">
      
      {/* Immersive Loader overlay */}
      {showLoader && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 transition-opacity duration-1000">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(68,179,204,0.06),transparent_70%)]" />
          <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8 text-center space-y-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-[#44b3cc]/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-[#44b3cc] via-[#2782a0] to-[#2896b2] rounded-2xl flex items-center justify-center shadow-xl p-2.5">
                <span className="text-white font-extrabold text-2xl font-sans tracking-tighter">V</span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black tracking-[0.25em] uppercase text-white font-sans">
                Veltrio
              </h2>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#44b3cc] font-mono animate-pulse">
                {loaderText}
              </p>
            </div>

            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#44b3cc] via-[#2782a0] to-[#2896b2] rounded-full transition-all duration-75"
                style={{ width: `${loaderProgress}%` }}
              />
            </div>

            <div className="flex justify-between items-center w-full text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              <span>Initializing Core</span>
              <span className="text-[#44b3cc] font-bold">{loaderProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Header Badge (Boundary-less) */}
      <header className="fixed top-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 bg-black/20 dark:bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-full border border-black/5 dark:border-white/10 pointer-events-auto">
          <span className="text-indigo-500 font-black tracking-tight text-base font-sans">Veltrio</span>
          <span className="text-[8px] tracking-[0.2em] font-bold text-zinc-400 uppercase border-l border-zinc-500/30 pl-2">Aura</span>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-black/20 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/10 pointer-events-auto hover:bg-black/35 dark:hover:bg-white/10 hover-scale cursor-pointer transition-all"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Background scrollytelling canvas */}
      <div className="fixed inset-0 w-full h-screen overflow-hidden z-0 bg-transparent">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" />
      </div>

      {/* Scrollytelling narrative path - 8 Steps stacked vertically */}
      <div ref={containerRef} className="relative w-full h-[800vh] bg-transparent z-10 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-full flex flex-col">
          
          {activeStages.map((stage, index) => {
            const isLeft = stage.align === 'left';
            const isRight = stage.align === 'right';

            return (
              <div
                key={stage.label}
                className="w-full min-h-screen flex flex-col justify-between py-24 px-6 md:px-12 pointer-events-auto max-w-7xl mx-auto"
              >
                {/* HUD Step Label */}
                <div className="w-full flex justify-between items-start gap-4">
                  <span className="text-[9px] font-bold uppercase tracking-[0.25em] bg-zinc-800/15 dark:bg-black/40 text-zinc-800 dark:text-zinc-200 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-300/40 dark:border-white/10 font-mono shadow-sm">
                    {stage.label}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] font-mono bg-zinc-800/15 dark:bg-black/40 text-zinc-800 dark:text-zinc-200 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-300/40 dark:border-white/10 shadow-sm truncate">
                    [ {stage.leftHUD} ]
                  </span>
                </div>

                {/* Main Content Blocks */}
                <div className={`w-full flex-grow flex items-center justify-center text-center`}>
                  {isMobile ? (
                    /* Mobile borderless cinematic text overlay */
                    <div className="w-full max-w-lg flex flex-col items-center space-y-5 px-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                      
                      <h2 className="text-2xl font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 drop-shadow-md text-glow leading-snug">
                        {stage.title}
                      </h2>
                      
                      <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 font-sans max-w-sm drop-shadow-sm">
                        {stage.desc}
                      </p>

                      {/* Stage 8 - The Interactive Sandbox Demo (Mobile cardless format) */}
                      {index === activeStages.length - 1 && (
                        <div className="w-full pt-6 border-t border-zinc-800/10 dark:border-white/10 flex flex-col gap-6 text-center items-center">
                          
                          <div className="w-full flex flex-col gap-5 max-w-xs">
                            {/* Input field */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Type a Phrase</label>
                              <input
                                type="text"
                                value={sandboxText}
                                onChange={(e) => setSandboxText(e.target.value)}
                                className="bg-transparent border-b border-zinc-350 dark:border-white/20 focus:border-indigo-500 dark:focus:border-indigo-400 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none text-center placeholder-zinc-400 dark:placeholder-zinc-600 transition-colors"
                                placeholder="Say something nice..."
                              />
                            </div>

                            {/* Dropdown target lang */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Translate To</label>
                              <select
                                value={sandboxTargetLang}
                                onChange={(e) => setSandboxTargetLang(e.target.value)}
                                className="bg-transparent border-b border-zinc-350 dark:border-white/20 focus:border-indigo-500 dark:focus:border-indigo-400 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none text-center cursor-pointer transition-colors"
                              >
                                {LANGUAGES.map((l) => (
                                  <option key={l.code} value={l.code} className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950">
                                    {l.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Translate button */}
                          <button
                            onClick={handleSandboxTranslate}
                            disabled={sandboxIsTranslating || !sandboxText.trim()}
                            className="px-6 py-3 bg-[#44b3cc] hover:bg-[#2896b2] rounded-full text-[9px] font-bold uppercase tracking-[0.15em] text-white transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {sandboxIsTranslating ? (
                              <>
                                <SpinnerIcon className="w-3.5 h-3.5 animate-spin text-white" />
                                Processing...
                              </>
                            ) : (
                              'Translate Phrase'
                            )}
                          </button>

                          {/* Results Output */}
                          {(sandboxTranslated || sandboxIsTranslating || sandboxSentiment) && (
                            <div className="w-full max-w-sm bg-zinc-800/[0.03] dark:bg-white/[0.02] backdrop-blur-xs p-4 rounded-2xl border border-zinc-200/50 dark:border-white/5 space-y-3">
                              {sandboxIsTranslating ? (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic animate-pulse">Running linguistic mapping...</p>
                              ) : (
                                <>
                                  {/* Translation result */}
                                  {sandboxTranslated && (
                                    <div>
                                      <span className="text-[8px] font-bold text-[#2896b2] dark:text-[#44b3cc] uppercase tracking-wider">Output translation</span>
                                      <p className="text-xs text-zinc-900 dark:text-white font-semibold mt-0.5">{sandboxTranslated}</p>
                                    </div>
                                  )}

                                  {/* Sentiment results */}
                                  {sandboxSentiment && (
                                    <div className="flex items-center justify-center gap-3 pt-2 border-t border-zinc-200/50 dark:border-white/5">
                                      <div className="flex items-center gap-1.5 bg-zinc-800/10 dark:bg-white/5 px-2.5 py-1 rounded-full text-[9px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                                        {renderSentimentIcon(sandboxSentiment.sentiment)}
                                        <span className="capitalize">{sandboxSentiment.sentiment}</span>
                                      </div>
                                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">
                                        Tone: <span className="text-zinc-800 dark:text-zinc-200">{sandboxSentiment.tone}</span>
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {sandboxError && <p className="text-xs text-red-500 dark:text-red-450">{sandboxError}</p>}

                          {/* Final launch button */}
                          <div className="pt-4 border-t border-zinc-200/50 dark:border-white/10 w-full flex justify-center">
                            <button
                              onClick={onStart}
                              className="px-8 py-3.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-extrabold text-[9px] uppercase tracking-[0.2em] hover:shadow-[0_0_24px_rgba(255,255,255,0.25)] transition-all cursor-pointer border-0 animate-pulse"
                            >
                              Step Inside Veltrio
                            </button>
                          </div>

                        </div>
                      )}

                    </div>
                  ) : (
                    /* Desktop Glassmorphism Card (Keeps original layout) */
                    <div className={`w-full max-w-2xl glass-panel p-8 sm:p-10 flex flex-col space-y-4 md:space-y-6 ${
                      isLeft ? 'items-start' : isRight ? 'items-end' : 'items-center'
                    }`}>
                      
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                        {stage.title}
                      </h2>
                      
                      <p className="text-xs sm:text-sm leading-relaxed text-zinc-650 dark:text-zinc-300 font-sans max-w-xl">
                        {stage.desc}
                      </p>

                      {/* Stage 8 - The Interactive Sandbox Demo */}
                      {index === activeStages.length - 1 && (
                        <div className="w-full pt-4 border-t border-zinc-800/10 dark:border-white/10 flex flex-col gap-4 text-left">
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Input field */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Type a Phrase</label>
                              <input
                                type="text"
                                value={sandboxText}
                                onChange={(e) => setSandboxText(e.target.value)}
                                className="glass-input px-3.5 py-2.5 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 bg-zinc-800/5 dark:bg-white/5 border-zinc-200 dark:border-white/10"
                                placeholder="Say something nice..."
                              />
                            </div>

                            {/* Dropdown target lang */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Translate To</label>
                              <select
                                value={sandboxTargetLang}
                                onChange={(e) => setSandboxTargetLang(e.target.value)}
                                className="glass-input px-3 py-2 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 cursor-pointer"
                              >
                                {LANGUAGES.map((l) => (
                                  <option key={l.code} value={l.code} className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900">
                                    {l.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Translate button */}
                          <button
                            onClick={handleSandboxTranslate}
                            disabled={sandboxIsTranslating || !sandboxText.trim()}
                            className="self-start px-5 py-2.5 bg-[#44b3cc] hover:bg-[#2896b2] rounded-xl text-[10px] font-bold uppercase tracking-wider text-white transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {sandboxIsTranslating ? (
                              <>
                                <SpinnerIcon className="w-3.5 h-3.5 animate-spin text-white" />
                                Processing...
                              </>
                            ) : (
                              'Try Veltrio Translate'
                            )}
                          </button>

                          {/* Results Output */}
                          {(sandboxTranslated || sandboxIsTranslating || sandboxSentiment) && (
                            <div className="bg-zinc-800/5 dark:bg-white/[0.03] border border-zinc-800/10 dark:border-white/5 p-4 rounded-xl space-y-3">
                              {sandboxIsTranslating ? (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic animate-pulse">Running linguistic mapping...</p>
                              ) : (
                                <>
                                  {/* Translation result */}
                                  {sandboxTranslated && (
                                    <div>
                                      <span className="text-[8px] font-bold text-[#2896b2] dark:text-[#44b3cc] uppercase tracking-wider">Output translation</span>
                                      <p className="text-xs text-zinc-900 dark:text-white font-semibold mt-0.5">{sandboxTranslated}</p>
                                    </div>
                                  )}

                                  {/* Sentiment results */}
                                  {sandboxSentiment && (
                                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-800/10 dark:border-white/5">
                                      <div className="flex items-center gap-1.5 bg-zinc-800/10 dark:bg-white/5 px-2.5 py-1 rounded-full text-[9px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                                        {renderSentimentIcon(sandboxSentiment.sentiment)}
                                        <span className="capitalize">{sandboxSentiment.sentiment}</span>
                                      </div>
                                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">
                                        Tone: <span className="text-zinc-800 dark:text-zinc-200">{sandboxSentiment.tone}</span>
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {sandboxError && <p className="text-xs text-red-500 dark:text-red-450">{sandboxError}</p>}

                          {/* Final launch button */}
                          <div className="pt-4 border-t border-zinc-800/10 dark:border-white/10 w-full flex justify-center">
                            <button
                              onClick={onStart}
                              className="px-8 py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-extrabold text-[10px] uppercase tracking-[0.2em] hover:shadow-[0_0_24px_rgba(255,255,255,0.25)] transition-all cursor-pointer border-0 animate-pulse"
                            >
                              Step Inside Veltrio
                            </button>
                          </div>

                        </div>
                      )}

                    </div>
                  )}
                </div>

                {/* Bottom HUD bar */}
                <div className="w-full flex justify-between items-end border-t border-zinc-800/10 dark:border-white/10 pt-4 font-mono text-[9px] tracking-[0.2em] uppercase font-bold text-zinc-500 dark:text-zinc-400">
                  <span>{stage.bottomLeft}</span>
                  <span>{stage.rightHUD}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
