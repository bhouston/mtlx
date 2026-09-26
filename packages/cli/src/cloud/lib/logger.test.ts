import { describe, expect, it } from 'vitest';
import { MemoryLogger } from './logger.ts';

describe('logger', () => {
  describe('MemoryLogger', () => {
    it('should capture warn logs with correct level and message', () => {
      const logger = new MemoryLogger();
      logger.warn('Test warning message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual({
        level: 'warn',
        message: 'Test warning message',
      });
    });

    it('should capture error logs with correct level and message', () => {
      const logger = new MemoryLogger();
      logger.error('Test error message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual({
        level: 'error',
        message: 'Test error message',
      });
    });

    it('should capture info logs with correct level and message', () => {
      const logger = new MemoryLogger();
      logger.info('Test info message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual({
        level: 'info',
        message: 'Test info message',
      });
    });

    it('should capture verbose logs with correct level and message', () => {
      const logger = new MemoryLogger();
      logger.verbose('Test verbose message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual({
        level: 'verbose',
        message: 'Test verbose message',
      });
    });

    it('should capture all log levels', () => {
      const logger = new MemoryLogger();
      logger.warn('Warning 1');
      logger.error('Error 1');
      logger.info('Info 1');
      logger.verbose('Verbose 1');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(4);
      expect(logs[0]).toEqual({ level: 'warn', message: 'Warning 1' });
      expect(logs[1]).toEqual({ level: 'error', message: 'Error 1' });
      expect(logs[2]).toEqual({ level: 'info', message: 'Info 1' });
      expect(logs[3]).toEqual({ level: 'verbose', message: 'Verbose 1' });
    });

    it('should store logs in order', () => {
      const logger = new MemoryLogger();
      logger.info('First message');
      logger.warn('Second message');
      logger.error('Third message');
      logger.verbose('Fourth message');

      const logs = logger.getLogs();
      expect(logs.length).toBe(4);
      expect(logs[0]?.message).toBe('First message');
      expect(logs[1]?.message).toBe('Second message');
      expect(logs[2]?.message).toBe('Third message');
      expect(logs[3]?.message).toBe('Fourth message');
    });

    it('should return a copy of logs array (not reference)', () => {
      const logger = new MemoryLogger();
      logger.info('Test message');

      const logs1 = logger.getLogs();
      const logs2 = logger.getLogs();

      expect(logs1).not.toBe(logs2);
      expect(logs1).toEqual(logs2);
    });

    it('should allow clearing logs', () => {
      const logger = new MemoryLogger();
      logger.warn('Warning');
      logger.error('Error');
      logger.info('Info');

      expect(logger.getLogs()).toHaveLength(3);

      logger.clear();

      expect(logger.getLogs()).toHaveLength(0);
    });

    it('should handle empty messages', () => {
      const logger = new MemoryLogger();
      logger.warn('');
      logger.error('');
      logger.info('');
      logger.verbose('');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(4);
      expect(logs[0]).toEqual({ level: 'warn', message: '' });
      expect(logs[1]).toEqual({ level: 'error', message: '' });
      expect(logs[2]).toEqual({ level: 'info', message: '' });
      expect(logs[3]).toEqual({ level: 'verbose', message: '' });
    });

    it('should handle multiple logs of the same level', () => {
      const logger = new MemoryLogger();
      logger.info('Info 1');
      logger.info('Info 2');
      logger.info('Info 3');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0]?.message).toBe('Info 1');
      expect(logs[1]?.message).toBe('Info 2');
      expect(logs[2]?.message).toBe('Info 3');
      expect(logs.every((log) => log.level === 'info')).toBe(true);
    });
  });
});
