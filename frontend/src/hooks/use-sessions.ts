import { useCallback, useEffect, useState } from 'react';
import { createSession, listSessions } from '../api/session-api';
import type { Session } from '../types';

export interface UseSessionsResult {
  sessions: Session[];
  activeSessionId: string | null;
  createNewSession: () => Promise<void>;
  selectSession: (id: string) => void;
}

export function useSessions(): UseSessionsResult {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    listSessions().then(setSessions);
  }, []);

  const createNewSession = useCallback(async () => {
    const session = await createSession();
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
  }, []);

  const selectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  return { sessions, activeSessionId, createNewSession, selectSession };
}
