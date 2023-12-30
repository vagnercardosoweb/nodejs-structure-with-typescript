import { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { cors as configCors } from '@/config/cors';
import { cors } from '@/rest-api/middlewares';
import { HttpMethod, HttpStatusCode } from '@/shared/enums';

describe('rest-api/middlewares/cors', () => {
  it('should validate the headers that were defined for cors', () => {
    const mockNext = vi.fn();

    const mockRequest = {
      method: HttpMethod.GET,
    } as Request;

    const mockResponse = {
      setHeader: vi.fn().mockReturnValueOnce(null) as any,
    } as any;

    cors(mockRequest, mockResponse, mockNext);
    expect(mockResponse.setHeader).toHaveBeenCalledTimes(4);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      configCors.origin,
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      configCors.methods.join(','),
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      configCors.headers.join(','),
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Credentials',
      'true',
    );

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should validate the header when the method is "OPTIONS"', () => {
    const mockNext = vi.fn();

    const mockRequest = {
      method: HttpMethod.OPTIONS,
    } as Request;

    const mockResponse = {
      setHeader: vi.fn().mockReturnValueOnce(null) as any,
      sendStatus: vi.fn().mockReturnValueOnce(null) as any,
    } as any;

    cors(mockRequest, mockResponse, mockNext);

    expect(mockResponse.setHeader).toHaveBeenCalledTimes(5);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Length', '0');

    expect(mockResponse.sendStatus).toHaveBeenCalledTimes(1);
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(
      HttpStatusCode.NO_CONTENT,
    );

    expect(mockNext).toHaveBeenCalledTimes(0);
  });
});
