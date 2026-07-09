import {
  BedrockRuntimeClient,
  ConversationRole,
  ConverseStreamCommand,
  ConverseStreamOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockApiError, BedrockStreamEvent } from '../types';

const MODEL_ID = 'global.anthropic.claude-sonnet-4-6';

export class BedrockService {
  private readonly client: BedrockRuntimeClient;

  constructor(client: BedrockRuntimeClient = new BedrockRuntimeClient({ region: 'us-east-1' })) {
    this.client = client;
  }

  async converseStream(
    content: string,
    role: ConversationRole = ConversationRole.USER
  ): Promise<AsyncIterable<BedrockStreamEvent>> {
    let stream: AsyncIterable<ConverseStreamOutput> | undefined;
    try {
      const response = await this.client.send(
        new ConverseStreamCommand({
          modelId: MODEL_ID,
          messages: [{ role, content: [{ text: content }] }],
        })
      );
      stream = response.stream;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Bedrock ConverseStream request failed:', message);
      throw new BedrockApiError(message);
    }

    return this.mapEvents(stream);
  }

  private async *mapEvents(
    stream: AsyncIterable<ConverseStreamOutput> | undefined
  ): AsyncGenerator<BedrockStreamEvent> {
    if (!stream) return;

    for await (const chunk of stream) {
      if (chunk.contentBlockDelta) {
        yield { type: 'contentBlockDelta', delta: chunk.contentBlockDelta.delta?.text ?? '' };
      } else if (chunk.messageStop) {
        yield { type: 'messageStop', stopReason: chunk.messageStop.stopReason };
      }
    }
  }
}
