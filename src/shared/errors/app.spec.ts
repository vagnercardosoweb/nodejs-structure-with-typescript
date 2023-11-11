import { describe, expect, it } from 'vitest';

import { AppError, AppErrorInput, HttpStatusCode } from '@/shared';

describe('AppError', () => {
  it('create error with default properties', () => {
    const sut = new AppError();

    expect(sut.code).toBe('DEFAULT');
    expect(sut.name).toBe('AppError');
    expect(sut.message).toBe('errors.internal_server_error');
    expect(sut.description).toBeUndefined();
    expect(sut.metadata).toEqual({});
    expect(sut.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
    expect(sut.originalError).toBeUndefined();
    expect(sut.sendToSlack).toBeTruthy();
    expect(sut.requestId).toBeUndefined();
    expect(sut.errorId).toBeDefined();
    expect(sut.errorId.slice(0, 1)).toEqual('V');
    expect(sut.errorId.slice(-1)).toEqual('C');
    expect(sut.errorId).toHaveLength(12);
    expect(sut.stack).toEqual(expect.any(String));
    expect(sut.logging).toBeTruthy();
    expect(sut.stack).toBeDefined();
  });

  it('create error with all properties defined', () => {
    const error = new Error('any');
    const input: AppErrorInput = {
      code: 'any_code',
      requestId: 'any_request_id',
      message: 'any_message',
      description: 'any_description',
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      sendToSlack: false,
      originalError: error,
      errorId: 'any_error_id',
      logging: true,
      metadata: {
        any_prop: 'any_value',
        user: { name: 'user_name' },
      },
    };

    const sut = new AppError(input);

    expect(sut.code).toBe(input.code);
    expect(sut.name).toBe('AppError');
    expect(sut.message).toBe(input.message);
    expect(sut.description).toBe(input.description);
    expect(sut.errorId).toEqual('any_error_id');
    expect(sut.metadata).toBe(input.metadata);
    expect(sut.statusCode).toBe(input.statusCode);
    expect(sut.requestId).toBe(input.requestId);

    expect(sut.originalError).toStrictEqual({
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    expect(sut.sendToSlack).toBe(input.sendToSlack);
    expect(sut.logging).toBeTruthy();
    expect(sut.stack).toBeDefined();

    sut.description = undefined;
    expect(sut.description).toBeUndefined();

    sut.sendToSlack = false;
    expect(sut.sendToSlack).toBeFalsy();

    sut.statusCode = HttpStatusCode.FORBIDDEN;
    expect(sut.statusCode).toBe(HttpStatusCode.FORBIDDEN);

    sut.errorId = 'other_error_id';
    expect(sut.errorId).toEqual('other_error_id');
    expect(sut.errorId).toHaveLength(14);
  });

  it('should return name as CustomError', () => {
    class CustomError extends AppError {
      public message = 'custom message';
      public name = 'CustomError';
    }

    const sut = new CustomError();
    expect(sut.message).toEqual('custom message');
    expect(sut.name).toEqual(CustomError.name);
  });

  it('should replace do {{ANY}} in the error message', () => {
    const errorId = 'mocked_id';
    const sut = new AppError({
      message: 'Message with name "{{userName}}" and Error Id: "{{errorId}}"',
      metadata: { userName: 'any name' },
      errorId,
    });
    expect(sut.message).toEqual(
      `Message with name "any name" and Error Id: "${errorId}"`,
    );
  });

  it('should replace do {{NESTED_ANY}} in the error message', () => {
    const sut = new AppError({
      message: 'Message with name "{{user.name}}"',
      metadata: { user: { name: 'any name' } },
    });
    expect(sut.message).toEqual('Message with name "any name"');
  });

  it('should return the error message without the replace', () => {
    const message = 'Message without replace {{replaceMe}}';
    const sut = new AppError({ message });
    expect(sut.message).toEqual(message);
  });

  it('cannot set property if it is unset', () => {
    const sut = new AppError({ message: 'any', description: undefined });
    expect(sut.description).toBeUndefined();
  });

  it('should create an error with the requestId', () => {
    const sut = new AppError({ message: 'any', requestId: 'any_request_id' });
    expect(sut.requestId).toStrictEqual('any_request_id');
  });
});
