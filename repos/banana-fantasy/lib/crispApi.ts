import { logger } from '@/lib/logger';

const CRISP_BASE = 'https://api.crisp.chat/v1';
const CRISP_WEBSITE_ID = 'ed386428-a6f2-435a-a3e1-043f0a078093';

export interface CrispConversation {
  session_id: string;
  website_id: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  state: 'pending' | 'unresolved' | 'resolved';
  unread: { operator?: number; visitor?: number } | number;
  last_message: string | null;
  updated_at: number; // ms epoch
  created_at: number;
  waiting_since?: number;
  meta?: Record<string, unknown>;
}

export interface CrispCredentials {
  identifier: string;
  key: string;
}

export function getCrispCredentials(): CrispCredentials | null {
  const identifier = process.env.CRISP_IDENTIFIER?.trim();
  const key = process.env.CRISP_KEY?.trim();
  if (!identifier || !key) return null;
  return { identifier, key };
}

function authHeader(creds: CrispCredentials): string {
  return `Basic ${Buffer.from(`${creds.identifier}:${creds.key}`).toString('base64')}`;
}

export async function listConversations(opts: {
  page?: number;
  filterUnread?: boolean;
  filterResolved?: boolean;
} = {}): Promise<{ conversations: CrispConversation[]; configured: boolean }> {
  const creds = getCrispCredentials();
  if (!creds) {
    return { conversations: [], configured: false };
  }

  const page = opts.page ?? 1;
  const params = new URLSearchParams();
  if (opts.filterUnread) params.set('filter_unread', '1');
  if (opts.filterResolved === false) params.set('filter_resolved', '0');
  const url = `${CRISP_BASE}/website/${CRISP_WEBSITE_ID}/conversations/${page}${params.toString() ? `?${params}` : ''}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: authHeader(creds),
        'X-Crisp-Tier': 'plugin',
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.warn('crisp.list_conversations.http_error', { status: res.status, body: body.slice(0, 200) });
      return { conversations: [], configured: true };
    }
    const data = await res.json();
    return { conversations: (data.data ?? []) as CrispConversation[], configured: true };
  } catch (err) {
    logger.error('crisp.list_conversations.failed', { err });
    return { conversations: [], configured: true };
  }
}

/** Deep link to the Crisp dashboard for a specific conversation. */
export function crispConversationUrl(sessionId: string): string {
  return `https://app.crisp.chat/website/${CRISP_WEBSITE_ID}/inbox/${sessionId}/`;
}

/** Inbox landing in Crisp dashboard. */
export function crispInboxUrl(): string {
  return `https://app.crisp.chat/website/${CRISP_WEBSITE_ID}/inbox/`;
}
