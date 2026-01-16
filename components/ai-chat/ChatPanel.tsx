import React, { useRef, useEffect, useState } from 'react';
import { X, Send, Loader2, Sparkles, PanelLeftClose, PanelLeft, Plus, ListTodo, CalendarDays, TrendingUp, Zap } from 'lucide-react';
import { useChatContext } from '../../contexts/ChatContext';
import { ChatMessage } from './ChatMessage';
import { ConversationList } from './ConversationList';

const quickPrompts = [
  { icon: ListTodo, label: 'Tarefas de hoje', prompt: 'Quais sao minhas tarefas de hoje?' },
  { icon: CalendarDays, label: 'Proxima semana', prompt: 'O que tenho para a proxima semana?' },
  { icon: TrendingUp, label: 'Meu progresso', prompt: 'Como esta meu progresso nos habitos?' },
  { icon: Zap, label: 'Criar tarefa', prompt: 'Crie uma tarefa para ' },
];

const TypingIndicator: React.FC = () => (
  <div className="flex gap-3">
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
      <Sparkles className="w-4 h-4 text-primary" />
    </div>
    <div className="px-4 py-2 rounded-2xl rounded-bl-md bg-muted">
      <div className="flex items-center text-sm text-muted-foreground">
        <span>Pensando</span>
        <span className="typing-dot-1">.</span>
        <span className="typing-dot-2">.</span>
        <span className="typing-dot-3">.</span>
      </div>
    </div>
  </div>
);

interface ChatPanelProps {
  onClose: () => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onQuickPrompt: (prompt: string, autoSend?: boolean) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  onClose,
  inputValue,
  setInputValue,
  onSubmit,
  onQuickPrompt,
}) => {
  const {
    messages,
    isLoading,
    conversations,
    currentConversation,
    loadingConversations,
    createConversation,
    selectConversation,
    archiveConversation,
  } = useChatContext();

  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={`border-r border-border bg-muted/30 transition-all duration-300 overflow-hidden ${
          showSidebar ? 'w-56' : 'w-0'
        }`}
      >
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversation?.id || null}
          loading={loadingConversations}
          onSelect={(id) => {
            selectConversation(id);
            setShowSidebar(false);
          }}
          onCreate={() => {
            createConversation();
            setShowSidebar(false);
          }}
          onArchive={archiveConversation}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={showSidebar ? 'Ocultar conversas' : 'Mostrar conversas'}
            >
              {showSidebar ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
            </button>
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm truncate max-w-[150px]">
              {currentConversation?.title || 'Assistente IA'}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={createConversation}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Nova conversa"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Sparkles className="w-8 h-8 mb-3 text-primary/50" />
              <p className="text-sm font-medium text-foreground">Como posso ajudar voce hoje?</p>
              <p className="text-xs mt-1 mb-4">
                Pergunte sobre suas tarefas, habitos ou peca para criar algo novo.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {quickPrompts.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => onQuickPrompt(item.prompt, !item.prompt.endsWith(' '))}
                    className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 hover:border-border transition-all text-left group"
                  >
                    <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={onSubmit} className="p-4 border-t border-border">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pergunte ou solicite algo ao seu assistente"
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
