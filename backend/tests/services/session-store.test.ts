import { SessionStore } from '../../src/services/session-store';
import { SessionNotFoundError } from '../../src/types';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore();
  });

  describe('create', () => {
    it('uuid v4 형식의 id와 빈 메시지 배열을 가진 세션을 생성한다', () => {
      const session = store.create();

      expect(session.id).toMatch(UUID_V4_REGEX);
      expect(session.messages).toEqual([]);
      expect(session.createdAt).toBe(session.updatedAt);
    });

    it('호출할 때마다 서로 다른 id를 생성한다', () => {
      const first = store.create();
      const second = store.create();

      expect(first.id).not.toBe(second.id);
    });
  });

  describe('get', () => {
    it('존재하는 세션을 반환한다', () => {
      const created = store.create();

      expect(store.get(created.id)).toEqual(created);
    });

    it('존재하지 않는 세션 id로 조회하면 SessionNotFoundError를 던진다', () => {
      expect(() => store.get('없는-id')).toThrow(SessionNotFoundError);
    });
  });

  describe('addMessage', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('세션에 메시지를 추가하고 updatedAt을 갱신한다', () => {
      jest.useFakeTimers().setSystemTime(1000);
      const session = store.create();

      jest.setSystemTime(2000);
      store.addMessage(session.id, { role: 'user', content: '안녕' });

      const updated = store.get(session.id);
      expect(updated.messages).toEqual([{ role: 'user', content: '안녕' }]);
      expect(updated.createdAt).toBe(1000);
      expect(updated.updatedAt).toBe(2000);
    });

    it('메시지를 추가한 순서대로 messages 배열에 쌓는다', () => {
      const session = store.create();

      store.addMessage(session.id, { role: 'user', content: '안녕' });
      store.addMessage(session.id, { role: 'assistant', content: '반갑습니다' });

      expect(store.get(session.id).messages).toEqual([
        { role: 'user', content: '안녕' },
        { role: 'assistant', content: '반갑습니다' },
      ]);
    });

    it('존재하지 않는 세션 id에 메시지를 추가하려 하면 SessionNotFoundError를 던진다', () => {
      expect(() => store.addMessage('없는-id', { role: 'user', content: '안녕' })).toThrow(
        SessionNotFoundError
      );
    });
  });

  describe('list', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('세션이 없으면 빈 배열을 반환한다', () => {
      expect(store.list()).toEqual([]);
    });

    it('생성된 모든 세션을 반환한다', () => {
      const first = store.create();
      const second = store.create();

      const result = store.list();
      expect(result).toHaveLength(2);
      expect(result.map((session) => session.id)).toEqual(
        expect.arrayContaining([first.id, second.id])
      );
    });

    it('updatedAt 기준 내림차순으로 정렬해서 반환한다', () => {
      jest.useFakeTimers().setSystemTime(1000);
      const first = store.create();

      jest.setSystemTime(2000);
      const second = store.create();

      jest.setSystemTime(3000);
      store.addMessage(first.id, { role: 'user', content: '안녕' });

      const result = store.list();
      expect(result.map((session) => session.id)).toEqual([first.id, second.id]);
    });
  });

  describe('delete', () => {
    it('세션을 삭제하면 이후 조회 시 SessionNotFoundError를 던진다', () => {
      const session = store.create();

      store.delete(session.id);

      expect(() => store.get(session.id)).toThrow(SessionNotFoundError);
    });

    it('존재하지 않는 세션 id를 삭제하려 하면 SessionNotFoundError를 던진다', () => {
      expect(() => store.delete('없는-id')).toThrow(SessionNotFoundError);
    });
  });
});
