import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment before importing logger
vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'staging');

describe('Logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exports a logger instance', async () => {
    const { logger } = await import('@/lib/logger');
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('debug calls console.log in staging', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { logger } = await import('@/lib/logger');
    logger.setLevel('debug');
    logger.debug('test message');
    expect(spy).toHaveBeenCalledWith('test message');
  });

  it('error always logs regardless of level', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { logger } = await import('@/lib/logger');
    logger.setLevel('error');
    logger.error('critical error');
    expect(spy).toHaveBeenCalledWith('critical error');
  });

  it('debug does not log when level is warn', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { logger } = await import('@/lib/logger');
    logger.setLevel('warn');
    logger.debug('should not appear');
    expect(spy).not.toHaveBeenCalled();
  });
});
