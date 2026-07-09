import { useCallback, useState } from 'react';
import { streamMessage } from '../api/chat-stream';
import type { ChatMessage } from '../types';

export interface UseChatStreamResult {
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  sendMessage: (sessionId: string, content: string) => Promise<void>;
}

export function useChatStream(): UseChatStreamResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (sessionId: string, content: string) => {
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setStreamingText('');
    setIsStreaming(true);

    await streamMessage(sessionId, content, {
      onToken: (delta) => {
        setStreamingText((prev) => prev + delta);
      },
      onDone: (message) => {
        setMessages((prev) => [...prev, message]);
        setStreamingText('');
        setIsStreaming(false);
      },
      onError: () => {
        setStreamingText('');
        setIsStreaming(false);
      },
    });
  }, []);

  return { messages, streamingText, isStreaming, sendMessage };
}
