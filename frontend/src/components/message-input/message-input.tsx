import { useState } from 'react';
import type { KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');

  function handleSend() {
    const content = value.trim();
    if (content.length === 0) return;
    onSend(content);
    setValue('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="메시지 입력..."
      />
      <button type="button" onClick={handleSend} disabled={disabled || value.trim().length === 0}>
        전송
      </button>
    </div>
  );
}
