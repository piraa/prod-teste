import { supabase } from './supabase';
import { ChatConversation, ChatMessage, AIAction } from '../types/chat';

// Fetch all conversations for a user (non-archived, ordered by most recent)
export async function fetchConversations(userId: string): Promise<ChatConversation[]> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }

  return data || [];
}

// Create a new conversation
export async function createConversation(userId: string, title?: string): Promise<ChatConversation> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({
      user_id: userId,
      title: title || 'Nova conversa',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }

  return data;
}

// Fetch messages for a conversation
export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return (data || []).map((msg) => ({
    id: msg.id,
    conversation_id: msg.conversation_id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: new Date(msg.created_at),
    actions: msg.actions as AIAction[] | undefined,
    status: 'sent' as const,
  }));
}

// Save a message to a conversation
export async function saveMessage(
  conversationId: string,
  userId: string,
  message: {
    role: 'user' | 'assistant';
    content: string;
    actions?: AIAction[];
  }
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role: message.role,
      content: message.content,
      actions: message.actions || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    throw error;
  }

  return {
    id: data.id,
    conversation_id: data.conversation_id,
    role: data.role as 'user' | 'assistant',
    content: data.content,
    timestamp: new Date(data.created_at),
    actions: data.actions as AIAction[] | undefined,
    status: 'sent',
  };
}

// Update conversation title
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  const { error } = await supabase
    .from('chat_conversations')
    .update({ title: title.substring(0, 50) }) // Limit to 50 chars
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation title:', error);
    throw error;
  }
}

// Archive a conversation (soft delete)
export async function archiveConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_conversations')
    .update({ is_archived: true })
    .eq('id', conversationId);

  if (error) {
    console.error('Error archiving conversation:', error);
    throw error;
  }
}

// Delete a conversation permanently
export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}
