export class AppApiError extends Error {
  status?: number;
  body?: unknown;

  constructor(message: string, opts?: { status?: number; body?: unknown }) {
    super(message);
    this.name = 'AppApiError';
    this.status = opts?.status;
    this.body = opts?.body;
  }
}

function withQuery(url: string, query?: Record<string, string | number | boolean | undefined | null>) {
  if (!query) return url;
  const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    u.searchParams.set(k, String(v));
  });
  // If the original url was relative, strip the origin.
  if (!/^https?:\/\//.test(url)) {
    return u.pathname + (u.search ? u.search : '');
  }
  return u.toString();
}

export async function fetchJson<T>(
  url: string,
  opts?: RequestInit & { query?: Record<string, string | number | boolean | undefined | null> },
): Promise<T> {
  const fullUrl = withQuery(url, opts?.query);

  const res = await fetch(fullUrl, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts?.headers || {}),
    },
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'error' in (body as Record<string, unknown>)
        ? String((body as Record<string, unknown>).error)
        : `Request failed (${res.status})`;
    throw new AppApiError(msg, { status: res.status, body });
  }

  return body as T;
}
