import { ChatMessage } from './chat';

export interface Session {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
