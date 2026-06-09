import React, { useState, useEffect, useRef } from 'react';
import { LANGUAGES } from '../constants';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'translator' | 'conversation') => void;
  onSelectTargetLanguage: (code: string) => void;
  onSelectSourceLanguage: (code: string) => void;
  onSelectStyle: (style: 'native' | 'industrial' | 'customer') => void;
  onClearHistory: () => void;
  onAskAI: (prompt: string) => void;
}

interface CommandItem {
  id: string;
  category: string;
  name: string;
  description: string;
  syntax: string;
  icon: string;
  action: (arg?: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  onSelectTargetLanguage,
  onSelectSourceLanguage,
  onSelectStyle,
  onClearHistory,
  onAskAI,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Click outside to close
  const overlayRef = useRef<HTMLDivElement>(null);
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const getCommands = (): CommandItem[] => {
    const list: CommandItem[] = [
      {
        id: 'mode-written',
        category: 'Navigation',
        name: 'Switch to Written Link',
        description: 'Open the text-based translation workspace',
        syntax: '/mode written',
        icon: '📝',
        action: () => onSelectMode('translator'),
      },
      {
        id: 'mode-voice',
        category: 'Navigation',
        name: 'Switch to Voice Link',
        description: 'Open the real-time spoken translation workspace',
        syntax: '/mode voice',
        icon: '🎙️',
        action: () => onSelectMode('conversation'),
      },
      {
        id: 'style-native',
        category: 'Register & Style',
        name: 'Set Register: Native',
        description: 'Colloquial and fluent standard native translation',
        syntax: '/style native',
        icon: '🍃',
        action: () => onSelectStyle('native'),
      },
      {
        id: 'style-technical',
        category: 'Register & Style',
        name: 'Set Register: Technical',
        description: 'Precise and technical industrialized translation',
        syntax: '/style technical',
        icon: '⚙️',
        action: () => onSelectStyle('industrial'),
      },
      {
        id: 'style-empathetic',
        category: 'Register & Style',
        name: 'Set Register: Customer Empathetic',
        description: 'Polite and customer satisfaction focused translation',
        syntax: '/style empathetic',
        icon: '🤝',
        action: () => onSelectStyle('customer'),
      },
      {
        id: 'clear-logs',
        category: 'System',
        name: 'Clear Workspace History',
        description: 'Wipe all translation and conversation logs',
        syntax: '/clear',
        icon: '🗑️',
        action: () => onClearHistory(),
      },
    ];

    // Add shortcuts for all target languages
    LANGUAGES.forEach((lang) => {
      list.push({
        id: `translate-to-${lang.code}`,
        category: 'Target Language',
        name: `Translate to: ${lang.name}`,
        description: `Set target language to ${lang.name}`,
        syntax: `/to ${lang.code}`,
        icon: '🌐',
        action: () => onSelectTargetLanguage(lang.code),
      });
      list.push({
        id: `translate-from-${lang.code}`,
        category: 'Source Language',
        name: `Translate from: ${lang.name}`,
        description: `Set source language to ${lang.name}`,
        syntax: `/from ${lang.code}`,
        icon: '🗣️',
        action: () => onSelectSourceLanguage(lang.code),
      });
    });

    // Add from auto
    list.push({
      id: `translate-from-auto`,
      category: 'Source Language',
      name: `Translate from: Auto-Detect`,
      description: `Automatically detect the source spoken or typed language`,
      syntax: `/from auto`,
      icon: '🔍',
      action: () => onSelectSourceLanguage('auto'),
    });

    return list;
  };

  const commands = getCommands();

  // Filter commands
  const filteredCommands = commands.filter((cmd) => {
    const term = query.toLowerCase();
    if (term.startsWith('/')) {
      return (
        cmd.syntax.toLowerCase().includes(term) ||
        cmd.name.toLowerCase().includes(term.slice(1))
      );
    }
    return (
      cmd.name.toLowerCase().includes(term) ||
      cmd.category.toLowerCase().includes(term) ||
      cmd.syntax.toLowerCase().includes(term)
    );
  });

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands.length > 0) {
          executeCommand(filteredCommands[selectedIndex]);
        } else if (query.trim()) {
          // If no matching command, treat it as a direct ask to the AI Assistant
          onAskAI(query.trim());
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, query]);

  // Adjust scroll position to keep selection in view
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const selectedElement = container.children[selectedIndex] as HTMLElement;
    if (!selectedElement) return;

    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const elemTop = selectedElement.offsetTop;
    const elemBottom = elemTop + selectedElement.clientHeight;

    if (elemTop < containerTop) {
      container.scrollTop = elemTop;
    } else if (elemBottom > containerBottom) {
      container.scrollTop = elemBottom - container.clientHeight;
    }
  }, [selectedIndex]);

  const executeCommand = (cmd: CommandItem) => {
    cmd.action();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-[#000000]/70 backdrop-blur-md z-50 flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl glass-panel border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[50vh] shadow-[0_32px_80px_rgba(0,0,0,0.6)] animate-in slide-in-from-top-4 duration-300">
        {/* Input area */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-200/50 dark:border-white/5 bg-zinc-800/[0.02] dark:bg-white/[0.02]">
          <span className="text-zinc-550 dark:text-zinc-400 text-lg">⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command (e.g. /mode voice, /to es) or ask AI..."
            className="flex-grow bg-transparent border-none text-zinc-850 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none text-sm font-sans"
          />
          <span className="text-[10px] bg-zinc-800/10 dark:bg-white/10 px-2 py-0.5 rounded text-zinc-500 dark:text-zinc-400 font-mono tracking-wider font-bold">
            ESC
          </span>
        </div>

        {/* Command list */}
        <div
          ref={listRef}
          className="flex-grow overflow-y-auto py-2 divide-y divide-zinc-200/50 dark:divide-white/[0.02]"
        >
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const active = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-5 py-3 cursor-pointer transition-colors duration-150 ${
                    active ? 'bg-zinc-800/10 dark:bg-white/[0.06] text-black dark:text-white' : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-lg flex-shrink-0 w-6 h-6 flex items-center justify-center bg-zinc-800/5 dark:bg-white/5 rounded-md border border-zinc-200 dark:border-white/5 shadow-sm">
                      {cmd.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold font-sans flex items-center gap-2">
                        <span>{cmd.name}</span>
                        <span className="text-[9px] text-zinc-550 dark:text-zinc-400 bg-zinc-800/5 dark:bg-white/5 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/5 uppercase font-bold tracking-wider font-mono">
                          {cmd.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-sans mt-0.5">
                        {cmd.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-550/20 dark:border-indigo-500/20 shrink-0 ml-2">
                    {cmd.syntax}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-8 text-center">
              <span className="text-2xl block mb-2">✨</span>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-300">No command matching "{query}"</p>
              <p className="text-[10px] text-zinc-550 dark:text-zinc-500 mt-1 font-sans">
                Press <span className="font-bold text-zinc-650 dark:text-zinc-400">Enter</span> to send this query directly to your AI Assistant overlay.
              </p>
            </div>
          )}
        </div>

        {/* Footer help hint */}
        <div className="px-5 py-2.5 bg-zinc-800/[0.01] dark:bg-white/[0.01] border-t border-zinc-200/50 dark:border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-sans">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-zinc-800/10 dark:bg-white/10 px-1 py-0.5 rounded text-zinc-500 dark:text-zinc-400 font-bold font-mono">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="bg-zinc-800/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400 font-bold font-mono">Enter</kbd> Select
            </span>
          </div>
          <span>Intent-Based Action Panel</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
