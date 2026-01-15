import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ChatMessage, ChatHistoryEntry, AIAction } from '../types/chat';
import { sendChatMessage } from '../lib/chat-api';
import { Task, Habit, HabitLog } from '../types';

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
  userName?: string;
  onDataUpdated?: (data: {
    tasks?: Task[];
    habits?: Habit[];
    habitLogs?: HabitLog[];
  }) => void;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, userName, onDataUpdated }) => {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const buildHistory = useCallback((): ChatHistoryEntry[] => {
    return messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !session) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: content,
        history: buildHistory(),
        context: {
          userId: user.id,
          userName: userName || user.email?.split('@')[0] || 'Usuario',
          currentDate: new Date().toISOString().split('T')[0],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        accessToken: session.access_token,
      });

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        actions: response.actions,
        status: 'sent',
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Notify parent of data updates
      if (response.updatedData && onDataUpdated) {
        onDataUpdated(response.updatedData);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
        timestamp: new Date(),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [user, session, userName, buildHistory, onDataUpdated]);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, isLoading, sendMessage, clearHistory }}>
      {children}
    </ChatContext.Provider>
  );
};
