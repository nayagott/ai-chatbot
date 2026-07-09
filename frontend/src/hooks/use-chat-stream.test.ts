import { act, renderHook } from '@testing-library/react';
import { useChatStream } from './use-chat-stream';
import * as chatStreamApi from '../api/chat-stream';
import type { StreamMessageHandlers } from '../api/chat-stream';

// FR-FE-004: useChatStream (전송/스트리밍 상태)
// docs/IMPLEMENTATION_PLAN.md 참조. chat-stream은 vi.mock으로 모킹한다.

vi.mock('../api/chat-stream');

describe('useChatStream', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('전송 시 사용자 메시지를 낙관적으로 즉시 추가한다', () => {
    vi.mocked(chatStreamApi.streamMessage).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useChatStream());

    act(() => {
      result.current.sendMessage('session-1', '안녕');
    });

    expect(result.current.messages).toEqual([{ role: 'user', content: '안녕' }]);
    expect(result.current.isStreaming).toBe(true);
  });

  it('토큰 수신마다 streamingText가 누적된다', () => {
    let handlers: StreamMessageHandlers = {};
    vi.mocked(chatStreamApi.streamMessage).mockImplementation((_sessionId, _content, h) => {
      handlers = h;
      return new Promise(() => {});
    });

    const { result } = renderHook(() => useChatStream());

    act(() => {
      result.current.sendMessage('session-1', '안녕');
    });

    act(() => {
      handlers.onToken?.('안');
    });
    act(() => {
      handlers.onToken?.('녕');
    });

    expect(result.current.streamingText).toBe('안녕');
  });

  it('완료 시 assistant 메시지가 추가되고 isStreaming이 false로 복귀한다', () => {
    let handlers: StreamMessageHandlers = {};
    vi.mocked(chatStreamApi.streamMessage).mockImplementation((_sessionId, _content, h) => {
      handlers = h;
      return new Promise(() => {});
    });

    const { result } = renderHook(() => useChatStream());

    act(() => {
      result.current.sendMessage('session-1', '안녕');
    });

    act(() => {
      handlers.onDone?.({ role: 'assistant', content: '안녕하세요' }, 'end_turn');
    });

    expect(result.current.messages).toEqual([
      { role: 'user', content: '안녕' },
      { role: 'assistant', content: '안녕하세요' },
    ]);
    expect(result.current.isStreaming).toBe(false);
  });

  it('에러 발생 시 isStreaming이 정리된다', () => {
    let handlers: StreamMessageHandlers = {};
    vi.mocked(chatStreamApi.streamMessage).mockImplementation((_sessionId, _content, h) => {
      handlers = h;
      return new Promise(() => {});
    });

    const { result } = renderHook(() => useChatStream());

    act(() => {
      result.current.sendMessage('session-1', '안녕');
    });

    act(() => {
      handlers.onError?.('ModelTimeoutException');
    });

    expect(result.current.isStreaming).toBe(false);
  });
});
