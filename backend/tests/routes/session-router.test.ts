import request from 'supertest';
import { mockClient } from 'aws-sdk-client-mock';
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  ConverseStreamOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { createApp } from '../../src/app';

// FR-BE-005: POST /sessions/:id/messages/stream — SSE 스트리밍 채팅
// docs/IMPLEMENTATION_PLAN.md 참조. Bedrock 호출은 aws-sdk-client-mock으로 모킹한다.

const bedrockMock = mockClient(BedrockRuntimeClient);

function createStreamAsyncIterable(events: unknown[]): AsyncIterable<ConverseStreamOutput> {
  return {
    [Symbol.asyncIterator]() {
      let index = 0;
      return {
        next: async () => {
          if (index < events.length) {
            return { value: events[index++] as ConverseStreamOutput, done: false };
          }
          return { value: undefined as unknown as ConverseStreamOutput, done: true };
        },
      };
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

describe('POST /sessions (FR-BE-001)', () => {
  it('새 세션을 생성하고 201로 응답한다', async () => {
    const app = createApp();

    const res = await request(app).post('/sessions');

    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('string');
    expect(res.body.messages).toEqual([]);
    expect(typeof res.body.createdAt).toBe('number');
    expect(typeof res.body.updatedAt).toBe('number');
  });
});

describe('GET /sessions/:id (FR-BE-002)', () => {
  it('존재하는 세션을 200으로 반환한다', async () => {
    const app = createApp();
    const created = await request(app).post('/sessions');

    const res = await request(app).get(`/sessions/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it('존재하지 않는 세션은 404와 한국어 에러 메시지를 반환한다', async () => {
    const app = createApp();

    const res = await request(app).get('/sessions/없는-id');

    expect(res.status).toBe(404);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error).toMatch(/[가-힣]/);
  });
});

describe('DELETE /sessions/:id (FR-BE-003)', () => {
  it('세션을 삭제하고 204를 반환한다', async () => {
    const app = createApp();
    const created = await request(app).post('/sessions');

    const res = await request(app).delete(`/sessions/${created.body.id}`);

    expect(res.status).toBe(204);
    const getRes = await request(app).get(`/sessions/${created.body.id}`);
    expect(getRes.status).toBe(404);
  });

  it('존재하지 않는 세션을 삭제하면 404와 한국어 에러 메시지를 반환한다', async () => {
    const app = createApp();

    const res = await request(app).delete('/sessions/없는-id');

    expect(res.status).toBe(404);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error).toMatch(/[가-힣]/);
  });
});

describe('POST /sessions/:id/messages/stream (FR-BE-005)', () => {
  beforeEach(() => {
    bedrockMock.reset();
  });

  async function createSession() {
    const app = createApp();
    const res = await request(app).post('/sessions');
    return { app, sessionId: res.body.id as string };
  }

  it('1. 유효한 메시지를 보내면 200과 text/event-stream 헤더로 응답한다', async () => {
    const { app, sessionId } = await createSession();
    bedrockMock.on(ConverseStreamCommand).resolves({
      stream: createStreamAsyncIterable([{ messageStop: { stopReason: 'end_turn' } }]),
    });

    const res = await request(app)
      .post(`/sessions/${sessionId}/messages/stream`)
      .send({ role: 'user', content: '안녕' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
  });

  it('2. 스트리밍 청크가 SSE 형식(event: token, data: {...})으로 순서대로 전달된다', async () => {
    const { app, sessionId } = await createSession();
    bedrockMock.on(ConverseStreamCommand).resolves({
      stream: createStreamAsyncIterable([
        { contentBlockDelta: { delta: { text: '안' } } },
        { contentBlockDelta: { delta: { text: '녕' } } },
        { messageStop: { stopReason: 'end_turn' } },
      ]),
    });

    const res = await request(app)
      .post(`/sessions/${sessionId}/messages/stream`)
      .send({ role: 'user', content: '안녕' });

    const tokenEvents = parseSseEvents(res.text).filter((event) => event.event === 'token');
    expect(tokenEvents.map((event) => (event.data as { delta: string }).delta)).toEqual([
      '안',
      '녕',
    ]);
  });

  it('3. 빈 메시지를 보내면 400과 한국어 에러 메시지를 반환한다', async () => {
    const { app, sessionId } = await createSession();

    const res = await request(app)
      .post(`/sessions/${sessionId}/messages/stream`)
      .send({ role: 'user', content: '' });

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error).toMatch(/[가-힣]/);
  });

  it('4. Bedrock 초기 요청이 실패하면 500과 한국어 에러 메시지를 반환하고, 내부 로그는 영어로 남긴다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { app, sessionId } = await createSession();
    bedrockMock.on(ConverseStreamCommand).rejects(new Error('ThrottlingException'));

    const res = await request(app)
      .post(`/sessions/${sessionId}/messages/stream`)
      .send({ role: 'user', content: '안녕' });

    expect(res.status).toBe(500);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error).toMatch(/[가-힣]/);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const loggedText = consoleErrorSpy.mock.calls.map((call) => call.join(' ')).join(' ');
    expect(loggedText).toMatch(/[A-Za-z]/);
    expect(loggedText).not.toMatch(/[가-힣]/);

    consoleErrorSpy.mockRestore();
  });

  it('5. 스트림 종료 시 event: done과 최종 메시지를 전송한다', async () => {
    const { app, sessionId } = await createSession();
    bedrockMock.on(ConverseStreamCommand).resolves({
      stream: createStreamAsyncIterable([
        { contentBlockDelta: { delta: { text: '안녕하세요' } } },
        { messageStop: { stopReason: 'end_turn' } },
      ]),
    });

    const res = await request(app)
      .post(`/sessions/${sessionId}/messages/stream`)
      .send({ role: 'user', content: '안녕' });

    const doneEvent = parseSseEvents(res.text).find((event) => event.event === 'done');
    expect(doneEvent?.data).toEqual({
      message: { role: 'assistant', content: '안녕하세요' },
      stopReason: 'end_turn',
    });
  });
});
