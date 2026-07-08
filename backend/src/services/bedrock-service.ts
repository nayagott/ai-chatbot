import dotenv from 'dotenv';
import { BedrockRuntimeClient, ConverseCommand, ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import { ChatMessage, BedrockConverseResponse, BedrockStreamEvent, BedrockApiError } from '../types';

dotenv.config();

const DEFAULT_REGION = process.env.AWS_REGION ?? 'us-east-1';
const DEFAULT_MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'global.anthropic.claude-sonnet-4-6';

interface BedrockServiceConfig {
  client?: BedrockRuntimeClient;
  modelId?: string;
  region?: string;
}

function toBedrockMessages(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: [{ text: message.content }],
  }));
}

export class BedrockService {
  private readonly client: BedrockRuntimeClient;
  public readonly modelId: string;
  public readonly region: string;

  constructor(config: BedrockServiceConfig = {}) {
    this.region = config.region ?? DEFAULT_REGION;
    this.client = config.client ?? new BedrockRuntimeClient({ region: this.region });
    this.modelId = config.modelId ?? DEFAULT_MODEL_ID;
  }

  async converse(messages: ChatMessage[], systemPrompt?: string): Promise<BedrockConverseResponse> {
    try {
      const response = await this.client.send(
        new ConverseCommand({
          modelId: this.modelId,
          messages: toBedrockMessages(messages),
          ...(systemPrompt ? { system: [{ text: systemPrompt }] } : {}),
        })
      );

      const content = response.output?.message?.content?.[0];
      const text = content && 'text' in content ? content.text ?? '' : '';

      return {
        message: { role: 'assistant', content: text },
        stopReason: response.stopReason ?? '',
        usage: {
          inputTokens: response.usage?.inputTokens ?? 0,
          outputTokens: response.usage?.outputTokens ?? 0,
        },
      };
    } catch (error) {
      throw new BedrockApiError(error instanceof Error ? error.message : String(error));
    }
  }

  async *converseStream(
    messages: ChatMessage[],
    systemPrompt?: string
  ): AsyncGenerator<BedrockStreamEvent> {
    let response;
    try {
      response = await this.client.send(
        new ConverseStreamCommand({
          modelId: this.modelId,
          messages: toBedrockMessages(messages),
          ...(systemPrompt ? { system: [{ text: systemPrompt }] } : {}),
        })
      );
    } catch (error) {
      throw new BedrockApiError(error instanceof Error ? error.message : String(error));
    }

    if (!response.stream) {
      return;
    }

    for await (const chunk of response.stream) {
      if (chunk.messageStart) {
        yield { type: 'messageStart' };
      } else if (chunk.contentBlockDelta) {
        yield { type: 'contentBlockDelta', delta: chunk.contentBlockDelta.delta?.text ?? '' };
      } else if (chunk.contentBlockStop) {
        yield { type: 'contentBlockStop' };
      } else if (chunk.messageStop) {
        yield { type: 'messageStop', stopReason: chunk.messageStop.stopReason };
      } else if (chunk.metadata) {
        yield { type: 'metadata' };
      }
    }
  }
}
