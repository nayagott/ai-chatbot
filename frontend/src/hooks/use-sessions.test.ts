import { act, renderHook, waitFor } from '@testing-library/react';
import { useSessions } from './use-sessions';
import * as sessionApi from '../api/session-api';
import type { Session } from '../types';

// FR-FE-003: useSessions (목록 로드/생성/선택)
// docs/IMPLEMENTATION_PLAN.md 참조. session-api는 vi.mock으로 모킹한다.

vi.mock('../api/session-api');

const sessionA: Session = { id: 'a', messages: [], createdAt: 1, updatedAt: 1 };
const sessionB: Session = { id: 'b', messages: [], createdAt: 2, updatedAt: 2 };

describe('useSessions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('마운트 시 세션 목록을 로드한다', async () => {
    vi.mocked(sessionApi.listSessions).mockResolvedValue([sessionA, sessionB]);

    const { result } = renderHook(() => useSessions());

    await waitFor(() => {
      expect(result.current.sessions).toEqual([sessionA, sessionB]);
    });
  });

  it('새 세션 생성 시 목록 맨 앞에 추가되고 활성 세션으로 선택된다', async () => {
    vi.mocked(sessionApi.listSessions).mockResolvedValue([sessionA]);
    const newSession: Session = { id: 'c', messages: [], createdAt: 3, updatedAt: 3 };
    vi.mocked(sessionApi.createSession).mockResolvedValue(newSession);

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.sessions).toEqual([sessionA]));

    await act(async () => {
      await result.current.createNewSession();
    });

    expect(result.current.sessions).toEqual([newSession, sessionA]);
    expect(result.current.activeSessionId).toBe(newSession.id);
  });

  it('세션을 선택하면 activeSessionId가 갱신된다', async () => {
    vi.mocked(sessionApi.listSessions).mockResolvedValue([sessionA, sessionB]);

    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.sessions).toEqual([sessionA, sessionB]));

    act(() => {
      result.current.selectSession(sessionB.id);
    });

    expect(result.current.activeSessionId).toBe(sessionB.id);
  });
});
