import React, { useState, useEffect } from 'react';
import TranslatorView from './components/TranslatorView';
import ConversationView from './components/ConversationView';
import LandingPage from './components/LandingPage';
import ChatbotWidget from './components/ChatbotWidget';
import CommandPalette from './components/CommandPalette';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [mode, setMode] = useState<'translator' | 'conversation'>('translator');
  
  // Workspace States managed at App root for Command Palette access
  const [inputLanguage, setInputLanguage] = useState<string>('auto');
  const [targetLanguage, setTargetLanguage] = useState<string>('es');
  const [translationMode, setTranslationMode] = useState<'native' | 'industrial' | 'customer'>('industrial');
  const [clearHistoryTrigger, setClearHistoryTrigger] = useState<number>(0);

  // Layout UI States
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantContextPrompt, setAssistantContextPrompt] = useState<string>('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sync theme class to HTML node
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  // Command palette listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAskAssistant = (prompt: string) => {
    setIsAssistantOpen(true);
    setAssistantContextPrompt(prompt);
  };

  const handleClearHistory = () => {
    // Clear Local Storage items for history
    try {
      localStorage.removeItem('translationHistory');
      setClearHistoryTrigger(prev => prev + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (showLanding) {
    return (
      <LandingPage 
        onStart={() => setShowLanding(false)} 
        theme={theme} 
        toggleTheme={handleToggleTheme} 
      />
    );
  }

  return (
    <div className="relative min-h-screen text-foreground select-none overflow-x-hidden flex flex-col font-sans transition-colors duration-500">
      
      {/* Immersive Floating Ambient Light Elements */}
      <div className="ambient-bg">
        <div 
          className="ambient-glow bg-gradient-to-tr from-indigo-500/25 via-purple-500/20 to-emerald-500/20 animate-float-slow"
          style={{ transform: `translate(${(mode === 'conversation' ? 10 : -10)}%, ${(mode === 'conversation' ? 5 : -5)}%)` }}
        />
      </div>

      {/* Main Workspace Stage - Boundary-less Content Layout */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 pt-12 pb-32 flex flex-col justify-center items-center z-10">
        <div className="w-full flex-grow flex items-center justify-center fade-in-up">
          {mode === 'translator' ? (
            <TranslatorView 
              onAskAssistant={handleAskAssistant} 
              inputLanguage={inputLanguage}
              setInputLanguage={setInputLanguage}
              targetLanguage={targetLanguage}
              setTargetLanguage={setTargetLanguage}
              translationMode={translationMode}
              setTranslationMode={setTranslationMode}
              clearHistoryTrigger={clearHistoryTrigger}
            />
          ) : (
            <ConversationView 
              onAskAssistant={handleAskAssistant}
              inputLanguage={inputLanguage}
              setInputLanguage={setInputLanguage}
              clearHistoryTrigger={clearHistoryTrigger}
            />
          )}
        </div>
      </main>

      {/* Contextual Floating Actions Navigation Dock */}
      <div className="floating-dock-container">
        <nav className="glass-pill px-6 py-3 flex items-center gap-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/20 transition-all duration-300">
          
          {/* Mode Segment Selectors */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setMode('translator')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold hover-scale flex items-center gap-2 cursor-pointer transition-all ${
                mode === 'translator'
                  ? 'bg-indigo-600 text-white shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Written Link (Text & Files)"
            >
              <span>📝</span>
              <span className="hidden sm:inline">Written Link</span>
            </button>
            
            <button
              onClick={() => setMode('conversation')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold hover-scale flex items-center gap-2 cursor-pointer transition-all ${
                mode === 'conversation'
                  ? 'bg-indigo-600 text-white shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Voice Link (Speech Chat)"
            >
              <span>🎙️</span>
              <span className="hidden sm:inline">Voice Link</span>
            </button>
          </div>

          <div className="w-px h-5 bg-white/10" />

          {/* Quick Actions & Overlay Triggers */}
          <div className="flex items-center gap-4">
            
            {/* Command Palette Button */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent hover:border-white/5 hover-scale cursor-pointer flex items-center gap-1.5 text-xs font-semibold transition-all"
              title="Open Command Palette (Cmd+K)"
            >
              <span>🔍</span>
              <span className="hidden md:inline font-mono text-[9px] bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-zinc-400 font-bold">⌘K</span>
            </button>

            {/* AI Assistant Toggle */}
            <button
              onClick={() => setIsAssistantOpen(prev => !prev)}
              className={`p-2 rounded-xl border hover-scale cursor-pointer text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isAssistantOpen
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border-transparent hover:border-white/5'
              }`}
              title="Toggle AI Co-pilot"
            >
              <span>✨</span>
              <span className="hidden md:inline">Copilot</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent hover:border-white/5 hover-scale cursor-pointer transition-all"
              title={theme === 'dark' ? 'Switch to Light Aura' : 'Switch to Space Aura'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>
      </div>

      {/* sliding / floating AI Assistant overlay panel */}
      {isAssistantOpen && (
        <div className="fixed bottom-28 right-6 z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <ChatbotWidget
            isInline={false}
            isOpen={isAssistantOpen}
            onClose={() => setIsAssistantOpen(false)}
            contextPrompt={assistantContextPrompt}
            clearContextPrompt={() => setAssistantContextPrompt('')}
          />
        </div>
      )}

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectMode={setMode}
        onSelectTargetLanguage={setTargetLanguage}
        onSelectSourceLanguage={setInputLanguage}
        onSelectStyle={setTranslationMode}
        onClearHistory={handleClearHistory}
        onAskAI={handleAskAssistant}
      />
    </div>
  );
};

export default App;
