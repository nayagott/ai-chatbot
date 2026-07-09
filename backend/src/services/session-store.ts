import { randomUUID } from 'crypto';
import { Session } from '../types';

export class SessionStore {
  private readonly sessions = new Map<string, Session>();

  create(): Session {
    const now = Date.now();
    const session: Session = {
      id: randomUUID(),
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);
    return session;
  }
}
