import { describe, expect, it, vi } from 'vitest';

import { parseErrorToObject } from '@/shared';

import { HttpStatusCode } from '../enums';
import { AppError } from './app';

describe('AppError', () => {
  it('should parse the default error to the AppError', () => {
    const sut = parseErrorToObject(new Error('any_message'));
    expect(sut).toBeInstanceOf(AppError);
    expect(sut.original?.message).toBe('any_message');
    expect(sut.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
    expect(sut.original).toBeDefined();
    expect(sut.name).toBe('Error');
  });

  it('should return an AppError by default', () => {
    const sut = parseErrorToObject(new AppError({ message: 'any_message' }));
    expect(sut.message).toBe('any_message');
    expect(sut.original).toBeUndefined();
    expect(sut.name).toBe('AppError');
  });

  it('should check for an axios error', () => {
    const axiosErrorMock = new Error('any_error');
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
    expect(sut.original?.message).toBe('any_error');
    expect(sut.metadata).toStrictEqual(mockResponse);
    expect(sut.name).toBe('AxiosXxx');
  });

  it('should create a standard error and perform the replace {{errorId}}', () => {
    vi.spyOn(AppError, 'generateErrorId').mockReturnValueOnce('MOCKED');

    const sut = parseErrorToObject(new Error('Error ID: {{errorId}}'));
    expect(sut.message).toEqual(
      'An error occurred, contact support and report the code [MOCKED]',
    );
    expect(sut.original?.message).toEqual('Error ID: MOCKED');
    expect(sut.errorId).toEqual('MOCKED');
  });
});
