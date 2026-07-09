import { SessionStore } from '../../src/services/session-store';
import { SessionNotFoundError } from '../../src/types';

// FR-BE-001: POST /sessions 선행 작업 — SessionStore.create()
// FR-BE-002: GET /sessions/:id 선행 작업 — SessionStore.get()
// docs/IMPLEMENTATION_PLAN.md 참조.

describe('SessionStore.create() (FR-BE-001)', () => {
  it('uuid v4 형식 id와 빈 messages 배열을 가진 세션을 생성한다', () => {
    const store = new SessionStore();

    const session = store.create();

    expect(session.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(session.messages).toEqual([]);
    expect(typeof session.createdAt).toBe('number');
    expect(typeof session.updatedAt).toBe('number');
  });

  it('호출마다 다른 id를 생성한다', () => {
    const store = new SessionStore();

    const first = store.create();
    const second = store.create();

    expect(first.id).not.toBe(second.id);
  });
});

describe('SessionStore.get() (FR-BE-002)', () => {
  it('존재하는 세션을 반환한다', () => {
    const store = new SessionStore();
    const created = store.create();

    expect(store.get(created.id)).toEqual(created);
  });

  it('존재하지 않으면 SessionNotFoundError를 던진다', () => {
    const store = new SessionStore();

    expect(() => store.get('없는-id')).toThrow(SessionNotFoundError);
  });
});

describe('SessionStore.delete() (FR-BE-003)', () => {
  it('삭제 후 조회하면 SessionNotFoundError를 던진다', () => {
    const store = new SessionStore();
    const created = store.create();

    store.delete(created.id);

    expect(() => store.get(created.id)).toThrow(SessionNotFoundError);
  });

  it('존재하지 않는 id를 삭제하면 SessionNotFoundError를 던진다', () => {
    const store = new SessionStore();

    expect(() => store.delete('없는-id')).toThrow(SessionNotFoundError);
  });
});
