import React, { useState, useEffect } from 'react';
import TranslatorView from './components/TranslatorView';
import ConversationView from './components/ConversationView';
import LandingPage from './components/LandingPage';
import { SunIcon, MoonIcon } from './components/icons';
import ChatbotWidget from './components/ChatbotWidget';

const getRankLabel = (lvl: number) => {
  if (lvl <= 1) return 'Script Kiddie';
  if (lvl === 2) return 'Netrunner Apprentice';
  if (lvl === 3) return 'Matrix Glitcher';
  if (lvl === 4) return 'Console Cowboy';
  return 'Cyberdeck Overlord';
};

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [mode, setMode] = useState<'translator' | 'conversation'>('translator');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch (e) {
      return 'dark';
    }
  });
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);

  // Gamification States
  const [xp, setXp] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('user_xp') || 0);
    } catch (e) {
      return 0;
    }
  });
  const [level, setLevel] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('user_level') || 1);
    } catch (e) {
      return 1;
    }
  });
  const [showLevelUp, setShowLevelUp] = useState<boolean>(false);
  const [assistantContextPrompt, setAssistantContextPrompt] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Cyberpunk interface remains dark-default to optimize glowing scanline visual fidelity
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (showLanding) {
      document.body.classList.remove('app-locked');
      document.documentElement.classList.remove('app-locked');
    } else {
      document.body.classList.add('app-locked');
      document.documentElement.classList.add('app-locked');
    }
    return () => {
      document.body.classList.remove('app-locked');
      document.documentElement.classList.remove('app-locked');
    };
  }, [showLanding]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const addXp = (amount: number) => {
    setXp(prevXp => {
      const nextXp = prevXp + amount;
      const threshold = 100;
      if (nextXp >= threshold) {
        const levelsGained = Math.floor(nextXp / threshold);
        const remainingXp = nextXp % threshold;
        setLevel(prevLevel => {
          const nextLevel = prevLevel + levelsGained;
          try {
            localStorage.setItem('user_level', String(nextLevel));
          } catch (e) {}
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 3000);
          return nextLevel;
        });
        try {
          localStorage.setItem('user_xp', String(remainingXp));
        } catch (e) {}
        return remainingXp;
      }
      try {
        localStorage.setItem('user_xp', String(nextXp));
      } catch (e) {}
      return nextXp;
    });
  };

  const handleAskAssistant = (prompt: string) => {
    setIsAssistantOpen(true);
    setAssistantContextPrompt(prompt);
  };

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="cyber-container w-screen h-screen text-foreground font-sans app-shell-grid overflow-hidden">
      <div className="cyber-scanlines" />

      {/* Header */}
      <header className="relative top-0 z-30 w-full bg-surface/90 border-b border-primary/40 shadow-[0_1px_15px_rgba(0,255,102,0.15)] flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Veltrio Logo" 
              className="w-8 h-8 object-contain border border-primary shadow-[0_0_8px_rgba(0,255,102,0.3)] bg-black p-0.5 animate-pulse" 
            />
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-widest text-primary cyber-glow-green leading-none">
                VELTRIO
              </span>
              <span className="text-[7px] font-bold text-accent tracking-widest leading-none mt-1 hidden sm:inline uppercase">
                CYBERDECK SHELL PROTOCOL 2.0
              </span>
            </div>
          </div>

          {/* Desktop Mode Switcher - Centered in Header */}
          <div className="hidden md:flex bg-black border border-primary/40 p-0.5 rounded-none max-w-sm font-mono">
            {[
              { id: 'translator', label: '⚡ DECRYPTOR DECK' },
              { id: 'conversation', label: '🗣️ NEURAL UPLINK' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setMode(item.id as any)}
                className={`px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  mode === item.id
                    ? 'bg-primary text-black font-black'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* User Leveling HUD Diagnostics */}
          <div className="hidden lg:flex items-center gap-4 bg-black border border-primary/30 p-1.5 px-3 rounded-none font-mono text-xs shadow-inner">
            <div className="flex items-center gap-1.5 border-r border-primary/20 pr-3">
              <span className="text-[9px] uppercase font-bold text-accent">RANK:</span>
              <span className="font-extrabold text-primary cyber-glow-green uppercase text-[10px]">{getRankLabel(level)}</span>
            </div>
            
            <div className="flex items-center gap-1.5 border-r border-primary/20 pr-3">
              <span className="text-[9px] uppercase font-bold text-accent">LEVEL:</span>
              <span className="font-extrabold text-foreground text-[10px]">{level}</span>
            </div>

            <div className="flex flex-col w-20 gap-0.5">
              <div className="flex justify-between text-[7px] font-bold text-muted uppercase">
                <span>XP</span>
                <span>{xp}/100</span>
              </div>
              <div className="h-1 w-full bg-slate-900 border border-primary/20 rounded-none overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${xp}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Hackathon Badge */}
            <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 border border-purple/40 text-[9px] font-black text-purple dark:text-purple shadow-sm animate-pulse font-mono uppercase bg-purple/10">
              🏆 CODESPRINT 6.0 // KRCT
            </span>

            {/* Toggle Assistant */}
            <button
              onClick={() => setIsAssistantOpen(prev => !prev)}
              className={`px-4 py-2 border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer font-mono ${
                isAssistantOpen
                  ? 'bg-accent/10 border-accent text-accent shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                  : 'bg-black border-primary/45 text-primary hover:bg-primary/10'
              }`}
            >
              ✨ SUB-CPU {isAssistantOpen ? 'ONLINE' : 'STDBY'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-grow flex flex-col min-h-0 relative z-10 w-full h-full">
        
        {/* Workspace Stage Panel */}
        <main className="flex-grow p-4 md:p-6 overflow-hidden min-h-0 flex flex-col w-full h-full">
          
          {/* Mobile navigation tab bar (visible on tablet/mobile only) */}
          <div className="md:hidden flex justify-center mb-4 flex-shrink-0 font-mono">
            <div className="bg-black border border-primary/40 p-0.5 inline-flex">
              {[
                { id: 'translator', label: 'Decryptor' },
                { id: 'conversation', label: 'Neural Uplink' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id as any)}
                  className={`px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                    mode === t.id
                      ? 'bg-primary text-black'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="workspace-stage-grid flex-grow min-h-0">
            {mode === 'translator' ? (
              <TranslatorView onAskAssistant={handleAskAssistant} addXp={addXp} />
            ) : (
              <ConversationView onAskAssistant={handleAskAssistant} addXp={addXp} />
            )}
          </div>
        </main>

        {/* Floating AI Sub-CPU Helper Chat Panel & FAB Trigger */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-mono">
          {/* Floating Chat Window */}
          {isAssistantOpen && (
            <div className="shadow-[0_0_30px_rgba(0,255,102,0.2)] animate-in fade-in slide-in-from-bottom-5 duration-300">
              <ChatbotWidget
                isInline={false} // Renders with fixed dimensions: w-[calc(100vw-2rem)] max-w-[360px] h-[500px]
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                contextPrompt={assistantContextPrompt}
                clearContextPrompt={() => setAssistantContextPrompt('')}
                addXp={addXp}
              />
            </div>
          )}

          {/* Pulsating FAB Action Button */}
          <button
            onClick={() => setIsAssistantOpen(prev => !prev)}
            className={`w-12 h-12 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-300 relative group ${
              isAssistantOpen
                ? 'bg-accent border-accent text-black shadow-[0_0_15px_var(--accent)]'
                : 'bg-black border-primary text-primary shadow-[0_0_15px_rgba(0,255,102,0.4)] hover:bg-primary hover:text-black hover:shadow-[0_0_20px_var(--primary)]'
            }`}
            title="Toggle Sub-CPU AI Assistant"
            aria-label="Toggle Sub-CPU AI Assistant"
          >
            {/* Pulsating animation ring */}
            <span className={`absolute -inset-1 rounded-full border animate-ping [animation-duration:2s] pointer-events-none opacity-50 ${
              isAssistantOpen ? 'border-accent' : 'border-primary'
            }`} />
            
            <span className="text-xs font-black tracking-widest uppercase">AI</span>
          </button>
        </div>
      </div>

      {/* Level-Up CRT Glitch Notification Overlay */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md font-mono select-none pointer-events-none">
          <div className="text-center p-8 border border-purple/50 bg-black shadow-[0_0_50px_rgba(255,0,255,0.4)] animate-pulse max-w-md w-full relative">
            <div className="absolute top-2 left-2 text-[8px] text-purple">SYS_ALERT_CRIT_LEVEL_UP</div>
            <div className="text-4xl font-extrabold text-purple cyber-glow-pink tracking-widest mb-4 uppercase animate-bounce">
              Level Up
            </div>
            <p className="text-sm text-foreground uppercase tracking-widest mb-2 font-mono">
              Netrunner Security Cleared
            </p>
            <div className="text-xs text-accent uppercase font-mono tracking-wider">
              Access level increased: <strong className="text-primary text-base">{level}</strong>
            </div>
            <p className="text-[10px] text-muted uppercase mt-4">
              Diagnostic code: 0x00FF66 // Rank: {getRankLabel(level)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
