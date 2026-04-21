/**
 * Structured logger. JSON lines in prod, pretty in dev.
 *
 * Structured (preferred):
 *   logger.info('admin.grant_drafts', { requestId, actor, target, count })
 *
 * Legacy (still works):
 *   logger.debug('[Draft]', 'Connected')      → "[Draft] Connected"
 *   logger.error('[WS]', err)                 → "[WS] Error: ..."
 *
 * Level gating: debug/info/warn/error/silent. Env-controlled via LOG_LEVEL
 * (server) or NEXT_PUBLIC_ENVIRONMENT (client).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

function getDefaultLevel(): LogLevel {
  if (typeof window === 'undefined') {
    return (process.env.LOG_LEVEL as LogLevel) ?? 'info';
  }
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT;
  if (env === 'staging' || env === 'dev') return 'debug';
  return 'warn';
}

function isProd(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENVIRONMENT !== 'staging';
  }
  return process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod';
}

type Fields = Record<string, unknown>;

function isFieldsObject(v: unknown): v is Fields {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    !(v instanceof Error) &&
    v.constructor === Object
  );
}

function serializeError(err: unknown): Fields {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err as unknown as { status?: number }).status !== undefined
        ? { status: (err as unknown as { status?: number }).status }
        : {},
    };
  }
  return { err: String(err) };
}

class Logger {
  private level: LogLevel = getDefaultLevel();

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private emit(level: LogLevel, args: unknown[]) {
    if (!this.shouldLog(level)) return;

    // Structured path: first arg is a non-empty string msg, second (optional) is a plain object of fields
    const msg = typeof args[0] === 'string' ? args[0] : undefined;
    const fields = args[1] !== undefined && isFieldsObject(args[1]) ? args[1] : undefined;
    const isStructured = msg !== undefined && (args.length === 1 || (args.length === 2 && fields !== undefined));

    if (isStructured && isProd()) {
      const payload = {
        level,
        msg,
        ts: new Date().toISOString(),
        ...(fields ?? {}),
      };
      const line = JSON.stringify(payload, (_k, v) => (v instanceof Error ? serializeError(v) : v));
      if (level === 'error') console.error(line);
      else if (level === 'warn') console.warn(level === 'warn' ? line : line);
      else console.log(line);
      return;
    }

    // Legacy + dev-pretty path: pass-through to console
    if (level === 'error') console.error(...args);
    else if (level === 'warn') console.warn(...args);
    else if (level === 'info') console.info(...args);
    else console.log(...args);
  }

  debug(...args: unknown[]) { this.emit('debug', args); }
  info(...args: unknown[]) { this.emit('info', args); }
  warn(...args: unknown[]) { this.emit('warn', args); }
  error(...args: unknown[]) { this.emit('error', args); }
}

export const logger = new Logger();
