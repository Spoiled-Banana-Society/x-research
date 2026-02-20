/**
 * WebSocket client for real-time draft events.
 *
 * Server: SBS-Football-Drafts (Go)
 * URL format (from API_INTEGRATION.md):
 *   wss://.../ws?address={walletAddress}&draftName={draftId}
 */

import { normalizeWalletAddress } from './client';
import { getDraftServerUrl } from '@/lib/staging';

export type DraftWsEventType =
  | 'countdown_update'
  | 'timer_update'
  | 'new_pick'
  | 'draft_info_update'
  | 'final_card'
  | 'draft_complete'
  | string;

export interface DraftWsMessage<TPayload = unknown> {
  eventType: DraftWsEventType;
  payload?: TPayload;
  [k: string]: unknown;
}

export interface DraftWebSocketClientOptions {
  walletAddress: string;
  draftId: string;
  /** Override WS base URL (otherwise uses NEXT_PUBLIC_DRAFT_SERVER_URL). */
  serverUrl?: string;
  /** Maximum reconnect attempts (default: Infinity). */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 500). */
  baseBackoffMs?: number;
  /** Maximum delay in ms for exponential backoff (default: 30_000). */
  maxBackoffMs?: number;
  /** If true, logs basic lifecycle events. */
  debug?: boolean;
}

type Handler<T = unknown> = (message: DraftWsMessage<T>) => void;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoff(attempt: number, baseMs: number, maxMs: number): number {
  // exponential backoff with jitter
  const exp = Math.min(maxMs, baseMs * Math.pow(2, Math.max(0, attempt - 1)));
  const jitter = exp * (0.2 * (Math.random() * 2 - 1));
  return Math.max(0, Math.floor(exp + jitter));
}

function buildWsUrl(serverUrl: string, walletAddress: string, draftId: string): string {
  const base = serverUrl.replace(/\/$/, '');
  const u = new URL(`${base}/ws`);
  u.searchParams.set('address', normalizeWalletAddress(walletAddress));
  u.searchParams.set('draftName', draftId);
  return u.toString();
}

/**
 * Reconnectable WebSocket client with exponential backoff.
 */
export class DraftWebSocketClient {
  private ws: WebSocket | null = null;
  private readonly opts: Required<
    Pick<
      DraftWebSocketClientOptions,
      'walletAddress' | 'draftId' | 'serverUrl' | 'maxRetries' | 'baseBackoffMs' | 'maxBackoffMs' | 'debug'
    >
  >;
  private shouldReconnect = true;
  private reconnectAttempt = 0;

  private handlers = new Map<DraftWsEventType, Set<Handler>>();
  private anyHandlers = new Set<Handler>();

  constructor(options: DraftWebSocketClientOptions) {
    const serverUrl = options.serverUrl || getDraftServerUrl() || '';
    this.opts = {
      walletAddress: options.walletAddress,
      draftId: options.draftId,
      serverUrl,
      maxRetries: options.maxRetries ?? Number.POSITIVE_INFINITY,
      baseBackoffMs: options.baseBackoffMs ?? 500,
      maxBackoffMs: options.maxBackoffMs ?? 30_000,
      debug: options.debug ?? false,
    };

    console.log('[DraftWS] constructor:', {
      serverUrl: this.opts.serverUrl,
      walletAddress: this.opts.walletAddress?.slice(0, 10) + '...',
      draftId: this.opts.draftId,
      hasServerUrl: !!this.opts.serverUrl,
    });

    if (!this.opts.serverUrl) {
      console.error('[DraftWS] No server URL! getDraftServerUrl() returned empty. Check staging env vars.');
      throw new Error('Missing draft server URL (NEXT_PUBLIC_DRAFT_SERVER_URL or staging equivalent)');
    }

    if (typeof WebSocket === 'undefined') {
      throw new Error('WebSocket is not available in this runtime. Use DraftWebSocketClient in client components only.');
    }
  }

  /** Whether the socket is currently open. */
  public get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Connect to the server.
   */
  public async connect(): Promise<void> {
    this.shouldReconnect = true;
    await this.openSocket();
  }

