import React from 'react';
import { HistoryItem, AppPage } from '../types';

interface DashboardViewProps {
  history: HistoryItem[];
  setCurrentPage: (page: AppPage) => void;
  onAskAssistant: (prompt: string) => void;
  setInputText: (text: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  history,
  setCurrentPage,
  onAskAssistant,
  setInputText,
}) => {
  // Compute some stats
  const totalCharacters = history.reduce((acc, curr) => acc + curr.inputText.length, 0);
  const positiveCount = history.filter((h) => h.sentiment?.sentiment === 'Positive').length;
  const sentimentPct = history.length > 0 ? Math.round((positiveCount / history.length) * 100) : 100;
  
  // Quick start suggestions
  const handleQuickTranslate = (phrase: string) => {
    setInputText(phrase);
    setCurrentPage('translator');
  };

  return (
    <div className="w-full max-w-5xl px-4 py-8 space-y-8 animate-fade-in">
      {/* Header Profile Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-[#234556] dark:text-[#effbfc]">
            Workspace Center
          </h1>
          <p className="text-xs text-zinc-500 dark:text-[#b4e4ed]">
            Real-time Translation Hub · Interactive NLP Dashboard
          </p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-800/5 dark:bg-white/5 px-4 py-2 border border-zinc-200/40 dark:border-white/5 rounded-xl font-mono text-[10px] tracking-wider text-purple dark:text-[#b4e4ed]">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          SYSTEM METRICS LOGGED: ACTIVE
        </div>
      </div>

      {/* Grid statistics metrics with pure SVG sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1 */}
        <div className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-accent/35 transition-colors duration-300">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500">Timeline Events</span>
            <div className="text-3xl font-black text-[#234556] dark:text-[#effbfc] mt-1">{history.length}</div>
          </div>
          <div className="h-10 w-full">
            <svg viewBox="0 0 100 30" className="w-full h-full text-accent" preserveAspectRatio="none">
              <path
                d="M0,25 Q15,5 30,20 T60,10 T80,18 T100,5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-accent/35 transition-colors duration-300">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500">Language Pairs</span>
            <div className="text-3xl font-black text-[#234556] dark:text-[#effbfc] mt-1">
              {new Set(history.map((h) => h.targetLanguage)).size || 1}
            </div>
          </div>
          <div className="h-10 w-full">
            <svg viewBox="0 0 100 30" className="w-full h-full text-primary" preserveAspectRatio="none">
              <path
                d="M0,20 Q20,15 40,25 T80,5 T100,15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-accent/35 transition-colors duration-300">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500">Sentences Valency</span>
            <div className="text-3xl font-black text-[#234556] dark:text-[#effbfc] mt-1">{sentimentPct}% Pos.</div>
          </div>
          <div className="h-10 w-full">
            <svg viewBox="0 0 100 30" className="w-full h-full text-emerald-500" preserveAspectRatio="none">
              <path
                d="M0,15 Q30,5 50,15 T100,8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="glass-panel p-5 flex flex-col justify-between space-y-4 hover:border-accent/35 transition-colors duration-300">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500">Character Weight</span>
            <div className="text-3xl font-black text-[#234556] dark:text-[#effbfc] mt-1">{totalCharacters} char</div>
          </div>
          <div className="h-10 w-full">
            <svg viewBox="0 0 100 30" className="w-full h-full text-amber-500" preserveAspectRatio="none">
              <path
                d="M0,28 Q20,10 40,25 T70,12 T100,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Quick Launch & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#234556] dark:text-[#effbfc] border-b border-zinc-200/50 dark:border-white/5 pb-2">
              🚀 Quick Launcher
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentPage('translator')}
                className="p-4 rounded-xl text-left bg-gradient-to-br from-accent/5 to-primary/10 border border-zinc-200 dark:border-white/10 hover-scale cursor-pointer group"
              >
                <div className="text-lg mb-1">📝</div>
                <div className="text-xs font-bold text-[#234556] dark:text-white group-hover:text-accent transition-colors">Launch Written Translator</div>
                <div className="text-[10px] text-zinc-500 mt-1">Translate documents or structured text side-by-side.</div>
              </button>

              <button
                onClick={() => setCurrentPage('conversation')}
                className="p-4 rounded-xl text-left bg-gradient-to-br from-accent/5 to-primary/10 border border-zinc-200 dark:border-white/10 hover-scale cursor-pointer group"
              >
                <div className="text-lg mb-1">🎙️</div>
                <div className="text-xs font-bold text-[#234556] dark:text-white group-hover:text-accent transition-colors">Launch Voice Link</div>
                <div className="text-[10px] text-zinc-500 mt-1">Real-time bilingual meeting speech translation.</div>
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#234556] dark:text-[#effbfc] border-b border-zinc-200/50 dark:border-white/5 pb-2">
              💡 Common Starters
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {[
                'Hello! Let us start compiling details.',
                'Good evening, we need a technical translation.',
                'I am delighted with our collaboration session.',
                'Let us inspect the translation quality results.'
              ].map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => handleQuickTranslate(phrase)}
                  className="px-3.5 py-2 rounded-xl text-xs bg-zinc-800/5 dark:bg-white/5 hover:bg-zinc-800/10 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover-scale cursor-pointer text-left"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: History Summary & AI Insights */}
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#234556] dark:text-[#effbfc] border-b border-zinc-200/50 dark:border-white/5 pb-2">
              🕐 Mini Timeline
            </h2>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No events in the timeline yet.</p>
              ) : (
                history.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setInputText(item.inputText);
                      setCurrentPage('translator');
                    }}
                    className="p-3 bg-zinc-800/5 dark:bg-white/5 hover:bg-accent/10 border border-zinc-200/40 dark:border-white/5 rounded-xl transition-all cursor-pointer space-y-1 hover-scale"
                  >
                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                      <span>Auto → {item.targetLanguageName}</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs font-semibold text-[#234556] dark:text-white truncate">{item.inputText}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{item.translatedText}</p>
                  </div>
                ))
              )}
            </div>
            {history.length > 0 && (
              <button
                onClick={() => setCurrentPage('history')}
                className="w-full text-center text-xs font-bold text-primary hover:text-accent mt-2 block cursor-pointer"
              >
                View full history ➔
              </button>
            )}
          </div>

          {/* AI Advisor Panel */}
          <div className="glass-panel p-6 bg-gradient-to-br from-accent/5 via-primary/10 to-transparent space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h2 className="text-xs font-black uppercase tracking-widest text-primary dark:text-accent">
                Aura Copilot
              </h2>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-[#b4e4ed] leading-relaxed">
              Veltrio’s AI translator detects sentiment tone and translates based on selected style mode rules. Ask me layout or vocabulary questions.
            </p>
            <button
              onClick={() => onAskAssistant("What are some helpful tips to optimize translation style mode in Veltrio?")}
              className="w-full text-center py-2 bg-accent hover:bg-primary text-white rounded-xl text-xs font-bold transition-all hover-scale cursor-pointer"
            >
              Ask Copilot Tips
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
