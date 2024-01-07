import { beforeEach, describe, expect, it } from 'vitest';

import { UNAUTHORIZED_ERROR_MESSAGE } from '@/shared/errors';
import { Jwt, JWT_EXPIRES_IN } from '@/shared/jwt';

const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDKIvyedS8m00n1Kmma4l7jCouu8uqVcov6k1Zhsr0rC1qpdHQdrjkDwFZhgPbgnEfJgBgnUzpJaeVJPMSL/fW6l/qvpM2h52RAjQfz+h69ep4a1BFLhKjKjA4OJiNQUviQA0LXHCY5Y5VQA1xhRCzHECLRbQ7E3s4mqLHCfvhWeg0hHSwoQ4rkQ6knwAAO7GuylP7GQ6t8hriVyCtAquxUQlMxeywFBx6NfPwI0dxvlFWyu3ZQu1FSs802HahlYWZH1TU5372QyjbbM5ESnh2zZiYvzXBC2jHDX8DTkFyIiuevj8uLOr+1FlTy+HU0cGsMvsdmT2uQsp8T90mf8f1hAgMBAAECggEAEe/oEHxzNYDLL7d8+fX1WAExkAUvJ+ZFFNrj1kH9ycbbwez7LAvjAO0ECh1fMWNTQ3nbqtgWp59/OnAeb0XKYa2zqZTer1IdpVTE5ebGH45OXv1+lplfcrBAkKTcJJHLfz9Eb45B6uNmKcMcL+cHo8qDLHTL0+ocy3Vtml+ZOry4uogu4G8kO0rAG334HjPgb7Uj+rk02ZpNdfVYDkxZyfQF4lbJBOa0iNMcNNBn35OpuQGUf491/DVrkCgqBQmu4J4lmxkExAgwEiY71p+MbSTdSuPG4FB8JUe9VUqSxOZNRPAAgEitZ1JwXWO5MhtkiKUGivu7soeWDeGNsjbG+QKBgQDrX25cj7/eCs2Pa0gR1P7q6BzYzyGdjTqpBCdyYI4BNoxmvcil0JykK9EA9xowCMCtT7XKgiPLRQ5G/haHqu07RuB7uuUIWFzqJd/ZxcOre0GR9bAWq0T81BJKmZg6gbskrud+7OT2H0KdHbSRU2R26GXzgALr5JZjx6piK6fSPwKBgQDb2egCcAP9PslJ5oe5bjSgzXazXLINY3U74FEiXKubugYC2csQBG3dsVPcb1izrKmElAmsG+RZU47kBEXbUXiyaYTVryT4/90oVVVapTf8SXKG9id8GXNzMFDQxfSb01B8KiNnEgl4qOc5RpFNtaKYdNoIz4mRX8tZ0XfMOacIXwKBgQCdLRkRjpzdtfEXONjjr4ybaWz6CzezckAd5bxB0OCDRt3zLgDzWZ+AshHbxychtHaWRYhsNwOYFgE2vy5kYmwRDX+SoHeZXwiNA8W8Myg7Nw/OXHa+bJihDS05y9+wEjnagUHtrFwpTy64pMGT2lBYZ1DNjkplJDyZXRgWfniPGQKBgQCbcVFyT8LyTm9BmgZCnGIHg942aQbXIogkQrD666zGGVvgrh69/3OyuItDo1KDD0R4IbdJAhuM8OBp5X+C1vLQqnyqHQC2MSosN1F3GrQf48pfFDHMs64GNpYdVqlhd6JDeAO5/23E6x85RuS7nf4Nbykt65cnuyRrKAhc1DJ+XwKBgHs0uj3pdPHasGqrY/tNrEDW/17z3koWZjNXbsbY1rf5scFOvn6HO2iIoIEyU8AYEsefw2fx9Uu/GA2sftN3OVZYtGHp45R9SdSfVJ7aPhSbULEXuiJ05qmfYlXCmrl+06NgwnjhfLD+fBzh0Ww4lx2lcy417SR424klXAEj2WcI\n-----END PRIVATE KEY-----`;
const publicKey =
  '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyiL8nnUvJtNJ9SppmuJe4wqLrvLqlXKL+pNWYbK9KwtaqXR0Ha45A8BWYYD24JxHyYAYJ1M6SWnlSTzEi/31upf6r6TNoedkQI0H8/oevXqeGtQRS4SoyowODiYjUFL4kANC1xwmOWOVUANcYUQsxxAi0W0OxN7OJqixwn74VnoNIR0sKEOK5EOpJ8AADuxrspT+xkOrfIa4lcgrQKrsVEJTMXssBQcejXz8CNHcb5RVsrt2ULtRUrPNNh2oZWFmR9U1Od+9kMo22zOREp4ds2YmL81wQtoxw1/A05BciIrnr4/Lizq/tRZU8vh1NHBrDL7HZk9rkLKfE/dJn/H9YQIDAQAB\n-----END PUBLIC KEY-----';

const expectUnauthorizedError = (e: any) => {
  expect(e.message).toBe(UNAUTHORIZED_ERROR_MESSAGE);
  expect(e.originalError.message).toBeDefined();
};

describe('src/shared/jwt', () => {
  let jwt: Jwt;

  beforeEach(async () => {
    jwt = new Jwt(privateKey, publicKey);
  });

  it('should create a token and validate the "size"', () => {
    const token = jwt.create('any_sub');
    expect(token.split('.').length).toBe(3);
    expect(token).toBeDefined();
  });

  it('should create a token with "sub" defined', () => {
    const token = jwt.create('new_sub');
    const verify = jwt.verify(token);
    expect(verify.sub).toBe('new_sub');
  });

  it('should create a token with defined "metadata"', () => {
    const token = jwt.create('any_sub', { name: 'any name', role: 'admin' });
    const verify = jwt.verify(token);
    expect(verify.sub).toBe('any_sub');
    expect(verify.name).toBe('any name');
    expect(verify.role).toBe('admin');
  });

  it('should create a token with custom "expiresIn"', () => {
    vi.useFakeTimers({ now: new Date('2023-01-06T22:08:00Z') });
    const token = jwt.withExpiresIn(1).create('any_sub');
    const verify = jwt.verify(token);
    expect(verify.iat).toBe(1673042880);
    expect(verify.exp).toBe(1673042881);
    vi.useRealTimers();
  });

  it('should a "Jwt" instance and create different tokens with custom "expiresIn"', () => {
    vi.useFakeTimers({ now: new Date('2023-01-06T22:08:00Z') });

    const token1 = jwt.withExpiresIn(1).create('any_sub');
    const verify1 = jwt.verify(token1);

    expect(verify1.iat).toBe(1673042880);
    expect(verify1.exp).toBe(1673042881);

    const token2 = jwt.create('any_sub');
    const verify2 = jwt.verify(token2);

    expect(verify2.iat).toBe(1673042880);
    expect(verify2.exp).toBe(Date.now() / 1000 + JWT_EXPIRES_IN);

    vi.useRealTimers();
  });

  it('should try to create a token with invalid "sub" and throw an error', () => {
    expect(() => jwt.create('')).toThrow(
      new Error('sub must be a valid string'),
    );
  });

  it('should try to create a token with invalid keys and throw an error', () => {
    const jwt = new Jwt('invalid_private', 'invalid_public');

    try {
      jwt.create('any_sub');
    } catch (e: any) {
      expectUnauthorizedError(e);
      expect(e.code).toBe('JwtCreate');
    }
  });

  it('should validate an already expired token', () => {
    vi.useFakeTimers({ now: new Date('2023-01-06T22:08:00Z') });
    const token = jwt.withExpiresIn(1).create('any_sub');
    vi.useRealTimers();

    try {
      jwt.verify(token);
      throw new Error('should not reach here');
    } catch (e: any) {
      expectUnauthorizedError(e);
      expect(e.code).toBe('JwtExpired');
    }
  });

  it('should validate an invalid token', () => {
    const token = 'invalid_token';

    try {
      jwt.verify(token);
      throw new Error('should not reach here');
    } catch (e: any) {
      expectUnauthorizedError(e);
      expect(e.code).toBe('JwtVerify');
    }
  });
});
