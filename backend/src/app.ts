import express, { Express, NextFunction, Request, Response } from 'express';
import { createSessionRouter } from './routes/session-router';
import { SessionStore } from './services/session-store';
import { AppError } from './types';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  const sessionStore = new SessionStore();
  app.use('/sessions', createSessionRouter(sessionStore));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.userMessage });
      return;
    }
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  });

  return app;
}