  /**
   * Disconnect and stop reconnecting.
   */
  public disconnect(code?: number, reason?: string): void {
    this.shouldReconnect = false;
    this.reconnectAttempt = 0;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.ws.close(code, reason);
    }
    this.ws = null;
  }

  /**
   * Register a handler for a specific event type.
   */
  public on<TPayload = unknown>(eventType: DraftWsEventType, handler: Handler<TPayload>): () => void {
    const set = this.handlers.get(eventType) || new Set<Handler>();
    set.add(handler as Handler);
    this.handlers.set(eventType, set);
    return () => this.off(eventType, handler as Handler);
  }

  /**
   * Register a handler for all incoming messages.
   */
  public onAny(handler: Handler): () => void {
    this.anyHandlers.add(handler);
    return () => this.anyHandlers.delete(handler);
  }

  /** Remove a handler. */
  public off(eventType: DraftWsEventType, handler: Handler): void {
    const set = this.handlers.get(eventType);
    set?.delete(handler);
  }

  /**
   * Send an arbitrary message.
   */
  public send(message: DraftWsMessage): void {
    if (!this.isConnected) throw new Error('WebSocket is not connected');
    // Go server expects { type, payload } — send both type and eventType for compatibility
    const wire = {
      ...message,
      type: message.eventType,
    };
    this.ws!.send(JSON.stringify(wire));
  }

  /**
   * Convenience helper for making a pick.
   *
   * Server expects an event like:
   *   { eventType: 'pick_received', payload: { playerId, displayName, team, position } }
   */
  public sendPick(payload: { playerId: string; displayName: string; team: string; position: string }): void {
    this.send({ eventType: 'pick_received', payload });
  }

  private async openSocket(): Promise<void> {
    const url = buildWsUrl(this.opts.serverUrl, this.opts.walletAddress, this.opts.draftId);

    if (this.opts.debug) console.log('[DraftWS] connecting', url);

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.reconnectAttempt = 0;
        if (this.opts.debug) console.log('[DraftWS] open');
        resolve();
      };

      ws.onerror = (evt) => {
        if (this.opts.debug) console.log('[DraftWS] error', evt);
        // Some browsers also fire close after error; we reject here so callers know initial connect failed.
        reject(new Error('WebSocket connection error'));
      };

      ws.onmessage = (event) => {
        let msg: DraftWsMessage;
        try {
          msg = JSON.parse(event.data);
        } catch {
          msg = { eventType: 'unknown', payload: event.data };
        }

        // Notify anyHandlers first
        for (const h of this.anyHandlers) {
          try {
            h(msg);
          } catch (err) {
            console.error('[DraftWS] anyHandler failed for message:', msg?.eventType ?? 'unknown', err);
          }
        }

        const set = this.handlers.get(msg.eventType);
        if (set) {
          for (const h of set) {
            try {
              h(msg);
            } catch (err) {
              console.error('[DraftWS] handler failed for message:', msg?.eventType ?? 'unknown', err);
            }
          }
        }
      };

      ws.onclose = async (event) => {
        if (this.opts.debug) console.log('[DraftWS] close', event.code, event.reason);
        // If connect() is waiting on open, allow it to reject if we close before opening.
        if (ws.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket closed before opening'));
          return;
        }
        // Open socket closed: attempt reconnect if requested.
        if (this.shouldReconnect) {
          await this.reconnect();
        }
      };
    });
  }

  private async reconnect(): Promise<void> {
    this.reconnectAttempt += 1;
    if (this.reconnectAttempt > this.opts.maxRetries) return;

    const delay = computeBackoff(this.reconnectAttempt, this.opts.baseBackoffMs, this.opts.maxBackoffMs);
    if (this.opts.debug) console.log(`[DraftWS] reconnect attempt ${this.reconnectAttempt} in ${delay}ms`);
    await sleep(delay);

    if (!this.shouldReconnect) return;

    try {
      await this.openSocket();
    } catch {
      // Keep trying.
      if (this.shouldReconnect) {
        await this.reconnect();
      }
    }
  }
}
