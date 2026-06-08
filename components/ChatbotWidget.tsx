import React, { useState, useRef, useEffect } from 'react';
import { chatWithGroq, ChatMessage } from '../services/groqService';
import { CloseIcon, SpinnerIcon } from './icons';

interface ChatbotWidgetProps {
  isInline?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  contextPrompt?: string;
  clearContextPrompt?: () => void;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  isInline = false,
  isOpen = false,
  onClose,
  contextPrompt,
  clearContextPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize greeting on load
  useEffect(() => {
    setMessages([
      { 
        role: 'assistant', 
        content: 'Hello! I am your AI Assistant. I can help explain grammar structures, translate idioms, suggest formal registers, or answer general language questions. How can I help you today?' 
      }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle injected prompt from translation or conversation workspace
  useEffect(() => {
    if (contextPrompt) {
      setInputValue(contextPrompt);
      if (clearContextPrompt) clearContextPrompt();
    }
  }, [contextPrompt, clearContextPrompt]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: inputValue.trim() };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInputValue('');
    setIsLoading(true);
    setError('');

    try {
      const response = await chatWithGroq(updated);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err: any) {
      setError(err.message || 'Failed to connect. Make sure the Groq API key is set in .env.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (actionText: string) => {
    if (isLoading) return;
    const userMessage: ChatMessage = { role: 'user', content: actionText };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setIsLoading(true);
    setError('');

    try {
      const response = await chatWithGroq(updated);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err: any) {
      setError(err.message || 'Failed to connect.');
    } finally {
      setIsLoading(false);
    }
  };

  const chatContainerCls = isInline
    ? "h-full w-full flex flex-col bg-white border border-slate-200 rounded-2xl text-slate-800 font-sans text-xs"
    : "w-[calc(100vw-2rem)] max-w-[360px] sm:max-w-[400px] h-[500px] max-h-[80vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans text-xs";

  return (
    <div className={chatContainerCls}>
      {/* Header */}
      <div className="bg-white border-b border-slate-100 text-slate-900 px-5 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
          <h3 className="font-extrabold text-[11px] tracking-wider uppercase font-sans">AI Translation Assistant</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" aria-label="Close">
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-thin bg-slate-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
            <div className={`max-w-[85%] px-4 py-2.5 border text-xs leading-relaxed rounded-2xl shadow-sm ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white border-indigo-600 rounded-br-none'
                : 'bg-white text-slate-800 border-slate-200 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-400 px-4 py-2.5 border border-slate-200 rounded-2xl rounded-bl-none flex items-center gap-2">
              <SpinnerIcon className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-[10px] font-semibold uppercase animate-pulse">AI is thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-[10px] text-center font-medium bg-red-50 p-2.5 border border-red-200 rounded-xl">
            Error: {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Context Action Buttons */}
      {messages.length < 5 && !isLoading && (
        <div className="px-4 pb-2 pt-2 flex flex-wrap gap-2 justify-center flex-shrink-0 bg-slate-50 border-t border-slate-100 font-sans">
          <button
            onClick={() => handleQuickAction("Explain some common metaphors and idioms across different languages.")}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] text-slate-700 font-bold transition-all shadow-sm cursor-pointer"
          >
            💡 Idioms Guide
          </button>
          <button
            onClick={() => handleQuickAction("Give me tips for formal versus informal speech when speaking French, German, or Japanese.")}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] text-slate-700 font-bold transition-all shadow-sm cursor-pointer"
          >
            🗣️ Speech Registers
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-150 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
          className="flex-grow px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-indigo-500 outline-none placeholder-slate-400 font-sans"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatbotWidget;
