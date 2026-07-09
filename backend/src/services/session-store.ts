import { randomUUID } from 'crypto';
import { Session, SessionNotFoundError } from '../types';

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

  get(id: string): Session {
    const session = this.sessions.get(id);
    if (!session) {
      throw new SessionNotFoundError(`Session not found: ${id}`);
    }
    return session;
  }
}
