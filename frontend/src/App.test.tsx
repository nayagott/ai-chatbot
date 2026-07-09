import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as sessionApi from './api/session-api';
import * as chatStream from './api/chat-stream';
import type { Session } from './types';
import type { StreamMessageHandlers } from './api/chat-stream';

// FR-FE-010: App (전체 조합 A+B+C, 768px 반응형 사이드바 토글)
// docs/IMPLEMENTATION_PLAN.md 참조. session-api/chat-stream은 vi.mock으로 모킹한다.

vi.mock('./api/session-api');
vi.mock('./api/chat-stream');

describe('App', () => {
  beforeEach(() => {
    vi.mocked(sessionApi.listSessions).mockResolvedValue([]);
  });

  it('새 대화를 생성하고 메시지를 전송하면 스트리밍 응답이 렌더링된다', async () => {
    const user = userEvent.setup();
    const newSession: Session = { id: 'session-1', messages: [], createdAt: 1, updatedAt: 1 };
    vi.mocked(sessionApi.createSession).mockResolvedValue(newSession);
    vi.mocked(chatStream.streamMessage).mockImplementation(
      async (_sessionId: string, _content: string, handlers: StreamMessageHandlers) => {
        handlers.onToken?.('반갑');
        handlers.onDone?.({ role: 'assistant', content: '반갑습니다' }, 'end_turn');
      }
    );

    render(<App />);

    await waitFor(() => expect(sessionApi.listSessions).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: '+ 새 대화' }));
    await waitFor(() => expect(sessionApi.createSession).toHaveBeenCalled());

    await user.type(screen.getByRole('textbox'), '안녕{Enter}');

    expect(await screen.findByText('안녕')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('반갑습니다')).toBeInTheDocument());
    expect(chatStream.streamMessage).toHaveBeenCalledWith(
      'session-1',
      '안녕',
      expect.anything()
    );
  });

  it('세션을 선택하면 해당 세션의 메시지 히스토리가 표시된다', async () => {
    const user = userEvent.setup();
    const sessions: Session[] = [
      {
        id: 'session-1',
        messages: [{ role: 'user', content: '이전 대화' }],
        createdAt: 1,
        updatedAt: 1,
      },
    ];
    vi.mocked(sessionApi.listSessions).mockResolvedValue(sessions);

    render(<App />);

    await user.click(await screen.findByTestId('session-item'));

    expect(await screen.findByText('이전 대화')).toBeInTheDocument();
  });

  it('모바일 폭(≤768px)에서 햄버거 클릭 시 사이드바가 토글된다', async () => {
    const user = userEvent.setup();

    render(<App />);
    await waitFor(() => expect(sessionApi.listSessions).toHaveBeenCalled());

    const sidebarPanel = screen.getByTestId('sidebar-panel');
    expect(sidebarPanel.className).not.toMatch(/sidebar--open/);

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));
    expect(sidebarPanel.className).toMatch(/sidebar--open/);

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));
    expect(sidebarPanel.className).not.toMatch(/sidebar--open/);
  });
});
