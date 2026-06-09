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
  leftHUD: string;
  rightHUD: string;
}

const STAGES: StageConfig[] = [
  {
    label: '01 / ACOUSTIC CAPTURE',
    title: 'Understanding Begins With Listening',
    desc: 'Veltrio tracks raw audio waves, capturing vocal frequencies and mapping acoustic signals instantly.',
    leftHUD: 'STT AUDIO PIPELINE: ACTIVE',
    rightHUD: 'WHISPER-V3 MODEL: RUNNING (16KHZ)'
  },
  {
    label: '02 / COGNITIVE DECODING',
    title: 'Every Language Carries Meaning',
    desc: 'Advanced LLM comprehension decodes intent, sentiment, and emotional tone beyond simple syntax.',
    leftHUD: 'COMPREHENSION ENGINE: Llama-3.3-70B',
    rightHUD: 'VALENCY CONFIDENCE: 98.4% (EXCELLENT)'
  },
  {
    label: '03 / SEMANTIC STACK',
    title: 'Context Matters More Than Words',
    desc: 'Our system analyzes conversational history, domain vocabulary, and cultural nuances in real-time.',
    leftHUD: 'SEMANTIC SEGMENTATION: INTEGRATED',
    rightHUD: 'HISTORY STACK: 256 TOKENS IN MEMORY'
  },
  {
    label: '04 / SYNTACTIC TRANSFORMATION',
    title: 'AI Preserves Intent',
    desc: 'Sub-second cross-language compilation maps ideas accurately without losing professional terminology.',
    leftHUD: 'TRANSLATION MATRIX: LATENCY 140ms',
    rightHUD: 'ACTIVE VOICES: 5 LANGUAGES (EN, ES, FR, DE, ZH)'
  },
  {
    label: '05 / HUMAN SYNC',
    title: 'Human Understanding Delivered',
    desc: 'Real-time human alignment is established. Language barriers dissolve into a unified collaborative flow.',
    leftHUD: 'COMMUNICATION EFFORTLESS: PASS',
    rightHUD: 'PEER-TO-PEER LATENCY: < 5ms'
  }
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
          <div className="absolute inset-0 bg-white/20 z-5 pointer-events-none" />
        </div>

        {/* Narrative Layer (z-10 depth coordinate) */}
        <div className="absolute inset-x-0 top-0 h-full z-10 pointer-events-none flex flex-col">
          {STAGES.map((stage, index) => (
            <div
              key={stage.label}
              className="w-full min-h-screen flex flex-col justify-between py-24 px-6 md:px-12 pointer-events-auto max-w-7xl mx-auto"
            >
              {/* Top HUD Row - Cyberpunk & Apple design specs */}
              <div className="w-full flex justify-between items-start gap-4">
                <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-[0.25em] bg-indigo-50/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-indigo-100/60 font-mono shadow-sm shrink-0">
                  {stage.label}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 font-mono bg-white/70 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-200/50 shadow-sm truncate">
                  [ {stage.leftHUD} ]
                </span>
              </div>

              {/* Story block - Alternating Left / Right aligned based on index to prevent centering overlap */}
              <div className={`w-full flex-grow flex items-center ${index % 2 === 0 ? 'justify-start text-left' : 'justify-end text-right'
                }`}>
                <div className={`w-full max-w-xl flex flex-col space-y-6 md:space-y-8 py-12 ${index % 2 === 0 ? 'items-start' : 'items-end'
                  }`}>
                  <h2
                    style={{ willChange: 'transform, opacity' }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-[0.2em] leading-normal text-slate-950 uppercase"
                  >
                    {stage.title}
                  </h2>

                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 leading-[2.2] tracking-[0.18em] uppercase max-w-lg font-semibold">
                    {stage.desc}
                  </p>

                  <div className="pt-4">
                    <button
                      onClick={onStart}
                      className="px-8 py-4 sm:px-10 sm:py-5 rounded-2xl text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-[0.25em] bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 hover:shadow-[0_4px_25px_rgba(79,70,229,0.35)] transform active:scale-98 transition-all duration-300 cursor-pointer shadow-md border-0"
                    >
                      Launch Translation Hub
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom HUD bar (Cyberpunk micro-typography styling) */}
              <div className="w-full flex justify-between items-end border-t border-slate-300/40 pt-4 font-mono text-[9px] text-slate-500 tracking-[0.2em] uppercase font-extrabold gap-4">
                <span className="truncate">Core Interface Sync</span>
                <span className="truncate">{stage.rightHUD}</span>
              </div>
            </div>
          ))}
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
