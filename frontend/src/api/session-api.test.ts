import { createSession, deleteSession, getSession, listSessions } from './session-api';
import type { Session } from '../types';

// FR-FE-001: api/session-api.ts (create/get/delete/list)
// docs/IMPLEMENTATION_PLAN.md 참조. fetch는 vi.stubGlobal로 모킹한다.

const sampleSession: Session = {
  id: 'session-1',
  messages: [],
  createdAt: 1000,
  updatedAt: 1000,
};

function mockFetchJson(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('session-api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('listSessions', () => {
    it('GET /sessions를 호출하고 세션 배열을 반환한다', async () => {
      const fetchMock = mockFetchJson([sampleSession]);

      const result = await listSessions();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/sessions'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual([sampleSession]);
    });
  });

  describe('createSession', () => {
    it('POST /sessions를 호출하고 생성된 세션을 반환한다', async () => {
      const fetchMock = mockFetchJson(sampleSession, 201);

      const result = await createSession();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/sessions'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual(sampleSession);
    });
  });

  describe('getSession', () => {
    it('GET /sessions/:id를 호출하고 세션을 반환한다', async () => {
      const fetchMock = mockFetchJson(sampleSession);

      const result = await getSession('session-1');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-1'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(sampleSession);
    });
  });

  describe('deleteSession', () => {
    it('DELETE /sessions/:id를 호출한다', async () => {
      const fetchMock = mockFetchJson(null, 204);

      await deleteSession('session-1');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
