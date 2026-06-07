import React, { useEffect, useState } from 'react';
import { MicrophoneIcon, SpeakerIcon, PositiveIcon, SunIcon, MoonIcon } from './icons';

interface LandingPageProps {
  onStart: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, theme, toggleTheme }) => {
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [bootStep, setBootStep] = useState(0);

  const mockLogs = [
    "[ OK ] INITIALIZING VELTRIO CYBERDECK OS...",
    "[ OK ] ALLOCATING NEURAL BUFFER MEMORY...",
    "[ OK ] INJECTING LLAMA-3.3-70B INFERENCE MODULE...",
    "[ OK ] ATTACHING WHISPER AUDIO DECODER ENGINE...",
    "[ OK ] DETECTING USER AUDIO INTERACTION DRIVERS...",
    "[ OK ] GAINING ACCESS TOKEN TO GROQ MAIN INFRA...",
    "[ OK ] HACKATHON TARGET NODE KRCT LOCALIZED...",
    "[ OK ] NETWORK LINK COMPILATION STABLE.",
    "=== VELTRIO HACK TERMINAL V2.0 READY ==="
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (bootStep < mockLogs.length) {
      const timer = setTimeout(() => {
        setBootLogs(prev => [...prev, mockLogs[bootStep]]);
        setBootStep(prev => prev + 1);
      }, 350 + Math.random() * 200);
      return () => clearTimeout(timer);
    }
  }, [bootStep]);

  return (
    <div className="cyber-container relative min-h-screen w-full text-foreground flex flex-col justify-between font-mono">
      <div className="cyber-scanlines" />

      {/* Floating Theme Toggle and Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black border border-primary flex items-center justify-center text-primary font-extrabold text-xl shadow-[0_0_8px_var(--primary)] animate-pulse">
            V
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-widest text-primary cyber-glow-green leading-none">
              VELTRIO
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-accent mt-1">
              CYBERDECK SYSTEM
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-purple/30 text-[10px] font-bold text-purple shadow-sm bg-purple/5 animate-pulse">
            🏆 CODESPRINT 6.0 // INTER-COLLEGE HACKATHON
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center py-12">

        {/* Glowing Hackathon Badge */}
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-primary/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-700 rounded-full" />
          <div className="relative border border-primary/50 bg-black/80 px-6 py-2.5 rounded-none text-xs font-semibold uppercase tracking-widest text-primary flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            SECURE ACCESS CORE // KRCT HACKATHON PROTOCOL
          </div>
        </div>

        {/* Cyber Boot Log Output Screen */}
        <div className="w-full max-w-2xl bg-black/95 border border-primary/40 p-6 text-left mb-8 shadow-[inset_0_0_15px_rgba(0,255,102,0.15),0_0_10px_rgba(0,255,102,0.1)] relative min-h-[200px]">
          <div className="absolute top-1.5 right-3 text-[7px] text-primary/50 uppercase">BOOT_LOG_DIAG</div>
          <div className="space-y-1.5 text-xs text-primary font-mono select-none">
            {bootLogs.map((log, idx) => (
              <div key={idx} className={idx === mockLogs.length - 1 ? "text-accent font-bold animate-pulse mt-2" : ""}>
                {log}
              </div>
            ))}
            {bootStep < mockLogs.length && (
              <div className="inline-block w-2 h-3 bg-primary animate-pulse ml-0.5" />
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-black tracking-widest leading-tight mb-8 uppercase text-foreground">
          NEXT-GEN COGNITIVE <br />
          <span className="text-primary cyber-glow-green">DECIPHER MATRIX DECK</span>
        </h1>

        <p className="text-sm text-muted mb-12 max-w-2xl leading-relaxed font-normal">
          An advanced real-time language translation system designed to bridge communication gaps during structural software engineering sprints. Leverages Whisper transcription models and Llama-3.3-70B semantic classifiers.
        </p>

        {/* CTA Launch Button */}
        {bootStep >= mockLogs.length && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onStart}
              className="cyber-button px-10 py-5 text-base font-black tracking-widest shadow-[0_0_15px_rgba(0,255,102,0.3)]"
            >
              ESTABLISH NEURAL UPLINK
            </button>
          </div>
        )}

        {/* 🏆 PRESENTATION PANEL */}
        <div className="cyber-terminal-pink w-full max-w-5xl rounded-none p-8 mt-20 text-left relative overflow-hidden bg-purple/5">
          <div className="absolute right-0 top-0 w-64 h-64 bg-purple/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-purple px-2 py-0.5 bg-purple/10 border border-purple/30">
                CODESPRINT 6.0 TARGET DIAGNOSTIC
              </span>
              <h2 className="text-xl font-bold text-foreground mt-3 uppercase tracking-wider">
                COGNITIVE NETWORK INTER-COLLABORATION PROTOCOL
              </h2>
              <p className="text-muted text-xs mt-2 max-w-2xl leading-relaxed font-light">
                In high-pressure developer sprints, conveying architectural requirements across dialect barriers creates friction. Veltrio eliminates this bottleneck by offering speech logging, semantic analytics counters, and cognitive AI co-pilot bridges.
              </p>
            </div>
            <div className="flex-shrink-0 bg-black border border-primary/20 p-5 rounded-none flex flex-col items-center justify-center text-center shadow-md">
              <span className="text-2xl font-black text-primary">KRCT</span>
              <span className="text-[8px] font-bold text-muted uppercase mt-1">Host Node</span>
            </div>
          </div>
        </div>

        {/* PROBLEM STATEMENT & PROPOSED SOLUTION SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 text-left w-full max-w-5xl">
          {/* Problem Statement Card */}
          <div className="cyber-terminal-pink p-8 rounded-none bg-black/40">
            <span className="text-[9px] font-bold uppercase tracking-wider text-purple px-2 py-0.5 bg-purple/10 border border-purple/30">
              CRITICAL SYSTEM BOTTLENECK
            </span>
            <h3 className="text-lg font-bold mt-4 mb-3 text-foreground tracking-wider uppercase">
              PROBLEM STATEMENT
            </h3>
            <p className="text-xs text-muted leading-relaxed font-light">
              Modern technical team collaboration is severely hindered by language, dialect, and accent barriers during fast-paced software engineering sprints. Key requirements are often lost in translation, and remote developers struggle with acoustic variations and model latency during voice-based check-ins. Traditional tools introduce severe translation lag, lack contextual understanding, and fail to provide speech analysis (such as sentiment and tone markers), leading to architectural misalignment and friction.
            </p>
          </div>

          {/* Proposed Solution Card */}
          <div className="cyber-terminal p-8 rounded-none bg-black/40">
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 bg-primary/10 border border-primary/30">
              INTELLIGENT RESPONSE INTERFACE
            </span>
            <h3 className="text-lg font-bold mt-4 mb-3 text-foreground tracking-wider uppercase">
              PROPOSED SOLUTION
            </h3>
            <p className="text-xs text-muted leading-relaxed font-light">
              Veltrio provides an integrated language decryptor and real-time conversation terminal powered by a unified, ultra-low latency Groq architecture. It enables instant text and speech transcription using Whisper-Large-v3-Turbo, followed by highly contextual, Llama-3-driven translations. Simultaneously, it extracts cognitive sentiment metrics, emotional descriptors, and speaker tone indicators. An automated Text-to-Speech engine generates responsive vocal completions, offering a seamless, interactive communication bridge.
            </p>
          </div>
        </div>

        {/* 🚀 Feature Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left w-full">
          {[
            {
              icon: <SpeakerIcon className="w-6 h-6 text-primary animate-pulse" />,
              title: 'LIVE DECRYPTION ENGINE',
              desc: 'Decrypt audio inputs instantly across 17+ core channels. Enhanced by low-latency synthesizer fallbacks.'
            },
            {
              icon: <PositiveIcon className="w-6 h-6 text-accent animate-pulse" />,
              title: 'PSYCHE TONE MATRIX',
              desc: 'Classify speaker intent, emotional descriptors (e.g. eager, tense), tone registries, and AI confidence meters.'
            },
            {
              icon: <MicrophoneIcon className="w-6 h-6 text-purple animate-pulse" />,
              title: 'NEURAL VOICE LINK',
              desc: 'Immersive voice node featuring digital waveforms, VAD noise gates, and automated responsive audio completions.'
            },
          ].map((f, i) => {
            const terminalCls = i === 0 ? "cyber-terminal" : i === 1 ? "cyber-terminal-cyan" : "cyber-terminal-pink";
            return (
              <div
                key={i}
                className={`${terminalCls} p-8 rounded-none transition-all duration-300 group hover:-translate-y-1`}
              >
                <div className="w-12 h-12 bg-black border border-primary/20 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="text-md font-bold mb-3 text-foreground tracking-wider group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-xs text-muted leading-relaxed font-light">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Team Developers Panel */}
        <div className="mt-24 w-full border-t border-primary/20 pt-16">
          <h2 className="text-xl font-bold mb-12 tracking-widest text-center text-foreground uppercase">
            NETRUNNER NODE DEVELOPERS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { name: 'Arjun S N', role: 'Lead Architect', desc: 'Designed SDK abstractions, audio recording state models, and unified API bindings.' },
              { name: 'Aravindan K', role: 'AI Infrastructure', desc: 'Wired audio chunk streaming, translation prompts, and speech pipeline integrations.' },
              { name: 'Godfrey T R', role: 'Frontend & UI/UX', desc: 'Crafted the premium glassmorphic visual layouts, animations, and typography layers.' },
            ].map((m, i) => (
              <div
                key={i}
                className="cyber-terminal p-6 rounded-none bg-black/40 group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 bg-black border border-primary/30 flex items-center justify-center font-bold text-primary text-sm group-hover:scale-105 transition-transform">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{m.name}</h3>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-accent">{m.role}</p>
                  </div>
                </div>
                <p className="text-xs text-muted leading-relaxed font-light">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 text-center text-[10px] text-muted border-t border-primary/20 uppercase tracking-widest">
        &copy; December 11, 2025 VELTRIO &bull; Built for CODESPRINT 6.0 HACKATHON @ KRCT
      </footer>
    </div>
  );
};

export default LandingPage;
