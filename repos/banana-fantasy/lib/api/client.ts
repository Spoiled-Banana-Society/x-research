/**
 * Base HTTP client for SBS Drafts API.
 *
 * Uses `fetch` (works in Next.js server + browser) and provides:
 * - JSON request/response handling
 * - consistent error objects (`ApiError`)
 * - optional auth header injection
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiErrorDetails {
  /** Raw response body (already parsed as JSON when possible). */
  body?: unknown;
  /** HTTP status code (if a response was received). */
  status?: number;
  /** Request URL. */
  url?: string;
  /** Optional backend error code. */
  code?: string;
}

/**
 * A typed API error that preserves HTTP status and any response payload.
 */
export class ApiError extends Error {
  public readonly status?: number;
  public readonly url?: string;
  public readonly body?: unknown;
  public readonly code?: string;

  constructor(message: string, details: ApiErrorDetails = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = details.status;
    this.url = details.url;
    this.body = details.body;
    this.code = details.code;
  }
}

export interface ApiResult<T> {
  data: T | null;
  error: ApiError | null;
}

export interface HttpClientConfig {
  /** Base URL, e.g. https://sbs-drafts-api-... */
  baseUrl: string;
  /** Default headers applied to every request. */
  defaultHeaders?: HeadersInit;
  /**
   * Optional auth token supplier.
   * If provided and returns a token, `Authorization: Bearer <token>` will be sent.
   */
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
}

export interface RequestOptions {
  method?: HttpMethod;
  headers?: HeadersInit;
  /** JSON body (will be stringified). */
  body?: unknown;
  /** Query params appended to URL. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Abort signal (useful for React effects). */
  signal?: AbortSignal;
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function withQuery(url: string, query?: RequestOptions['query']): string {
  if (!query) return url;
  const u = new URL(url);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

async function tryParseJson(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Some endpoints may still return JSON without a content-type; try anyway.
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return res.json().catch(async () => res.text());
}

/**
 * Create a fetch-based HTTP client bound to a base URL.
 */
export function createHttpClient(config: HttpClientConfig) {
  async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    if (!config.baseUrl) {
      throw new ApiError(
        'Missing API base URL. Set NEXT_PUBLIC_DRAFTS_API_URL in your environment.',
      );
    }

    const url = withQuery(joinUrl(config.baseUrl, path), opts.query);

    const token = config.getAccessToken ? await config.getAccessToken() : undefined;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(config.defaultHeaders || {}),
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
      // Always disable Next.js caching for mutable draft state endpoints.
      // Consumers can implement their own caching layer as needed.
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await tryParseJson(res);
      const msg =
        typeof body === 'object' && body && 'message' in body
          ? String((body as Record<string, unknown>).message)
          : `Request failed with status ${res.status}`;
      const code =
        typeof body === 'object' && body && 'code' in body
          ? String((body as Record<string, unknown>).code)
          : undefined;
      throw new ApiError(msg, { status: res.status, url, body, code });
    }

    const data = await tryParseJson(res);
    return data as T;
  }

  async function safeRequest<T>(path: string, opts: RequestOptions = {}): Promise<ApiResult<T>> {
    try {
      const data = await request<T>(path, opts);
      return { data, error: null };
    } catch (err) {
      const error = err instanceof ApiError ? err : new ApiError('Unknown API error', { body: err });
      return { data: null, error };
    }
  }

  return {
    request,
    safeRequest,
    get: <T>(path: string, opts: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      request<T>(path, { ...opts, method: 'GET' }),
    post: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      request<T>(path, { ...opts, method: 'POST', body }),
    put: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      request<T>(path, { ...opts, method: 'PUT', body }),
    patch: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      request<T>(path, { ...opts, method: 'PATCH', body }),
    del: <T>(path: string, opts: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      request<T>(path, { ...opts, method: 'DELETE' }),

    safeGet: <T>(path: string, opts: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      safeRequest<T>(path, { ...opts, method: 'GET' }),
    safePost: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}) =>
      safeRequest<T>(path, { ...opts, method: 'POST', body }),
  };
}

/**
 * Normalize a wallet address for use in path params.
 */
export function normalizeWalletAddress(address: string): string {
  return address.trim().toLowerCase();
}
