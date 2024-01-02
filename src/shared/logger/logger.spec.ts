import os from 'node:os';
import process from 'node:process';

import { describe, vi } from 'vitest';

import { LogLevel } from '@/shared/logger/index';
import { Logger } from '@/shared/logger/logger';
import { REDACTED_TEXT } from '@/shared/redact-keys';

describe('src/shared/logger', () => {
  let sut: Logger;
  const now = new Date(0);
  const hostname = os.hostname();

  beforeEach(() => {
    vi.useFakeTimers({ now });
    vi.stubEnv('NODE_ENV', 'local');
    sut = new Logger('test');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('should return the "id" of the log correctly set in the constructor', () => {
    expect(sut.getId()).toBe('test');
  });

  it('should create a new logger instance with a new "id"', () => {
    const newLogger = sut.withId('newId');
    expect(newLogger.getId()).toBe('newId');
    expect(newLogger).not.toBe(sut);
  });

  it('should log with the "info" level', () => {
    const spyStdoutWrite = vi.spyOn(process.stdout, 'write');
    spyStdoutWrite.mockImplementationOnce(() => true);

    sut.info('info message', { key: 'value' });
    expect(spyStdoutWrite).toHaveBeenCalledTimes(1);
    expect(spyStdoutWrite).toHaveBeenCalledWith(
      `${JSON.stringify({
        id: 'test',
        level: LogLevel.INFO,
        hostname,
        timestamp: now,
        message: 'info message',
        metadata: { key: 'value' },
      })}\n`,
    );
  });

  it('should log with the "error" level', () => {
    const spyStdoutWrite = vi.spyOn(process.stdout, 'write');
    spyStdoutWrite.mockImplementationOnce(() => true);

    sut.error('error message', { key: 'value' });
    expect(spyStdoutWrite).toHaveBeenCalledTimes(1);
    expect(spyStdoutWrite).toHaveBeenCalledWith(
      `${JSON.stringify({
        id: 'test',
        level: LogLevel.ERROR,
        hostname,
        timestamp: now,
        message: 'error message',
        metadata: { key: 'value' },
      })}\n`,
    );
  });

  it('should log with the "critical" level', () => {
    const spyStdoutWrite = vi.spyOn(process.stdout, 'write');
    spyStdoutWrite.mockImplementationOnce(() => true);

    sut.critical('critical message', { key: 'value' });
    expect(spyStdoutWrite).toHaveBeenCalledTimes(1);
    expect(spyStdoutWrite).toHaveBeenCalledWith(
      `${JSON.stringify({
        id: 'test',
        level: LogLevel.CRITICAL,
        hostname,
        timestamp: now,
        message: 'critical message',
        metadata: { key: 'value' },
      })}\n`,
    );
  });

  it('should log with the "warn" level', () => {
    const spyStdoutWrite = vi.spyOn(process.stdout, 'write');
    spyStdoutWrite.mockImplementationOnce(() => true);

    sut.warn('warn message', { key: 'value' });
    expect(spyStdoutWrite).toHaveBeenCalledTimes(1);
    expect(spyStdoutWrite).toHaveBeenCalledWith(
      `${JSON.stringify({
        id: 'test',
        level: LogLevel.WARN,
        hostname,
        timestamp: now,
        message: 'warn message',
        metadata: { key: 'value' },
      })}\n`,
    );
  });

  it('should log with the "info" level and skip the redact', () => {
    const spyStdoutWrite = vi.spyOn(process.stdout, 'write');
    spyStdoutWrite.mockImplementationOnce(() => true);

    sut.info('info message', { password: 'any_password', $skipRedact: true });
    expect(spyStdoutWrite).toHaveBeenCalledTimes(1);
    expect(spyStdoutWrite).toHaveBeenCalledWith(
      `${JSON.stringify({
        id: 'test',
        level: LogLevel.INFO,
        hostname,
        timestamp: now,
        message: 'info message',
        metadata: { password: 'any_password' },
      })}\n`,
    );
  });

  it('should log with the "info" level and redact the keys', () => {
    const spyStdoutWrite = vi.spyOn(process.stdout, 'write');
    spyStdoutWrite.mockImplementationOnce(() => true);

    const metadata = { name: 'any_name', password: 'any_password' };
    sut.info('info message', metadata);
    expect(spyStdoutWrite).toHaveBeenCalledTimes(1);
    expect(spyStdoutWrite).toHaveBeenCalledWith(
      `${JSON.stringify({
        id: 'test',
        level: LogLevel.INFO,
        hostname,
        timestamp: now,
        message: 'info message',
        metadata: { ...metadata, password: REDACTED_TEXT },
      })}\n`,
    );
  });

  it('should log in with the "info" level and configure the "$redactedKeys" metadata', () => {
    const spyStdoutWrite = vi.spyOn(process.stdout, 'write');
    spyStdoutWrite.mockImplementationOnce(() => true);

    const metadata = {
      $redactedKeys: ['custom_key'],
      custom_key: 'any_custom_value',
      name: 'any_name',
    };

    sut.info('info message', metadata);

    expect(spyStdoutWrite).toHaveBeenCalledTimes(1);
    expect(spyStdoutWrite).toHaveBeenCalledWith(
      `${JSON.stringify({
        id: 'test',
        level: LogLevel.INFO,
        hostname,
        timestamp: now,
        message: 'info message',
        metadata: {
          custom_key: REDACTED_TEXT,
          name: metadata.name,
        },
      })}\n`,
    );
  });

  it('should log in with the "info" level and configure the "$logId" metadata', () => {
    const spyStdoutWrite = vi.spyOn(process.stdout, 'write');
    spyStdoutWrite.mockImplementationOnce(() => true);

    const newLogId = 'new_log_id';
    const metadata = {
      $logId: newLogId,
      name: 'any_name',
    };

    sut.info('info message', metadata);

    expect(spyStdoutWrite).toHaveBeenCalledTimes(1);
    expect(spyStdoutWrite).toHaveBeenCalledWith(
      `${JSON.stringify({
        id: newLogId,
        level: LogLevel.INFO,
        hostname,
        timestamp: now,
        message: 'info message',
        metadata: { name: metadata.name },
      })}\n`,
    );
  });

  it('should not log when the "NODE_ENV" is "test"', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const spyStdoutWrite = vi.spyOn(process.stdout, 'write');
    spyStdoutWrite.mockImplementationOnce(() => true);

    sut.info('info message', { key: 'value' });
    expect(spyStdoutWrite).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
