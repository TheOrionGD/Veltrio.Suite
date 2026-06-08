import React, { useState, useEffect } from 'react';
import TranslatorView from './components/TranslatorView';
import ConversationView from './components/ConversationView';
import LandingPage from './components/LandingPage';
import ChatbotWidget from './components/ChatbotWidget';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [mode, setMode] = useState<'translator' | 'conversation'>('translator');
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const [assistantContextPrompt, setAssistantContextPrompt] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Force light-theme only, disable dark classes
    document.documentElement.classList.remove('dark');
  }, []);



  const handleAskAssistant = (prompt: string) => {
    setIsAssistantOpen(true);
    setAssistantContextPrompt(prompt);
  };

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} theme="light" toggleTheme={() => {}} />;
  }

  return (
    <div className="cyber-container min-h-screen text-foreground font-sans app-shell-grid">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Veltrio Logo"
              className="w-8 h-8 object-contain bg-slate-50 p-0.5 rounded-lg border border-slate-100"
            />
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                Veltrio
              </span>
              <span className="text-[9px] font-bold text-indigo-600 tracking-wider leading-none mt-1 hidden sm:inline uppercase">
                Enterprise Translation Hub
              </span>
            </div>
          </div>

          {/* Desktop Mode Switcher - Centered in Header */}
          <div className="hidden md:flex bg-slate-100 border border-slate-200 p-0.5 rounded-lg font-sans">
            {[
              { id: 'translator', label: 'Translator Dashboard' },
              { id: 'conversation', label: 'Live Voice Mode' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setMode(item.id as any)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${mode === item.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Clean SaaS header options */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Professional Status Badge */}
            <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 border border-indigo-100 text-[10px] font-bold text-indigo-600 rounded-lg bg-indigo-50 font-sans uppercase">
              Professional SaaS Active
            </span>

            {/* Toggle Assistant */}
            <button
              onClick={() => setIsAssistantOpen(prev => !prev)}
              className={`px-4 py-2 border rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer font-sans ${isAssistantOpen
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              ✨ AI Assistant {isAssistantOpen ? 'Active' : 'Standby'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-grow flex flex-col relative z-10 w-full">

        {/* Workspace Stage Panel */}
        <main className="flex-grow p-4 md:p-6 flex flex-col w-full bg-slate-50/50">

          {/* Mobile navigation tab bar (visible on tablet/mobile only) */}
          <div className="md:hidden flex justify-center mb-4 flex-shrink-0 font-sans">
            <div className="bg-slate-100 border border-slate-200 p-0.5 rounded-lg inline-flex">
              {[
                { id: 'translator', label: 'Translator' },
                { id: 'conversation', label: 'Live Voice' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id as any)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${mode === t.id
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="workspace-stage-grid flex-grow">
            {mode === 'translator' ? (
              <TranslatorView onAskAssistant={handleAskAssistant} />
            ) : (
              <ConversationView onAskAssistant={handleAskAssistant} />
            )}
          </div>
        </main>

        {/* Floating AI Helper Chat Panel & FAB Trigger */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
          {/* Floating Chat Window */}
          {isAssistantOpen && (
            <div className="shadow-xl rounded-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
              <ChatbotWidget
                isInline={false} // Renders with fixed dimensions: w-[calc(100vw-2rem)] max-w-[360px] h-[500px]
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                contextPrompt={assistantContextPrompt}
                clearContextPrompt={() => setAssistantContextPrompt('')}
              />
            </div>
          )}

          {/* Pulsating FAB Action Button */}
          <button
            onClick={() => setIsAssistantOpen(prev => !prev)}
            className={`w-12 h-12 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-300 relative group ${isAssistantOpen
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                : 'bg-white border-slate-200 text-slate-700 shadow-lg hover:bg-slate-50'
              }`}
            title="Toggle AI Assistant"
            aria-label="Toggle AI Assistant"
          >
            {/* Pulsating animation ring */}
            <span className={`absolute -inset-1 rounded-full border animate-ping [animation-duration:2s] pointer-events-none opacity-20 ${isAssistantOpen ? 'border-indigo-600' : 'border-slate-300'
              }`} />

            <span className="text-xs font-bold uppercase">AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
