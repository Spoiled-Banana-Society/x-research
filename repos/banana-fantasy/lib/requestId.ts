import crypto from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

/** Generate a new short UUID-ish request ID (12 hex chars). */
export function newRequestId(): string {
  return crypto.randomBytes(6).toString('hex');
}

/**
 * Pulls the request ID off an incoming Request header, generating a fresh one
 * if missing. Safe for use in API routes.
 */
export function getRequestId(req: Request): string {
  const incoming = req.headers.get(REQUEST_ID_HEADER);
  if (incoming && /^[a-zA-Z0-9_-]{4,64}$/.test(incoming)) return incoming;
  return newRequestId();
}
