import { describe, expect, it, vi } from 'vitest';

import { INTERNAL_SERVER_ERROR_MESSAGE } from '@/config/constants';
import { HttpStatusCode } from '@/shared/enums';
import { AppError, parseErrorToObject } from '@/shared/errors';

describe('AppError', () => {
  it('should parse the default error to the AppError', () => {
    const sut = parseErrorToObject(new Error('message'));
    expect(sut).toBeInstanceOf(AppError);
    expect(sut.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
    expect(sut.originalError?.message).toBe('message');
    expect(sut.name).toBe('AppError');
  });

  it('should return an AppError by default', () => {
    const sut = parseErrorToObject(new AppError());
    expect(sut.message).toBe(INTERNAL_SERVER_ERROR_MESSAGE);
    expect(sut.originalError).toBeUndefined();
    expect(sut.name).toBe('AppError');
  });

  it('should check for an axios error', () => {
    const axiosErrorMock = new Error('any');
    const mockResponse = {
      config: {
        url: '/login',
        baseURL: 'http://localhost:3301',
        method: 'post',
      },
      status: HttpStatusCode.BAD_REQUEST,
      data: { key: 'value' },
    };

    axiosErrorMock.name = 'AxiosXxx';
    (axiosErrorMock as any).response = mockResponse;

    const sut = parseErrorToObject(axiosErrorMock);
    expect(sut.originalError?.message).toBe('any');
    expect(sut.metadata).toStrictEqual(mockResponse);
    expect(sut.name).toBe('AppError');
  });

  it('should create a standard error and perform the replace {{errorId}}', () => {
    vi.spyOn(AppError, 'generateErrorId').mockReturnValueOnce('MOCKED');

    const sut = parseErrorToObject(new Error('Error ID: {{errorId}}'));
    expect(sut.message).toEqual(INTERNAL_SERVER_ERROR_MESSAGE);
    expect(sut.originalError?.message).toEqual('Error ID: MOCKED');
    expect(sut.errorId).toEqual('MOCKED');
  });
});
