import cors from 'cors';
import express, { Express } from 'express';
import { createSessionRouter } from './routes/session-router';
import { SessionStore } from './services/session-store';

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  const sessionStore = new SessionStore();
  app.use('/sessions', createSessionRouter(sessionStore));
  return app;
}
