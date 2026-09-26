import type * as SentryType from '@sentry/node';
import * as Sentry from '@sentry/node';

/**
 * Interface for loggers
 * Allows dependency injection for better test isolation
 */
export type Logger = {
  /**
   * Log a warning message
   * @param message - The warning message
   */
  warn: (message: string) => void;

  /**
   * Log an error message
   * @param message - The error message
   */
  error: (message: string) => void;

  /**
   * Log an info message
   * @param message - The info message
   */
  info: (message: string) => void;

  /**
   * Log a verbose message
   * @param message - The verbose message
   */
  verbose: (message: string) => void;
};

/**
 * Get Sentry logger if available, otherwise return null.
 * Use this for structured logging with logger.fmt template literals.
 * Example: getSentryLogger()?.info(getSentryLogger()?.fmt`Cache miss for user: ${userId}`);
 */
export function getSentryLogger(): {
  logger: typeof SentryType.logger;
  fmt: typeof SentryType.logger.fmt;
} | null {
  // Check if Sentry logger is available (Sentry must be initialized first)
  if (Sentry.logger) {
    return {
      logger: Sentry.logger,
      fmt: Sentry.logger.fmt,
    };
  }
  return null;
}

/**
 * Log entry structure for in-memory logger
 */
export type LogEntry = {
  level: string;
  message: string;
};

/**
 * Console logger that outputs to console (for production use)
 */
export class ConsoleLogger implements Logger {
  warn(message: string): void {
    console.warn(message);
  }

  error(message: string): void {
    console.error(message);
  }

  info(message: string): void {
    console.info(message);
  }

  verbose(message: string): void {
    console.log(message);
  }
}

/**
 * In-memory logger for testing
 * Allows tests to capture and verify log output without affecting console
 */
export class MemoryLogger implements Logger {
  private logs: LogEntry[] = [];

  warn(message: string): void {
    this.logs.push({ level: 'warn', message });
  }

  error(message: string): void {
    this.logs.push({ level: 'error', message });
  }

  info(message: string): void {
    this.logs.push({ level: 'info', message });
  }

  verbose(message: string): void {
    this.logs.push({ level: 'verbose', message });
  }

  /**
   * Get all captured logs
   * @returns Array of log entries in order they were logged
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all captured logs (for testing)
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Get all log messages as a single string, joined by newlines
   * @returns All log messages joined by newlines
   */
  toString(): string {
    return this.logs.map((log) => log.message).join('\n');
  }
}
