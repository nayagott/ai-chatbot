import { SessionStore } from '../../src/services/session-store';

// FR-BE-001: POST /sessions 선행 작업 — SessionStore.create()
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
