import React from 'react';
import { User, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary' : 'bg-muted'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Sparkles className="w-4 h-4 text-primary" />
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        }`}>
          {message.content}
        </div>

        {/* Actions indicator */}
        {message.actions && message.actions.length > 0 && (
          <div className="space-y-1">
            {message.actions.map((action, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                {action.status === 'executing' && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
                {action.status === 'success' && (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                )}
                {action.status === 'error' && (
                  <AlertCircle className="w-3 h-3 text-destructive" />
                )}
                {action.status === 'pending' && (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                )}
                <span>{action.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className={`text-[10px] text-muted-foreground block ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
};
