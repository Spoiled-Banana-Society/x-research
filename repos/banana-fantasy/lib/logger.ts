/**
 * Structured logger with environment-aware log levels.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('[Draft]', 'Connected to WebSocket');
 *   logger.info('[Auth]', 'User logged in');
 *   logger.warn('[API]', 'Retrying request');
 *   logger.error('[WS]', 'Connection failed', error);
 *
 * In production: only error + warn are logged.
 * In staging: all levels are logged.
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
    // Server-side: use env var
    return (process.env.LOG_LEVEL as LogLevel) ?? 'warn';
  }
  // Client-side: staging gets debug, production gets warn
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT;
  if (env === 'staging' || env === 'dev') return 'debug';
  return 'warn';
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = getDefaultLevel();
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  debug(...args: unknown[]) {
    if (this.shouldLog('debug')) console.log(...args);
  }

  info(...args: unknown[]) {
    if (this.shouldLog('info')) console.info(...args);
  }

  warn(...args: unknown[]) {
    if (this.shouldLog('warn')) console.warn(...args);
  }

  error(...args: unknown[]) {
    if (this.shouldLog('error')) console.error(...args);
  }
}

export const logger = new Logger();
