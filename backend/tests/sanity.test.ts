import request from 'supertest';
import express from 'express';

describe('test environment sanity check', () => {
  it('supertest로 express 앱에 요청을 보내고 응답을 검증할 수 있다', async () => {
    const app = express();
    app.get('/ping', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    const res = await request(app).get('/ping');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
