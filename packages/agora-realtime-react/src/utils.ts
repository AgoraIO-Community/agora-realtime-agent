import type { UIMessage } from './types.js';

export function textMessage(role: 'assistant' | 'user', text: string): UIMessage {
  return {
    id: `${role}_${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`,
    role,
    parts: [{ type: 'text', text }],
  } as UIMessage;
}

export function errorFrom(caught: unknown, fallback: string): Error {
  return caught instanceof Error ? caught : new Error(fallback);
}

export async function errorFromResponse(response: Response, fallback: string): Promise<Error> {
  const details = await response.json().catch(() => undefined) as unknown;
  const error = details && typeof details === 'object' && 'error' in details
    ? (details as { error?: unknown }).error
    : undefined;
  const message = error && typeof error === 'object' && 'message' in error
    ? (error as { message?: unknown }).message
    : undefined;
  return new Error(typeof message === 'string' && message.trim() ? `${fallback}: ${message}` : fallback);
}

export function withDefined<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T;
}
