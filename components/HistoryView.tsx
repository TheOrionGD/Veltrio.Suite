import React, { useState } from 'react';
import { HistoryItem, AppPage } from '../types';

interface HistoryViewProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  setInputText: (text: string) => void;
  setTargetLanguage: (lang: string) => void;
  setCurrentPage: (page: AppPage) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onClearHistory,
  onDeleteHistoryItem,
  setInputText,
  setTargetLanguage,
  setCurrentPage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLang, setFilterLang] = useState('all');
  const [filterSentiment, setFilterSentiment] = useState('all');

  // Filter list
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.inputText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translatedText.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLang = filterLang === 'all' || item.targetLanguage === filterLang;
    const matchesSentiment = filterSentiment === 'all' || item.sentiment?.sentiment === filterSentiment;

    return matchesSearch && matchesLang && matchesSentiment;
  });

  // Unique languages in logs
  const loggedLangs: string[] = Array.from(new Set(history.map((h) => JSON.stringify({ code: h.targetLanguage, name: h.targetLanguageName }))));

  const handleReplay = (item: HistoryItem) => {
    setInputText(item.inputText);
    setTargetLanguage(item.targetLanguage);
    setCurrentPage('translator');
  };

  return (
    <div className="w-full max-w-5xl px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/50 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-[#234556] dark:text-[#effbfc]">
            Workspace Logs
          </h1>
          <p className="text-xs text-zinc-500 dark:text-[#b4e4ed]">
            Timeline history of all translation translations & conversation links
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-4 py-2 bg-red-650/10 border border-red-500/20 text-red-500 hover:bg-red-550/15 rounded-xl text-xs font-bold transition-all hover-scale cursor-pointer"
          >
            Clear All History
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-850/[0.02] dark:bg-white/[0.02] p-4 border border-zinc-200/40 dark:border-white/5 rounded-2xl">
        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Search text</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search query logs..."
            className="glass-input px-3 py-2 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Target Language</label>
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="glass-input px-3 py-2 rounded-xl text-xs text-zinc-850 dark:text-zinc-100 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 cursor-pointer"
          >
            <option value="all">All Languages</option>
            {loggedLangs.map((jsonStr) => {
              const langObj = JSON.parse(jsonStr);
              return (
                <option key={langObj.code} value={langObj.code}>
                  {langObj.name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Sentiment valency</label>
          <select
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            className="glass-input px-3 py-2 rounded-xl text-xs text-zinc-850 dark:text-zinc-100 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 cursor-pointer"
          >
            <option value="all">All Sentiments</option>
            <option value="Positive">Positive 😊</option>
            <option value="Neutral">Neutral 😐</option>
            <option value="Negative">Negative 😢</option>
          </select>
        </div>
      </div>

      {/* Logs timeline list */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <p className="text-xs text-zinc-500 italic text-center py-12">
            {history.length === 0 ? 'No logged translations in current workspace.' : 'No logs matches current search filters.'}
          </p>
        ) : (
          filteredHistory.map((item) => {
            const sentimentColor =
              item.sentiment?.sentiment === 'Positive'
                ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
                : item.sentiment?.sentiment === 'Negative'
                ? 'text-red-500 border-red-500/20 bg-red-500/10'
                : 'text-zinc-500 border-zinc-500/20 bg-zinc-500/10';

            return (
              <div
                key={item.id}
                className="glass-panel p-5 space-y-4 hover:border-[#44b3cc]/30 transition-all flex flex-col justify-between"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                      Auto-detected ({item.detectedLanguageName || 'Unknown'}) ➔ {item.targetLanguageName}
                    </span>
                    <h2 className="text-sm font-bold text-[#234556] dark:text-white leading-relaxed">{item.inputText}</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed italic">{item.translatedText}</p>
                  </div>

                  <button
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="text-zinc-400 hover:text-red-500 transition-colors p-1 text-xs cursor-pointer"
                    title="Delete log entry"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200/40 dark:border-white/5 pt-3">
                  {/* Indicators */}
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${sentimentColor}`}>
                      {item.sentiment?.sentiment} · {item.sentiment?.tone}
                    </span>

                    {item.qualityScore && (
                      <span className="text-[9px] font-mono text-zinc-400">
                        Quality: {Math.round(item.qualityScore * 100)}%
                      </span>
                    )}

                    {item.clarityScore && (
                      <span className="text-[9px] font-mono text-zinc-400">
                        Clarity: {Math.round(item.clarityScore * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReplay(item)}
                      className="px-3 py-1.5 bg-[#44b3cc]/10 hover:bg-[#44b3cc] text-[#2896b2] dark:text-[#44b3cc] hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Replay in written workspace
                    </button>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HistoryView;
