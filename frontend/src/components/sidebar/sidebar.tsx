import type { Session } from '../../types';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
}

export function Sidebar({ sessions, activeSessionId, onNewSession, onSelectSession }: SidebarProps) {
  return (
    <div>
      <button type="button" onClick={onNewSession}>
        + 새 대화
      </button>
      <ul>
        {sessions.map((session) => (
          <li
            key={session.id}
            data-testid="session-item"
            aria-current={session.id === activeSessionId}
            onClick={() => onSelectSession(session.id)}
          >
            세션 {session.id}
          </li>
        ))}
      </ul>
    </div>
  );
}
