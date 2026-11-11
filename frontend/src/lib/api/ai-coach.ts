import apiClient from "./client";

export type CoachPriorityType =
  | "HABIT"
  | "NUTRITION"
  | "GOAL"
  | "GENERAL";

export interface CoachPriority {
  type: CoachPriorityType;
  title: string;
  reason: string;
}

export interface CoachResponse {
  message: string;
  priorities: CoachPriority[];
}

export interface SendCoachMessageInput {
  message: string;
  conversationId?: string;
}


export interface SendCoachMessageResult {
  conversationId: string;
  response: CoachResponse;
}

export async function sendCoachMessage(
  input: SendCoachMessageInput,
): Promise<SendCoachMessageResult> {
  const result = await apiClient.post<{
    success: boolean;
    data: {
      response: SendCoachMessageResult;
    };
  }>("/ai/coach", input);

  return result.data.data.response;
}



export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

export interface ConversationMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const result = await apiClient.get<{
    success: boolean;
    data: {
      conversations: ConversationSummary[];
    };
  }>("/ai/conversations");

  return result.data.data.conversations;
}

export async function getConversation(
  id: string,
): Promise<Conversation> {
  const result = await apiClient.get<{
    success: boolean;
    data: {
      conversation: Conversation;
    };
  }>(`/ai/conversations/${id}`);

  return result.data.data.conversation;
}


export async function deleteConversation(
  id: string
): Promise<void> {
  await apiClient.delete(`/ai/conversations/${id}`);
}