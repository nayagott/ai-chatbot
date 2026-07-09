import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatArea } from './chat-area';
import type { ChatMessage } from '../../types';

// FR-FE-009: ChatArea (C: D+E 컨테이너)
// docs/IMPLEMENTATION_PLAN.md 참조.

describe('ChatArea', () => {
  it('MessageList와 MessageInput을 함께 렌더링한다', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: '안녕' }];

    render(
      <ChatArea
        messages={messages}
        isStreaming={false}
        streamingText=""
        onSend={vi.fn()}
      />
    );

    expect(screen.getByText('안녕')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('메시지를 입력하고 전송하면 onSend가 호출된다', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatArea messages={[]} isStreaming={false} streamingText="" onSend={onSend} />);

    await user.type(screen.getByRole('textbox'), '안녕{Enter}');

    expect(onSend).toHaveBeenCalledWith('안녕');
  });

  it('스트리밍 중이면 입력창이 비활성화된다', () => {
    render(<ChatArea messages={[]} isStreaming={true} streamingText="" onSend={vi.fn()} />);

    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
