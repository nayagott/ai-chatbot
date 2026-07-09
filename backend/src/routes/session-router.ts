import { randomUUID } from 'crypto';
import { Router } from 'express';
import { ConversationRole } from '@aws-sdk/client-bedrock-runtime';
import { BedrockService } from '../services/bedrock-service';
import { AppError, ValidationError } from '../types';

interface StreamRequestBody {
  role?: string;
  content?: string;
}

const bedrockService = new BedrockService();

export function createSessionRouter(): Router {
  const router = Router();

  router.post('/', (_req, res) => {
    res.status(201).json({ id: randomUUID() });
  });

  router.post('/:id/messages/stream', async (req, res) => {
    try {
      const { role, content } = req.body as StreamRequestBody;

      if (typeof content !== 'string' || content.length === 0) {
        throw new ValidationError('content is required', '메시지 내용을 입력해주세요.');
      }

      const events = await bedrockService.converseStream(
        content,
        role === 'assistant' ? ConversationRole.ASSISTANT : ConversationRole.USER
      );

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      let assistantText = '';
      let stopReason = '';

      for await (const event of events) {
        if (event.type === 'contentBlockDelta') {
          const delta = event.delta ?? '';
          assistantText += delta;
          res.write(`event: token\ndata: ${JSON.stringify({ delta })}\n\n`);
        } else if (event.type === 'messageStop') {
          stopReason = event.stopReason ?? '';
        }
      }

      res.write(
        `event: done\ndata: ${JSON.stringify({
          message: { role: 'assistant', content: assistantText },
          stopReason,
        })}\n\n`
      );
      res.end();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.userMessage });
        return;
      }
      console.error('Unexpected error:', error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  });

  return router;
}
