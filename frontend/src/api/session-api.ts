import type { Session } from '../types';
import { API_BASE_URL } from './base-url';

export async function listSessions(): Promise<Session[]> {
  const response = await fetch(`${API_BASE_URL}/sessions`, { method: 'GET' });
  return response.json();
}

export async function createSession(): Promise<Session> {
  const response = await fetch(`${API_BASE_URL}/sessions`, { method: 'POST' });
  return response.json();
}

export async function getSession(id: string): Promise<Session> {
  const response = await fetch(`${API_BASE_URL}/sessions/${id}`, { method: 'GET' });
  return response.json();
}

export async function deleteSession(id: string): Promise<void> {
  await fetch(`${API_BASE_URL}/sessions/${id}`, { method: 'DELETE' });
}
