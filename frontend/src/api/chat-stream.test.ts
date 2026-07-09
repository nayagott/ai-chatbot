import { streamMessage } from './chat-stream';

// FR-FE-002: api/chat-stream.ts (SSE 파서)
// docs/IMPLEMENTATION_PLAN.md 참조. fetch의 ReadableStream 응답을 모킹한다.

function createSseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });
}

function mockFetchWithStream(chunks: string[]) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(createSseStream(chunks), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('streamMessage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('세션 id와 content로 스트림 엔드포인트에 POST 요청을 보낸다', async () => {
    const fetchMock = mockFetchWithStream([
      'event: done\ndata: {"message":{"role":"assistant","content":""},"stopReason":"end_turn"}\n\n',
    ]);

    await streamMessage('session-1', '안녕', {});

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/sessions/session-1/messages/stream');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/json' }));
    expect(JSON.parse(init.body as string)).toEqual({ role: 'user', content: '안녕' });
  });

  it('token 이벤트를 순서대로 onToken에 전달한다', async () => {
    mockFetchWithStream([
      'event: token\ndata: {"delta":"안"}\n\n',
      'event: token\ndata: {"delta":"녕"}\n\n',
      'event: done\ndata: {"message":{"role":"assistant","content":"안녕"},"stopReason":"end_turn"}\n\n',
    ]);

    const onToken = vi.fn();
    await streamMessage('session-1', '안녕', { onToken });

    expect(onToken.mock.calls.map((call) => call[0])).toEqual(['안', '녕']);
  });

  it('done 이벤트가 오면 onDone을 message와 stopReason으로 호출한다', async () => {
    mockFetchWithStream([
      'event: done\ndata: {"message":{"role":"assistant","content":"안녕하세요"},"stopReason":"end_turn"}\n\n',
    ]);

    const onDone = vi.fn();
    await streamMessage('session-1', '안녕', { onDone });

    expect(onDone).toHaveBeenCalledWith(
      { role: 'assistant', content: '안녕하세요' },
      'end_turn'
    );
  });

  it('error 이벤트가 오면 onError를 message로 호출한다', async () => {
    mockFetchWithStream(['event: error\ndata: {"message":"ModelTimeoutException"}\n\n']);

    const onError = vi.fn();
    await streamMessage('session-1', '안녕', { onError });

    expect(onError).toHaveBeenCalledWith('ModelTimeoutException');
  });

  it('이벤트가 여러 청크로 쪼개져 도착해도 올바르게 파싱한다', async () => {
    mockFetchWithStream([
      'event: to',
      'ken\ndata: {"delta":"안녕"}',
      '\n\nevent: done\ndata: {"message":{"role":"assistant","content":"안녕"},"stopReason":"end_turn"}\n\n',
    ]);

    const onToken = vi.fn();
    const onDone = vi.fn();
    await streamMessage('session-1', '안녕', { onToken, onDone });

    expect(onToken).toHaveBeenCalledWith('안녕');
    expect(onDone).toHaveBeenCalledWith({ role: 'assistant', content: '안녕' }, 'end_turn');
  });
});
