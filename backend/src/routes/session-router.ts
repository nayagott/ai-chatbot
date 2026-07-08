import { Router } from 'express';
import { SessionStore } from '../services/session-store';
import { ChatMessage, MessageRole, ValidationError } from '../types';

function isValidRole(role: unknown): role is MessageRole {
  return role === 'user' || role === 'assistant';
}

export function createSessionRouter(store: SessionStore): Router {
  const router = Router();

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
