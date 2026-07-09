import { render, screen } from '@testing-library/react';
import { MessageList } from './message-list';
import type { ChatMessage } from '../../types';

// FR-FE-006: MessageList (D/G: 메시지 목록, 로딩 상태 — ToolResultCard 제외)
// docs/IMPLEMENTATION_PLAN.md 참조.

describe('MessageList', () => {
  it('메시지들을 순서대로 렌더링한다', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: '안녕' },
      { role: 'assistant', content: '반갑습니다' },
    ];

    render(<MessageList messages={messages} isStreaming={false} streamingText="" />);

    const rendered = screen.getAllByTestId('chat-message');
    expect(rendered).toHaveLength(2);
    expect(rendered[0]).toHaveTextContent('안녕');
    expect(rendered[1]).toHaveTextContent('반갑습니다');
  });

  it('역할에 따라 다른 data-role 속성을 부여한다', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: '안녕' },
      { role: 'assistant', content: '반갑습니다' },
    ];

    render(<MessageList messages={messages} isStreaming={false} streamingText="" />);

    const rendered = screen.getAllByTestId('chat-message');
    expect(rendered[0]).toHaveAttribute('data-role', 'user');
    expect(rendered[1]).toHaveAttribute('data-role', 'assistant');
  });

  it('스트리밍 중이고 아직 델타가 없으면 "응답 생성 중..." placeholder와 로딩 표시를 보여준다', () => {
    render(<MessageList messages={[]} isStreaming={true} streamingText="" />);

    expect(screen.getByText('응답 생성 중...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('스트리밍 중 델타가 도착하면 누적된 텍스트를 보여준다', () => {
    render(<MessageList messages={[]} isStreaming={true} streamingText="안녕하세요" />);

    expect(screen.getByText('안녕하세요')).toBeInTheDocument();
    expect(screen.queryByText('응답 생성 중...')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('스트리밍 중이 아니면 로딩 표시를 보여주지 않는다', () => {
    render(<MessageList messages={[]} isStreaming={false} streamingText="" />);

    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
  });
});
