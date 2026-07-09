import type { ChatMessage } from '../../types';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingText: string;
}

export function MessageList({ messages, isStreaming, streamingText }: MessageListProps) {
  return (
    <div>
      {messages.map((message, index) => (
        <div key={index} data-testid="chat-message" data-role={message.role}>
          {message.content}
        </div>
      ))}
      {isStreaming && (
        <>
          <div data-testid="chat-message" data-role="assistant">
            {streamingText.length > 0 ? streamingText : '응답 생성 중...'}
          </div>
          <div data-testid="loading-indicator">Loading</div>
        </>
      )}
    </div>
  );
}
