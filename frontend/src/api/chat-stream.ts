import type { ChatMessage } from '../types';
import { API_BASE_URL } from './base-url';

export interface StreamMessageHandlers {
  onToken?: (delta: string) => void;
  onDone?: (message: ChatMessage, stopReason: string) => void;
  onError?: (message: string) => void;
}

interface TokenEventData {
  delta: string;
}

interface DoneEventData {
  message: ChatMessage;
  stopReason: string;
}

interface ErrorEventData {
  message: string;
}

function dispatchSseBlock(block: string, handlers: StreamMessageHandlers): void {
  const lines = block.split('\n');
  const eventLine = lines.find((line) => line.startsWith('event: '));
  const dataLine = lines.find((line) => line.startsWith('data: '));
  if (!eventLine || !dataLine) return;

  const eventName = eventLine.replace('event: ', '');
  const rawData = dataLine.replace('data: ', '');

  if (eventName === 'token') {
    const data = JSON.parse(rawData) as TokenEventData;
    handlers.onToken?.(data.delta);
  } else if (eventName === 'done') {
    const data = JSON.parse(rawData) as DoneEventData;
    handlers.onDone?.(data.message, data.stopReason);
  } else if (eventName === 'error') {
    const data = JSON.parse(rawData) as ErrorEventData;
    handlers.onError?.(data.message);
  }
}

export async function streamMessage(
  sessionId: string,
  content: string,
  handlers: StreamMessageHandlers
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'user', content }),
  });

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      dispatchSseBlock(block, handlers);
    }
  }

  if (buffer.trim().length > 0) {
    dispatchSseBlock(buffer, handlers);
  }
}
