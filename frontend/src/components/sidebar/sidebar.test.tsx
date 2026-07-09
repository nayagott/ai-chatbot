import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './sidebar';
import type { Session } from '../../types';

// FR-FE-007: Sidebar (B: 새 대화, 세션 목록)
// docs/IMPLEMENTATION_PLAN.md 참조.

const sessions: Session[] = [
  { id: 'session-1', messages: [], createdAt: 1, updatedAt: 2 },
  { id: 'session-2', messages: [], createdAt: 1, updatedAt: 1 },
];

describe('Sidebar', () => {
  it('세션 목록을 렌더링한다', () => {
    render(
      <Sidebar
        sessions={sessions}
        activeSessionId={null}
        onNewSession={vi.fn()}
        onSelectSession={vi.fn()}
      />
    );

    expect(screen.getAllByTestId('session-item')).toHaveLength(2);
  });

  it('"+ 새 대화" 버튼을 클릭하면 onNewSession이 호출된다', async () => {
    const user = userEvent.setup();
    const onNewSession = vi.fn();
    render(
      <Sidebar
        sessions={sessions}
        activeSessionId={null}
        onNewSession={onNewSession}
        onSelectSession={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: '+ 새 대화' }));

    expect(onNewSession).toHaveBeenCalledTimes(1);
  });

  it('세션 항목을 클릭하면 onSelectSession이 해당 id와 함께 호출된다', async () => {
    const user = userEvent.setup();
    const onSelectSession = vi.fn();
    render(
      <Sidebar
        sessions={sessions}
        activeSessionId={null}
        onNewSession={vi.fn()}
        onSelectSession={onSelectSession}
      />
    );

    await user.click(screen.getAllByTestId('session-item')[0]);

    expect(onSelectSession).toHaveBeenCalledWith('session-1');
  });

  it('activeSessionId와 일치하는 세션 항목에 active 표시를 한다', () => {
    render(
      <Sidebar
        sessions={sessions}
        activeSessionId="session-2"
        onNewSession={vi.fn()}
        onSelectSession={vi.fn()}
      />
    );

    const items = screen.getAllByTestId('session-item');
    expect(items[0]).toHaveAttribute('aria-current', 'false');
    expect(items[1]).toHaveAttribute('aria-current', 'true');
  });
});
