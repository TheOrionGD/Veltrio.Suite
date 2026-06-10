import React, { useState } from 'react';

const HelpView: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How does Veltrio auto-detect languages?',
      a: 'Veltrio runs advanced NLP heuristic classifiers on the first few words of text. This maps syntax pattern signatures to language codes with high confidence scores.',
    },
    {
      q: 'Can I export translations in bulk?',
      a: 'Yes! Navigate to the File Manager, upload your document in .txt or .csv format, select the target languages, and hit translate. Results can then be copied or downloaded as JSON metadata streams.',
    },
    {
      q: 'What is the purpose of the Style modes?',
      a: 'Style modes change the system instructions sent to Groq. Native is colloquial, Technical uses precise engineering terms, and Customer ensures extreme politeness with friendly tone values.',
    },
    {
      q: 'Does Voice Link translate dual speakers?',
      a: 'Absolutely. Voice Link is designed to detects speaker swaps, transcribes audio instantly via Whisper-v3 models, and converts text into spoken output in the target language.',
    },
  ];

  return (
    <div className="w-full max-w-5xl px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b border-zinc-200/50 dark:border-white/5 pb-4">
        <h1 className="text-2xl font-black uppercase tracking-wider text-[#234556] dark:text-[#effbfc]">
          Documentation & Help
        </h1>
        <p className="text-xs text-zinc-500 dark:text-[#b4e4ed]">
          Keyboard shortcuts reference, system tutorials, and FAQ guides
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns: Tutorials and shortcuts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Guide */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#234556] dark:text-[#effbfc] border-b border-zinc-200/50 dark:border-white/5 pb-2">
              ⚡ Quick Start Guide
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 p-3.5 bg-zinc-800/5 dark:bg-white/5 rounded-xl border border-zinc-200/40 dark:border-white/5">
                <span className="text-lg">1️⃣</span>
                <div className="text-xs font-bold text-[#234556] dark:text-white">Configure languages</div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Choose input source detect rules and select your target localization destination.</p>
              </div>
              <div className="space-y-1.5 p-3.5 bg-zinc-800/5 dark:bg-white/5 rounded-xl border border-zinc-200/40 dark:border-white/5">
                <span className="text-lg">2️⃣</span>
                <div className="text-xs font-bold text-[#234556] dark:text-white">Select Style Register</div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Choose native casual, precise technical, or polite corporate satisfaction style modes.</p>
              </div>
              <div className="space-y-1.5 p-3.5 bg-zinc-800/5 dark:bg-white/5 rounded-xl border border-zinc-200/40 dark:border-white/5">
                <span className="text-lg">3️⃣</span>
                <div className="text-xs font-bold text-[#234556] dark:text-white">Run Voice or Written</div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Write text or speak through speech capture mic to start neural translations instantly.</p>
              </div>
            </div>
          </div>

          {/* Keyboard shortcuts table */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#234556] dark:text-[#effbfc] border-b border-zinc-200/50 dark:border-white/5 pb-2">
              ⌨️ Keyboard Shortcuts
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200/50 dark:border-white/5 text-zinc-400 font-mono text-[9px] uppercase tracking-wider">
                    <th className="py-2.5">Action Command</th>
                    <th className="py-2.5">Windows Shortcut</th>
                    <th className="py-2.5">Command Palette Syntax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/35 dark:divide-white/5 text-zinc-700 dark:text-zinc-350">
                  <tr>
                    <td className="py-3 font-semibold text-[#234556] dark:text-white">Toggle Command Palette</td>
                    <td className="py-3 font-mono"><kbd className="bg-zinc-850/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-bold">Ctrl+K</kbd></td>
                    <td className="py-3 text-zinc-500">—</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-[#234556] dark:text-white">Switch to Voice Workspace</td>
                    <td className="py-3 font-mono"><kbd className="bg-zinc-850/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-bold">Ctrl+M</kbd></td>
                    <td className="py-3 font-mono text-[#2896b2] dark:text-[#44b3cc] font-bold">/mode voice</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-[#234556] dark:text-white">Trigger speech recording</td>
                    <td className="py-3 font-mono"><kbd className="bg-zinc-850/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-bold">Spacebar</kbd> (when focused)</td>
                    <td className="py-3 text-zinc-500">—</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-[#234556] dark:text-white">Set Target: Spanish</td>
                    <td className="py-3 text-zinc-500">—</td>
                    <td className="py-3 font-mono text-[#2896b2] dark:text-[#44b3cc] font-bold">/to es</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: FAQ accordion */}
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#234556] dark:text-[#effbfc] border-b border-zinc-200/50 dark:border-white/5 pb-2">
              ❓ FAQ Guides
            </h2>

            <div className="space-y-2">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-zinc-200/50 dark:border-white/5 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full text-left p-3.5 bg-zinc-800/5 dark:bg-white/5 hover:bg-zinc-800/10 dark:hover:bg-white/10 text-xs font-bold text-[#234556] dark:text-white flex justify-between items-center transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span>{activeFaq === idx ? '▲' : '▼'}</span>
                  </button>

                  {activeFaq === idx && (
                    <div className="p-3.5 bg-transparent border-t border-zinc-200/50 dark:border-white/5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed animate-slide-down">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpView;
