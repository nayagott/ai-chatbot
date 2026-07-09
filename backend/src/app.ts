import express, { Express } from 'express';
import { createSessionRouter } from './routes/session-router';

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/sessions', createSessionRouter());
  return app;
}
