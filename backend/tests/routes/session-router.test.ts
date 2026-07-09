import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';
import { BedrockStreamEvent } from '../../src/types';

function fakeBedrockService(events: BedrockStreamEvent[]) {
  return {
    converseStream: async function* (): AsyncGenerator<BedrockStreamEvent> {
      for (const event of events) {
        yield event;
      }
    },
  };
}

function fakeFailingBedrockService(message: string) {
  return {
    converseStream: async function* (): AsyncGenerator<BedrockStreamEvent> {
      throw new Error(message);
    },
  };
}

function parseSseEvents(text: string): Array<{ event: string; data: unknown }> {
  return text
    .trim()
    .split('\n\n')
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n');
      const eventLine = lines.find((line) => line.startsWith('event: '));
      const dataLine = lines.find((line) => line.startsWith('data: '));
      return {
        event: eventLine?.replace('event: ', '') ?? '',
        data: dataLine ? JSON.parse(dataLine.replace('data: ', '')) : undefined,
      };
    });
}

describe('session router', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  describe('GET /sessions', () => {
    it('세션이 없으면 빈 배열을 반환한다', async () => {
      const res = await request(app).get('/sessions');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('생성된 세션 목록을 반환한다', async () => {
      const first = await request(app).post('/sessions');
      const second = await request(app).post('/sessions');

      const res = await request(app).get('/sessions');

      expect(res.status).toBe(200);
      expect(res.body.map((session: { id: string }) => session.id)).toEqual(
        expect.arrayContaining([first.body.id, second.body.id])
      );
    });
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

  describe('POST /sessions/:id/messages/stream', () => {
    it('text/event-stream으로 응답한다', async () => {
      const streamApp = createApp({
        bedrockService: fakeBedrockService([{ type: 'messageStop', stopReason: 'end_turn' }]),
      });
      const created = await request(streamApp).post('/sessions');

      const res = await request(streamApp)
        .post(`/sessions/${created.body.id}/messages/stream`)
        .send({ role: 'user', content: '안녕' });

      expect(res.headers['content-type']).toContain('text/event-stream');
    });

    it('델타를 event: token으로 순서대로 전송한다', async () => {
      const streamApp = createApp({
        bedrockService: fakeBedrockService([
          { type: 'contentBlockDelta', delta: '안' },
          { type: 'contentBlockDelta', delta: '녕' },
          { type: 'messageStop', stopReason: 'end_turn' },
        ]),
      });
      const created = await request(streamApp).post('/sessions');

      const res = await request(streamApp)
        .post(`/sessions/${created.body.id}/messages/stream`)
        .send({ role: 'user', content: '안녕' });

      const tokenEvents = parseSseEvents(res.text).filter((event) => event.event === 'token');
      expect(tokenEvents.map((event) => (event.data as { delta: string }).delta)).toEqual([
        '안',
        '녕',
      ]);
    });

    it('종료 시 event: done과 최종 메시지를 전송한다', async () => {
      const streamApp = createApp({
        bedrockService: fakeBedrockService([
          { type: 'contentBlockDelta', delta: '안녕' },
          { type: 'messageStop', stopReason: 'end_turn' },
        ]),
      });
      const created = await request(streamApp).post('/sessions');

      const res = await request(streamApp)
        .post(`/sessions/${created.body.id}/messages/stream`)
        .send({ role: 'user', content: '안녕' });

      const doneEvent = parseSseEvents(res.text).find((event) => event.event === 'done');
      expect(doneEvent?.data).toEqual({
        message: { role: 'assistant', content: '안녕' },
        stopReason: 'end_turn',
      });
    });

    it('스트림 완료 후 세션에 assistant 메시지가 저장된다', async () => {
      const streamApp = createApp({
        bedrockService: fakeBedrockService([
          { type: 'contentBlockDelta', delta: '안녕하세요' },
          { type: 'messageStop', stopReason: 'end_turn' },
        ]),
      });
      const created = await request(streamApp).post('/sessions');

      await request(streamApp)
        .post(`/sessions/${created.body.id}/messages/stream`)
        .send({ role: 'user', content: '안녕' });

      const getRes = await request(streamApp).get(`/sessions/${created.body.id}`);
      expect(getRes.body.messages).toEqual([
        { role: 'user', content: '안녕' },
        { role: 'assistant', content: '안녕하세요' },
      ]);
    });

    it('content가 없으면 400을 반환한다', async () => {
      const streamApp = createApp({ bedrockService: fakeBedrockService([]) });
      const created = await request(streamApp).post('/sessions');

      const res = await request(streamApp)
        .post(`/sessions/${created.body.id}/messages/stream`)
        .send({ role: 'user' });

      expect(res.status).toBe(400);
    });

    it('존재하지 않는 세션이면 404를 반환한다', async () => {
      const streamApp = createApp({ bedrockService: fakeBedrockService([]) });

      const res = await request(streamApp)
        .post('/sessions/없는-id/messages/stream')
        .send({ role: 'user', content: '안녕' });

      expect(res.status).toBe(404);
    });

    it('Bedrock 스트림 에러 시 event: error를 전송한다', async () => {
      const streamApp = createApp({
        bedrockService: fakeFailingBedrockService('ModelTimeoutException'),
      });
      const created = await request(streamApp).post('/sessions');

      const res = await request(streamApp)
        .post(`/sessions/${created.body.id}/messages/stream`)
        .send({ role: 'user', content: '안녕' });

      const events = parseSseEvents(res.text);
      expect(events.some((event) => event.event === 'error')).toBe(true);
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
