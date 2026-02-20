import { NextResponse } from 'next/server';
import { ApiError } from './errors';

export function json(data: unknown, init?: number | ResponseInit) {
  const responseInit: ResponseInit = typeof init === 'number' ? { status: init } : (init ?? {});
  return NextResponse.json(data, responseInit);
}

export function jsonError(message: string, status = 400) {
  return json({ error: message }, status);
}

export async function parseBody<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, 'Invalid JSON body');
  }
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, `Missing or invalid field: ${field}`);
  }
  return value.trim();
}

export function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ApiError(400, `Missing or invalid field: ${field}`);
  }
  return value;
}

export function getSearchParam(req: Request, key: string): string | null {
  const url = new URL(req.url);
  return url.searchParams.get(key);
}
