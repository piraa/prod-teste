import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { useChatContext } from '../../contexts/ChatContext';
import { ChatPanel } from './ChatPanel';

export const ChatCenterbar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { sendMessage, isLoading, messages } = useChatContext();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');

    if (!isExpanded) {
      setIsExpanded(true);
    }

    await sendMessage(message);
  };

  // Keyboard shortcut: Cmd/Ctrl + K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isExpanded) {
          // If expanded, the input inside ChatPanel will handle focus
        } else {
          inputRef.current?.focus();
        }
      }
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Auto-expand when there are messages
  useEffect(() => {
    if (messages.length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [messages.length]);

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Main container */}
      <div className={`fixed z-50 transition-all duration-300 ease-out ${
        isExpanded
          ? 'bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4'
          : 'bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4'
      }`}>
        <div className={`bg-card border border-border rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
          isExpanded ? 'h-[500px]' : 'h-12'
        }`}>
          {isExpanded ? (
            <ChatPanel
              onClose={() => setIsExpanded(false)}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSubmit={handleSubmit}
            />
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center h-full px-4 gap-3">
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="flex-shrink-0 hover:scale-110 transition-transform"
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Pergunte ou peca algo... (Cmd+K)"
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`p-1.5 rounded-lg transition-colors ${
                  inputValue.trim() && !isLoading
                    ? 'bg-primary text-primary-foreground hover:brightness-110'
                    : 'text-muted-foreground'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};
