import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';

describe('session router', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  describe('POST /sessions', () => {
    it('새 세션을 생성하고 201로 응답한다', async () => {
      const res = await request(app).post('/sessions');

      expect(res.status).toBe(201);
      expect(typeof res.body.id).toBe('string');
      expect(res.body.messages).toEqual([]);
      expect(typeof res.body.createdAt).toBe('number');
      expect(typeof res.body.updatedAt).toBe('number');
    });
  });

  describe('GET /sessions/:id', () => {
    it('존재하는 세션을 200으로 반환한다', async () => {
      const created = await request(app).post('/sessions');

      const res = await request(app).get(`/sessions/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
    });

    it('존재하지 않는 세션은 404와 한국어 에러 메시지를 반환한다', async () => {
      const res = await request(app).get('/sessions/없는-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('세션을 찾을 수 없습니다.');
    });
  });

  describe('POST /sessions/:id/messages', () => {
    it('메시지를 추가하고 갱신된 세션을 반환한다', async () => {
      const created = await request(app).post('/sessions');

      const res = await request(app)
        .post(`/sessions/${created.body.id}/messages`)
        .send({ role: 'user', content: '안녕' });

      expect(res.status).toBe(200);
      expect(res.body.messages).toEqual([{ role: 'user', content: '안녕' }]);
    });

    it('content가 없으면 400을 반환한다', async () => {
      const created = await request(app).post('/sessions');

      const res = await request(app)
        .post(`/sessions/${created.body.id}/messages`)
        .send({ role: 'user' });

      expect(res.status).toBe(400);
    });

    it('존재하지 않는 세션에 메시지를 추가하면 404를 반환한다', async () => {
      const res = await request(app)
        .post('/sessions/없는-id/messages')
        .send({ role: 'user', content: '안녕' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /sessions/:id', () => {
    it('세션을 삭제하고 204를 반환한다', async () => {
      const created = await request(app).post('/sessions');

      const deleteRes = await request(app).delete(`/sessions/${created.body.id}`);
      expect(deleteRes.status).toBe(204);

      const getRes = await request(app).get(`/sessions/${created.body.id}`);
      expect(getRes.status).toBe(404);
    });

    it('존재하지 않는 세션 삭제 시 404를 반환한다', async () => {
      const res = await request(app).delete('/sessions/없는-id');

      expect(res.status).toBe(404);
    });
  });
});
