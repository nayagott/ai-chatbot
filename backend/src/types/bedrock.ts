export type BedrockStreamEventType = 'contentBlockDelta' | 'messageStop';

export interface BedrockStreamEvent {
  type: BedrockStreamEventType;
  delta?: string;
  stopReason?: string;
}
