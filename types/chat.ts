import { Task, Habit, HabitLog } from '../types';

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: AIAction[];
  status: 'sending' | 'sent' | 'error';
}

export interface AIAction {
  type: 'query' | 'create' | 'update' | 'delete';
  entity: 'task' | 'habit' | 'habit_log';
  description: string;
  status: 'pending' | 'executing' | 'success' | 'error';
}

export interface ChatHistoryEntry {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface UserContext {
  userId: string;
  userName: string;
  currentDate: string;
  timezone: string;
}

export interface ChatRequest {
  message: string;
  history: ChatHistoryEntry[];
  context: UserContext;
}

export interface ChatResponse {
  message: string;
  actions: AIAction[];
  updatedData?: {
    tasks?: Task[];
    habits?: Habit[];
    habitLogs?: HabitLog[];
  };
}
