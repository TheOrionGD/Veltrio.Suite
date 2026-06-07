import React, { useState, useRef, useEffect } from 'react';
import { chatWithGroq, ChatMessage } from '../services/groqService';
import { CloseIcon, SpinnerIcon } from './icons';

interface ChatbotWidgetProps {
  isInline?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  contextPrompt?: string;
  clearContextPrompt?: () => void;
  addXp?: (amount: number) => void;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  isInline = false,
  isOpen = false,
  onClose,
  contextPrompt,
  clearContextPrompt,
  addXp
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'SYSTEM BOOT COMPLETED. Sub-CPU AI core is online. Decryption explanations, idiom translations, syntax modifications, and query diagnostics are fully supported. Input instruction below.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      if (addXp) addXp(25); // Trigger AI query XP reward!
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
      if (addXp) addXp(25); // Trigger AI query XP reward!
    } catch (err: any) {
      setError(err.message || 'Failed to connect.');
    } finally {
      setIsLoading(false);
    }
  };

  const chatContainerCls = isInline
    ? "h-full w-full flex flex-col bg-black/60 border border-primary/20 font-mono text-xs"
    : "w-[calc(100vw-2rem)] max-w-[360px] sm:max-w-[400px] h-[500px] bg-black border border-primary p-1 shadow-2xl flex flex-col overflow-hidden font-mono text-xs";

  return (
    <div className={chatContainerCls}>
      {/* Header */}
      <div className="bg-black border-b border-primary/30 text-primary px-5 py-4 flex items-center justify-between shadow-[0_1px_8px_rgba(0,255,102,0.15)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
          <h3 className="font-extrabold text-[10px] tracking-wider uppercase font-mono">MAINFRAME SUB-CPU INTERFACE</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-primary hover:text-accent transition-colors" aria-label="Close">
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-cyan bg-black/10">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 border text-xs leading-relaxed shadow-sm transition-all duration-200 ${
              msg.role === 'user'
                ? 'bg-black text-primary border-primary/60 shadow-[0_0_8px_rgba(0,255,102,0.1)]'
                : 'bg-black text-accent border-accent/40 shadow-[0_0_8px_rgba(0,255,255,0.1)]'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-black text-muted px-4 py-2.5 border border-primary/20 flex items-center gap-2">
              <SpinnerIcon className="w-4 h-4 animate-spin text-primary" />
              <span className="text-[10px] font-medium uppercase animate-pulse">Core computation in progress...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-[10px] text-center font-medium bg-black p-2.5 border border-red-500/30">
            SYS_ERR: {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Context Action Buttons */}
      {messages.length < 5 && !isLoading && (
        <div className="px-4 pb-2 pt-1 flex flex-wrap gap-2 justify-center flex-shrink-0 bg-black/40 font-mono">
          <button
            onClick={() => handleQuickAction("Explain some common metaphors and idioms across different languages.")}
            className="cyber-button px-3 py-1.5 text-[9px] font-bold"
          >
            💡 Idioms Guide
          </button>
          <button
            onClick={() => handleQuickAction("Give me tips for formal versus informal speech when speaking French, German, or Japanese.")}
            className="cyber-button-cyan px-3 py-1.5 text-[9px] font-bold"
          >
            🗣️ Speech Registers
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-black/90 border-t border-primary/20 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Inject query directive..."
          disabled={isLoading}
          className="flex-grow px-3 py-2.5 border border-primary/30 bg-black text-primary text-xs focus:ring-1 focus:ring-primary outline-none placeholder-muted font-mono"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="cyber-button px-4 py-2 text-xs"
        >
          EXECUTE
        </button>
      </form>
    </div>
  );
};

export default ChatbotWidget;
