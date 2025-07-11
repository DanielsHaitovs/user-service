/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

export const traceStorage = new AsyncLocalStorage<Map<string, any>>();

export function startTraceId(userId?: string): Map<string, any> {
  const store = new Map<string, any>();
  store.set('traceId', randomUUID());
  if (userId) store.set('userId', userId);
  store.set('errorTrace', []);
  store.set('requestTag', 'global');
  return store;
}

export function getTraceId(): string | undefined {
  return traceStorage.getStore()?.get('traceId');
}

export function setRequestTrace(trace: string): void {
  traceStorage.getStore()?.set('requestTrace', trace);
}
