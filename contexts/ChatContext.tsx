import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ChatMessage, ChatHistoryEntry, ChatConversation } from '../types/chat';
import { sendChatMessage } from '../lib/chat-api';
import { Task, Habit, HabitLog } from '../types';
import {
  fetchConversations,
  createConversation as createConversationDb,
  fetchMessages,
  saveMessage,
  updateConversationTitle,
  archiveConversation as archiveConversationDb,
} from '../lib/chat-db';

interface ChatContextType {
  // Conversations
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  loadingConversations: boolean;

  // Messages
  messages: ChatMessage[];
  isLoading: boolean;

  // Conversation actions
  createConversation: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;

  // Message actions
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

  // Conversation state
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Message state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    setLoadingConversations(true);
    try {
      const convs = await fetchConversations(user.id);
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const createConversation = useCallback(async () => {
    if (!user) return;

    try {
      const newConv = await createConversationDb(user.id);
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }, [user]);

  const selectConversation = useCallback(async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;

    setCurrentConversation(conv);

    try {
      const msgs = await fetchMessages(id);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  }, [conversations]);

  const archiveConversation = useCallback(async (id: string) => {
    try {
      await archiveConversationDb(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));

      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  }, [currentConversation]);

  const buildHistory = useCallback((): ChatHistoryEntry[] => {
    return messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !session) return;

    // Create conversation if none exists
    let conversationId = currentConversation?.id;
    if (!conversationId) {
      try {
        const newConv = await createConversationDb(user.id);
        setConversations((prev) => [newConv, ...prev]);
        setCurrentConversation(newConv);
        conversationId = newConv.id;
      } catch (error) {
        console.error('Error creating conversation:', error);
        return;
      }
    }

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to database
    try {
      await saveMessage(conversationId, user.id, {
        role: 'user',
        content,
      });

      // Update conversation title if first message
      if (messages.length === 0) {
        const title = content.substring(0, 50);
        await updateConversationTitle(conversationId, title);
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, title } : c))
        );
        setCurrentConversation((prev) => prev ? { ...prev, title } : null);
      }
    } catch (error) {
      console.error('Error saving user message:', error);
    }

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

      // Add assistant message to UI
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        actions: response.actions,
        status: 'sent',
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to database
      await saveMessage(conversationId, user.id, {
        role: 'assistant',
        content: response.message,
        actions: response.actions,
      });

      // Update conversation in list (to reflect updated_at)
      setConversations((prev) => {
        const updated = prev.find((c) => c.id === conversationId);
        if (updated) {
          return [
            { ...updated, updated_at: new Date().toISOString() },
            ...prev.filter((c) => c.id !== conversationId),
          ];
        }
        return prev;
      });

      // Notify parent of data updates
      if (response.updatedData && onDataUpdated) {
        onDataUpdated(response.updatedData);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
        timestamp: new Date(),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [user, session, userName, buildHistory, onDataUpdated, currentConversation, messages.length]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setCurrentConversation(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        loadingConversations,
        messages,
        isLoading,
        createConversation,
        selectConversation,
        archiveConversation,
        sendMessage,
        clearHistory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
