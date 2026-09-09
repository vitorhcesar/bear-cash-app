import { BaseApiModule } from '@/infra/http/services/api/modules/base-api.module';

export const AI_MESSAGE_MAX_LENGTH = 4000;

export type AiMessageRole = 'user' | 'assistant';

export type AiMessage = {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
};

export type AiConversationSummary = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
};

export type AiConversationListResponse = {
  items: AiConversationSummary[];
};

export type AiConversationDetail = {
  id: string;
  title: string;
  messages: AiMessage[];
  createdAt: string;
  updatedAt: string;
};

export type ChatWithBearCashInput = {
  conversationId?: string;
  message: string;
};

export type ChatWithBearCashResponse = {
  conversationId: string;
  title: string;
  message: AiMessage;
};

export interface IAiModule {
  chat(input: ChatWithBearCashInput): Promise<ChatWithBearCashResponse>;
  listConversations(query?: string): Promise<AiConversationListResponse>;
  getConversation(id: string): Promise<AiConversationDetail>;
}

export class AiModule extends BaseApiModule implements IAiModule {
  chat(input: ChatWithBearCashInput) {
    return this.http.post<ChatWithBearCashResponse>('/api/v1/ai/chat', input);
  }

  listConversations(query?: string) {
    return this.http.get<AiConversationListResponse>('/api/v1/ai/conversations', {
      params: query?.trim() ? { q: query.trim() } : undefined,
    });
  }

  getConversation(id: string) {
    return this.http.get<AiConversationDetail>(`/api/v1/ai/conversations/${id}`);
  }
}
