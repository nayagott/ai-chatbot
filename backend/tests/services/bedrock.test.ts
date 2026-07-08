import { mockClient } from 'aws-sdk-client-mock';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
  ConverseStreamOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockService } from '../../src/services/bedrock-service';
import { BedrockApiError } from '../../src/types';

const bedrockMock = mockClient(BedrockRuntimeClient);
const modelId = 'global.anthropic.claude-sonnet-4-6';

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

describe('BedrockService', () => {
  beforeEach(() => {
    bedrockMock.reset();
  });

  describe('생성자', () => {
    it('설정 없이 생성하면 기본값(us-east-1, Sonnet 4.6)으로 초기화되어야 한다', () => {
      const service = new BedrockService();

      expect(service.region).toBe('us-east-1');
      expect(service.modelId).toBe('global.anthropic.claude-sonnet-4-6');
    });

    it('리전을 지정하면 해당 리전으로 클라이언트가 생성되어야 한다', () => {
      const service = new BedrockService({ region: 'ap-northeast-2' });

      expect(service.region).toBe('ap-northeast-2');
    });

    it('모델 ID를 지정하면 해당 모델을 사용해야 한다', () => {
      const service = new BedrockService({ modelId: 'global.anthropic.claude-haiku-4-5-20251001-v1:0' });

      expect(service.modelId).toBe('global.anthropic.claude-haiku-4-5-20251001-v1:0');
    });
  });

  describe('converse', () => {
    let service: BedrockService;

    beforeEach(() => {
      service = new BedrockService({ modelId });
    });

    it('사용자 메시지를 Bedrock Converse API 형식으로 변환해서 요청한다', async () => {
      bedrockMock.on(ConverseCommand).resolves({
        output: {
          message: { role: 'assistant', content: [{ text: '안녕하세요!' }] },
        },
        stopReason: 'end_turn',
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      });

      await service.converse([{ role: 'user', content: '안녕' }]);

      const calls = bedrockMock.commandCalls(ConverseCommand);
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0].input).toEqual(
        expect.objectContaining({
          modelId,
          messages: [{ role: 'user', content: [{ text: '안녕' }] }],
        })
      );
    });

    it('시스템 프롬프트가 주어지면 system 필드를 포함해서 요청한다', async () => {
      bedrockMock.on(ConverseCommand).resolves({
        output: { message: { role: 'assistant', content: [{ text: 'ok' }] } },
        stopReason: 'end_turn',
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      });

      await service.converse([{ role: 'user', content: '안녕' }], '너는 친절한 챗봇이야');

      const [call] = bedrockMock.commandCalls(ConverseCommand);
      expect(call.args[0].input.system).toEqual([{ text: '너는 친절한 챗봇이야' }]);
    });

    it('Bedrock 응답을 BedrockConverseResponse 형태로 변환해서 반환한다', async () => {
      bedrockMock.on(ConverseCommand).resolves({
        output: { message: { role: 'assistant', content: [{ text: '반갑습니다.' }] } },
        stopReason: 'end_turn',
        usage: { inputTokens: 12, outputTokens: 8, totalTokens: 20 },
      });

      const result = await service.converse([{ role: 'user', content: '안녕' }]);

      expect(result).toEqual({
        message: { role: 'assistant', content: '반갑습니다.' },
        stopReason: 'end_turn',
        usage: { inputTokens: 12, outputTokens: 8 },
      });
    });

    it('Bedrock 호출이 실패하면 BedrockApiError로 감싸서 던진다', async () => {
      bedrockMock.on(ConverseCommand).rejects(new Error('ThrottlingException'));

      await expect(service.converse([{ role: 'user', content: '안녕' }])).rejects.toThrow(
        BedrockApiError
      );
    });
  });

  describe('converseStream', () => {
    let service: BedrockService;

    beforeEach(() => {
      service = new BedrockService({ modelId });
    });

    it('사용자 메시지를 Bedrock ConverseStream API 형식으로 변환해서 요청한다', async () => {
      bedrockMock.on(ConverseStreamCommand).resolves({
        stream: createStreamAsyncIterable([{ messageStop: { stopReason: 'end_turn' } }]),
      });

      for await (const _event of service.converseStream([{ role: 'user', content: '안녕' }])) {
        // 요청 형식 검증이 목적이므로 이벤트 내용은 여기서 확인하지 않는다
      }

      const calls = bedrockMock.commandCalls(ConverseStreamCommand);
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0].input).toEqual(
        expect.objectContaining({
          modelId,
          messages: [{ role: 'user', content: [{ text: '안녕' }] }],
        })
      );
    });

    it('스트림 이벤트를 BedrockStreamEvent로 변환하며 순서대로 yield한다', async () => {
      bedrockMock.on(ConverseStreamCommand).resolves({
        stream: createStreamAsyncIterable([
          { messageStart: { role: 'assistant' } },
          { contentBlockDelta: { delta: { text: '안' } } },
          { contentBlockDelta: { delta: { text: '녕' } } },
          { messageStop: { stopReason: 'end_turn' } },
          { metadata: { usage: { inputTokens: 3, outputTokens: 2, totalTokens: 5 } } },
        ]),
      });

      const events = [];
      for await (const event of service.converseStream([{ role: 'user', content: '안녕' }])) {
        events.push(event);
      }

      expect(events).toEqual([
        { type: 'messageStart' },
        { type: 'contentBlockDelta', delta: '안' },
        { type: 'contentBlockDelta', delta: '녕' },
        { type: 'messageStop', stopReason: 'end_turn' },
        { type: 'metadata' },
      ]);
    });

    it('스트림 요청 자체가 실패하면 BedrockApiError를 던진다', async () => {
      bedrockMock.on(ConverseStreamCommand).rejects(new Error('ModelTimeoutException'));

      const iterate = async () => {
        for await (const _event of service.converseStream([{ role: 'user', content: '안녕' }])) {
          // no-op
        }
      };

      await expect(iterate()).rejects.toThrow(BedrockApiError);
    });
  });
});
