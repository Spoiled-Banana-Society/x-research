declare module '@sentry/nextjs' {
  export interface BrowserOptions {
    dsn?: string;
    environment?: string;
    tracesSampleRate?: number;
  }

  export function init(options: BrowserOptions): void;
  export function captureException(exception: unknown): string;
}
