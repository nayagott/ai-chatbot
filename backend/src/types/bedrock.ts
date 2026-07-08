import { ChatMessage } from './chat';

export interface BedrockConverseRequest {
  modelId: string;
  messages: ChatMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface BedrockConverseResponse {
  message: ChatMessage;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export type BedrockStreamEventType =
  | 'messageStart'
  | 'contentBlockDelta'
  | 'contentBlockStop'
  | 'messageStop'
  | 'metadata';

export interface BedrockStreamEvent {
  type: BedrockStreamEventType;
  delta?: string;
  stopReason?: string;
}
