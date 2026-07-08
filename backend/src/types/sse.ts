export type SseEventName = 'token' | 'done' | 'error';

export interface SseEvent<T = unknown> {
  event: SseEventName;
  data: T;
}
