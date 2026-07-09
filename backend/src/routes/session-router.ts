import { Router } from 'express';
import { SessionStore } from '../services/session-store';
import { BedrockService } from '../services/bedrock-service';
import { ChatMessage, MessageRole, ValidationError } from '../types';

function isValidRole(role: unknown): role is MessageRole {
  return role === 'user' || role === 'assistant';
}

type StreamingChatService = Pick<BedrockService, 'converseStream'>;

export function createSessionRouter(
  store: SessionStore,
  bedrockService: StreamingChatService
): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.status(200).json(store.list());
  });

  router.post('/', (_req, res) => {
    const session = store.create();
    res.status(201).json(session);
  });

  router.get('/:id', (req, res, next) => {
    try {
      const session = store.get(req.params.id);
      res.status(200).json(session);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/messages', (req, res, next) => {
    try {
      const { role, content } = req.body as Partial<ChatMessage>;
      if (typeof content !== 'string' || content.length === 0 || !isValidRole(role)) {
        throw new ValidationError('Invalid message payload: role and content are required');
      }

      store.addMessage(req.params.id, { role, content });
      const session = store.get(req.params.id);
      res.status(200).json(session);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/messages/stream', async (req, res, next) => {
    try {
      const { role, content } = req.body as Partial<ChatMessage>;
      if (typeof content !== 'string' || content.length === 0 || !isValidRole(role)) {
        throw new ValidationError('Invalid message payload: role and content are required');
      }

      const session = store.get(req.params.id);
      store.addMessage(session.id, { role, content });

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      let assistantText = '';
      let stopReason = '';
      try {
        for await (const event of bedrockService.converseStream(session.messages)) {
          if (event.type === 'contentBlockDelta') {
            assistantText += event.delta ?? '';
            res.write(`event: token\ndata: ${JSON.stringify({ delta: event.delta ?? '' })}\n\n`);
          } else if (event.type === 'messageStop') {
            stopReason = event.stopReason ?? '';
          }
        }

        const assistantMessage: ChatMessage = { role: 'assistant', content: assistantText };
        store.addMessage(session.id, assistantMessage);
        res.write(
          `event: done\ndata: ${JSON.stringify({ message: assistantMessage, stopReason })}\n\n`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
      }

      res.end();
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', (req, res, next) => {
    try {
      store.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
