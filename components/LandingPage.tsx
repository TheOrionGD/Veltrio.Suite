import React, { useEffect, useState, useRef } from 'react';

interface LandingPageProps {
  onStart: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

interface StageConfig {
  label: string;
  title: string;
  desc: string;
  leftHUD: string;   // shown top-right
  rightHUD: string;  // shown bottom-right
  bottomLeft: string; // shown bottom-left
  align: 'left' | 'right' | 'center'; // text block position per stage
}

// Desktop stages — aligned to frame_one landscape video arc:
// f1_1–7:   Two professionals talking in glass-wall office
// f1_8–14:  Glowing voice wave streams from mouth — acoustic capture
// f1_15–22: "SPEECH CAPTURE" glass node — words orbit a silhouette
// f1_23–30: Camera fly-through: LANGUAGE DETECTION → TRANSLATION glass node
// f1_31–38: "SENTIMENT ANALYSIS" glowing green glass cube
// f1_39–46: Full multilingual corridor — SPEECH CAPTURE / TRANSLATION / SENTIMENT ANALYSIS
// f1_47–49: Veltrio logo + "Human-Centered Intelligence" outro
const DESKTOP_STAGES: StageConfig[] = [
  {
    // f1_1–7: Two professionals talking in glass-wall office.
    // Heavy composition on the left — text lives on the right side.
    label: '01 / ACOUSTIC CAPTURE',
    title: 'Understanding Begins With Listening',
    desc: 'Veltrio captures every spoken word — mapping vocal frequencies and acoustic signals the moment a conversation begins.',
    leftHUD: 'STT AUDIO PIPELINE: ACTIVE',
    rightHUD: 'WHISPER-V3 MODEL: RUNNING (16KHZ)',
    bottomLeft: 'CORE INTERFACE SYNC',
    align: 'right',
  },
  {
    // f1_8–14: Man profile on LEFT, glowing golden wave streams to the RIGHT.
    // Wave fills right half — text placed on the left to counterbalance.
    label: '02 / SPEECH CAPTURE',
    title: 'Every Word Is A Signal',
    desc: "Raw audio is isolated, cleaned, and passed into Veltrio's speech capture engine for precise phoneme-level transcription.",
    leftHUD: 'SPEECH CAPTURE: ENGAGED',
    rightHUD: 'PHONEME RESOLUTION: 98.7% ACCURACY',
    bottomLeft: 'CORE INTERFACE SYNC',
    align: 'left',
  },
  {
    // f1_15–30: "SPEECH CAPTURE" node center-left, "LANGUAGE DETECTION" label left,
    // "TRANSLATION" node center — content is center-heavy, text goes right.
    label: '03 / LANGUAGE DETECTION',
    title: 'Language Identity, Resolved Instantly',
    desc: 'Advanced language detection identifies dialect, script, and linguistic origin — so translation is always precisely targeted.',
    leftHUD: 'LANGUAGE DETECTION: RUNNING',
    rightHUD: 'DETECTION LATENCY: < 80ms',
    bottomLeft: 'CORE INTERFACE SYNC',
    align: 'right',
  },
  {
    // f1_31–38: "SENTIMENT ANALYSIS" glowing green glass cube dead center.
    // Center composition — text placed on the left to avoid blocking the cube.
    label: '04 / SENTIMENT ANALYSIS',
    title: 'Tone Decoded Beyond Words',
    desc: 'Veltrio reads emotional tone, intent, and sentiment from every sentence — ensuring meaning is never lost in translation.',
    leftHUD: 'SENTIMENT ENGINE: ONLINE',
    rightHUD: 'VALENCY CONFIDENCE: 98.4% (EXCELLENT)',
    bottomLeft: 'CORE INTERFACE SYNC',
    align: 'left',
  },
  {
    // f1_39–49: Full multilingual corridor (SPEECH CAPTURE → TRANSLATION → SENTIMENT ANALYSIS)
    // vanishing-point perspective — text placed right to frame the left-side pipeline.
    label: '05 / HUMAN SYNC',
    title: 'Human Understanding Delivered',
    desc: 'Speech Capture · Translation · Sentiment Analysis — unified in a single real-time pipeline. Language barriers dissolve.',
    leftHUD: 'FULL PIPELINE: SPEECH · TRANSLATION · SENTIMENT',
    rightHUD: 'PEER-TO-PEER LATENCY: < 5ms',
    bottomLeft: 'CORE INTERFACE SYNC',
    align: 'right',
  },
];

// Mobile stages — aligned to frame_two portrait video arc:
// f2_1–8:   Two professionals face-to-face in premium corporate lobby
// f2_9–14:  Audio wave between them — "English" on left, "Spanish" on right
// f2_15–22: Stacked glass architecture (Speech Capture → Transcription → Language Detection → Translation Intelligence → Sentiment Analysis → AI → Speech Synthesis)
// f2_23–35: Stack activates — "Hello" → "Gracias", "Thank You" live bubbles
// f2_36–46: Full system firing — multi-language outputs streaming in real-time
// f2_47–50: Complete system with AI·Irate base powering the pipeline
const MOBILE_STAGES: StageConfig[] = [
  {
    // f2_1–8: Woman (navy) on LEFT facing Man (gray) on RIGHT in corporate lobby.
    // Both figures split the frame — text centered between them.
    label: '01 / CONVERSATION BEGINS',
    title: 'Two Languages, One Conversation',
    desc: 'Veltrio bridges professionals across languages in real-time — the moment they speak, the system listens.',
    leftHUD: 'VOICE LINK: ESTABLISHED',
    rightHUD: 'WHISPER-V3 MODEL: RUNNING (16KHZ)',
    bottomLeft: 'CORE INTERFACE SYNC',
    align: 'center',
  },
  {
    // f2_9–14: "English" label on LEFT, "Spanish" on RIGHT, wave between them.
    // Wave is centered — text centered to let the labels breathe on either side.
    label: '02 / ACOUSTIC BRIDGE',
    title: 'Sound Becomes Data',
    desc: 'Audio waves are captured the instant they leave your lips — English, Spanish, any language — processed immediately.',
    leftHUD: 'SPEECH CAPTURE: ACTIVE',
    rightHUD: 'LANGUAGE PAIR: EN ↔ ES',
    bottomLeft: 'CORE INTERFACE SYNC',
    align: 'center',
  },
  {
    // f2_15–22: Stacked glass architecture stack occupies CENTER of portrait frame.
    // Stack is tall and narrow — text placed on the left so it reads beside the stack.
    label: '03 / AI LAYER STACK',
    title: 'Intelligence Stacked In Layers',
    desc: 'Speech Capture · Transcription · Language Detection · Translation Intelligence · Sentiment Analysis · Speech Synthesis — each layer firing in sequence.',
    leftHUD: 'PIPELINE LAYERS: 6 ACTIVE',
    rightHUD: 'STACK LATENCY: < 140ms TOTAL',
    bottomLeft: 'AI PIPELINE SYNC',
    align: 'left',
  },
  {
    // f2_23–35: Translation bubbles ("Hello" → "Gracias", "Thank You") appear LEFT and RIGHT of stack.
    // Bubbles spill right — text anchored left to avoid collision.
    label: '04 / LIVE TRANSLATION',
    title: 'Words Translated As You Speak',
    desc: '"Hello" becomes "Gracias". "Thank You" arrives instantly. Real-time translation with no delay and no errors.',
    leftHUD: 'TRANSLATION INTELLIGENCE: LIVE',
    rightHUD: 'ACTIVE VOICES: 5 LANGUAGES (EN, ES, FR, DE, ZH)',
    bottomLeft: 'TRANSLATION MATRIX SYNC',
    align: 'left',
  },
  {
    // f2_36–50: Full system firing — outputs spill across the full frame width.
    // Dense multi-language output — text centered so it anchors the chaos.
    label: '05 / FULL SYSTEM ONLINE',
    title: 'Every Layer Working As One',
    desc: 'The complete AI pipeline is live — transcription, detection, translation, sentiment, and speech synthesis firing simultaneously.',
    leftHUD: 'SYSTEM STATUS: ALL LAYERS ONLINE',
    rightHUD: 'PEER-TO-PEER LATENCY: < 5ms',
    bottomLeft: 'CORE INTERFACE SYNC',
    align: 'center',
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Desktop frames: frame_one (49 landscape jpgs)
  const desktopImagesRef = useRef<HTMLImageElement[]>([]);
  const [desktopLoaded, setDesktopLoaded] = useState(false);

  // Mobile frames: frame_two (50 portrait jpgs)
  const mobileImagesRef = useRef<HTMLImageElement[]>([]);
  const [mobileLoaded, setMobileLoaded] = useState(false);

  // Track whether we are on a mobile-width viewport
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Smooth LERP scrolling engine states
  const [lerpedProgress, setLerpedProgress] = useState(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  // Derived: which image set & total are currently active
  const activeImagesRef = isMobile ? mobileImagesRef : desktopImagesRef;
  const activeTotalFrames = isMobile ? 50 : 49;
  const imagesLoaded = isMobile ? mobileLoaded : desktopLoaded;

  // Loader states
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [loaderText, setLoaderText] = useState('Initializing systems...');
  const [showLoader, setShowLoader] = useState(true);

  // Minimum 5 seconds loading timer
  useEffect(() => {
    const duration = 5000; // 5000ms
    const interval = 50; // Update every 50ms
    const totalSteps = duration / interval;
    let currentStep = 0;

    const phrases = [
      'Loading neural assets...',
      'Initializing acoustic capture pipeline...',
      'Configuring LLM context models...',
      'Preloading high-fidelity frame buffer...',
      'Calibrating real-time translation matrix...',
      'Establishing semantic alignment stack...',
      'Veltrio Core online.'
    ];

    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min(100, Math.floor((currentStep / totalSteps) * 100));
      setLoaderProgress(progress);

      // Choose phrase based on progress
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
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [isReady]);

  // Track viewport width changes (device rotation, resize)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Preload desktop frames (frame_one, 49 frames)
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

  // Preload mobile frames (frame_two, 50 frames)
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

  // Calculate scroll progress ratio (0 to 1) based on section container
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

  // Interpolate targetProgress inside a requestAnimationFrame loop to create smooth inertia scrolling (LERP)
  useEffect(() => {
    let rafId: number;

    const animateProgress = () => {
      const ease = 0.08; // Smooth inertia parameter
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
  }, []);

  // Draw appropriate frame on canvas — picks desktop or mobile image set automatically
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

    // Object-fit Cover scaling math
    if (canvasRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      drawHeight = canvasHeight;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  // Redraw canvas frame on scroll progress or when active set changes
  useEffect(() => {
    drawFrame(lerpedProgress);
  }, [lerpedProgress, imagesLoaded, isMobile]);

  // Use a ResizeObserver to size the background canvas dynamically relative to viewport
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

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-r from-[#d1d2cd] to-[#e5e9eb] text-slate-800 font-sans selection:bg-indigo-500 selection:text-white flex flex-col z-0">
      {/* Premium Loader Overlay */}
      {showLoader && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090d16] text-white transition-opacity duration-1000 ${isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
          {/* Subtle background grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

          <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8 text-center space-y-8">
            {/* Pulsing Glowing Logo */}
            <div className="relative">
              <div className="absolute -inset-4 bg-indigo-500/30 rounded-2xl blur-xl animate-pulse" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl p-2.5">
                <img
                  src="/logo.png"
                  alt="Veltrio Logo"
                  className="w-full h-full object-contain animate-pulse"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-white">
                Veltrio Core
              </h2>
              <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-mono font-bold animate-pulse">
                {loaderText}
              </p>
            </div>

            {/* Glowing Loading Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-500 rounded-full transition-all duration-75 shadow-[0_0_12px_#10b981]"
                style={{ width: `${loaderProgress}%` }}
              />
            </div>

            <div className="flex justify-between items-center w-full text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              <span>INITIALIZING</span>
              <span className="text-emerald-400 font-bold">{loaderProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Translucent background glows */}
      <div className="fixed top-0 right-0 w-[450px] h-[450px] rounded-full blur-[130px] bg-amber-500/5 pointer-events-none z-10 animate-pulse [animation-duration:8s]" />
      <div className="fixed bottom-0 left-0 w-[450px] h-[450px] rounded-full blur-[130px] bg-orange-500/5 pointer-events-none z-10 animate-pulse [animation-duration:12s]" />

      {/* Navigation Layer (z-20 depth coordinate) */}
      <header className="sticky top-0 z-20 w-full px-6 py-4 flex items-center justify-between border-b border-slate-200/40 backdrop-blur-md bg-[#e5e9eb]/60">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              V
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-[0.05em] uppercase text-slate-900 leading-none">
                Veltrio
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-indigo-600 mt-1">
                Communication Core
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-slate-500">
            <span className="border border-slate-200 px-3 py-1 rounded-full bg-slate-50/80 text-[9px] uppercase tracking-[0.2em] text-slate-600 font-bold">
              Professional Suite
            </span>
          </div>
        </div>
      </header>

      {/* Main Scrollytelling Section Container (z-0 depth coordinate) */}
      <div ref={containerRef} className="relative w-full h-[500vh] bg-transparent z-0">

        {/* Sticky Background Canvas Viewport (z-0 depth coordinate) */}
        <div className="sticky top-0 left-0 w-screen h-screen overflow-hidden z-0 bg-transparent">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          />
          {/* Translucent separator overlay (z-5) set to 20% white opacity matching frame analysis */}
          <div className="absolute inset-0 bg-white/05 z-5 pointer-events-none" />
        </div>

        {/* Narrative Layer (z-10 depth coordinate) */}
        <div className="absolute inset-x-0 top-0 h-full z-10 pointer-events-none flex flex-col">
          {(isMobile ? MOBILE_STAGES : DESKTOP_STAGES).map((stage, index) => {
            const activeStages = isMobile ? MOBILE_STAGES : DESKTOP_STAGES;
            const isLastStage = index === activeStages.length - 1;
            const isLeft = stage.align === 'left';
            const isRight = stage.align === 'right';
            const isCenter = stage.align === 'center';
            return (
              <div
                key={stage.label}
                className="w-full min-h-screen flex flex-col justify-between py-24 px-6 md:px-12 pointer-events-auto max-w-7xl mx-auto"
              >
                {/* Top HUD Row */}
                <div className="w-full flex justify-between items-start gap-4">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.25em] bg-black/40 backdrop-blur-[6px] px-3.5 py-1.5 rounded-full border border-indigo-500/30 font-mono shadow-sm shrink-0 text-secondary-outline">
                    {stage.label}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] font-mono bg-black/40 backdrop-blur-[6px] px-3 py-1 rounded-lg border border-indigo-500/30 shadow-sm truncate text-secondary-outline">
                    [ {stage.leftHUD} ]
                  </span>
                </div>

                {/* Story block — positioned per stage.align */}
                <div className={`w-full flex-grow flex ${isLastStage
                  ? 'items-end pb-16 justify-center text-center'
                  : `items-center ${isLeft ? 'justify-start text-left' : isRight ? 'justify-end text-right' : 'justify-center text-center'}`
                  }`}>
                  <div className={`w-full flex flex-col p-8 sm:p-10 rounded-[24px] border border-white/40 backdrop-blur-[6px] bg-white/45 shadow-[0_8px_32px_0_rgba(15,23,42,0.05)] ${isLastStage
                    ? 'items-center max-w-4xl space-y-4 text-center'
                    : `space-y-4 md:space-y-6 ${isLeft ? 'items-start max-w-2xl text-left' : isRight ? 'items-end max-w-2xl text-right' : 'items-center max-w-2xl text-center'}`
                    }`}>
                    <h2
                      style={{ willChange: 'transform, opacity' }}
                      className={`font-black tracking-[0.05em] uppercase text-slate-950 leading-tight ${isLastStage
                        ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:whitespace-nowrap'
                        : 'text-xl sm:text-2xl md:text-3xl lg:text-[40px]'
                        }`}
                    >
                      {stage.title}
                    </h2>

                    <p className={`tracking-[0.05em] uppercase font-semibold text-secondary-outline ${isLastStage
                      ? 'text-[8px] sm:text-[9px] md:text-xs xl:whitespace-nowrap max-w-none'
                      : 'text-[11px] sm:text-xs md:text-sm leading-relaxed max-w-xl'
                      }`}>
                      {stage.desc}
                    </p>
                  </div>
                </div>

                {/* Bottom HUD bar */}
                <div className="w-full flex justify-between items-end border-t border-indigo-500/30 pt-4 font-mono text-[9px] tracking-[0.2em] uppercase font-extrabold gap-4">
                  <span className="truncate text-secondary-outline">{stage.bottomLeft}</span>
                  <span className="truncate text-secondary-outline">{stage.rightHUD}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Launch CTA Section */}
      <section className="w-full bg-gradient-to-r from-[#d1d2cd] to-[#e5e9eb] text-slate-800 py-24 border-t border-slate-200/40 z-20 relative flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.25em] bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 font-mono">
            [06 / Establish Access]
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-[0.2em] uppercase text-slate-900 leading-normal">
            Enter The Workspace
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-[2.2] tracking-[0.18em] uppercase max-w-lg mx-auto font-semibold">
            Launch our high-performance SaaS suite to access the Translator Dashboard and Live Voice Mode. Complete with colloquial native settings, industrialized technical filters, and support options.
          </p>
          <div className="pt-2">
            <button
              onClick={onStart}
              className="px-10 py-5 rounded-2xl text-white font-extrabold text-xs uppercase tracking-[0.25em] bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 hover:shadow-[0_4px_25px_rgba(79,70,229,0.35)] transform active:scale-98 transition-all duration-300 cursor-pointer shadow-lg border-0"
            >
              Launch Translation Hub
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
