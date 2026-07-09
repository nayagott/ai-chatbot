import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import { createSessionRouter } from './routes/session-router';
import { SessionStore } from './services/session-store';
import { BedrockService } from './services/bedrock-service';
import { AppError } from './types';

interface CreateAppDeps {
  sessionStore?: SessionStore;
  bedrockService?: Pick<BedrockService, 'converseStream'>;
}

export function createApp(deps: CreateAppDeps = {}): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const sessionStore = deps.sessionStore ?? new SessionStore();
  const bedrockService = deps.bedrockService ?? new BedrockService();
  app.use('/sessions', createSessionRouter(sessionStore, bedrockService));

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
