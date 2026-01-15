import { supabase } from './supabase';
import { ChatRequest, ChatResponse } from '../types/chat';

interface SendMessageParams extends ChatRequest {
  accessToken: string;
}

export async function sendChatMessage(params: SendMessageParams): Promise<ChatResponse> {
  const { accessToken, ...body } = params;

  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as ChatResponse;
}
