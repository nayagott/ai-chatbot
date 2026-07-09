import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, Session, SessionNotFoundError } from '../types';

export class SessionStore {
  private readonly sessions = new Map<string, Session>();

  create(): Session {
    const now = Date.now();
    const session: Session = { id: uuidv4(), messages: [], createdAt: now, updatedAt: now };
    this.sessions.set(session.id, session);
    return session;
  }

  list(): Session[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  get(id: string): Session {
    const session = this.sessions.get(id);
    if (!session) {
      throw new SessionNotFoundError(`Session not found: ${id}`);
    }
    return session;
  }

  addMessage(id: string, message: ChatMessage): void {
    const session = this.get(id);
    session.messages.push(message);
    session.updatedAt = Date.now();
  }

  delete(id: string): void {
    if (!this.sessions.delete(id)) {
      throw new SessionNotFoundError(`Session not found: ${id}`);
    }
  }
}
