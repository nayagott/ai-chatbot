import { MessageList } from '../message-list/message-list';
import { MessageInput } from '../message-input/message-input';
import type { ChatMessage } from '../../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingText: string;
  onSend: (content: string) => void;
}

export function ChatArea({ messages, isStreaming, streamingText, onSend }: ChatAreaProps) {
  return (
    <div>
      <MessageList messages={messages} isStreaming={isStreaming} streamingText={streamingText} />
      <MessageInput onSend={onSend} disabled={isStreaming} />
    </div>
  );
}
