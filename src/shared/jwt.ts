import { Secret, sign, TokenExpiredError, verify } from 'jsonwebtoken';

import { UnauthorizedError } from '@/shared/errors';

export const JWT_EXPIRES_IN = Number(
  process.env.JWT_EXPIRES_IN || 60 * 60 * 24,
);

export class Jwt implements JwtInterface {
  protected expiresIn = JWT_EXPIRES_IN; // 7 days

  public constructor(
    protected readonly privateKey: Secret,
    protected readonly publicKey: Secret,
  ) {}

  public withExpiresIn(expiresIn: number): this {
    this.expiresIn = expiresIn;
    return this;
  }

  public create(sub: string, metadata: Metadata = {}): string {
    if (sub.trim().length === 0) throw new Error('sub must be a valid string');

    const expiresIn = this.expiresIn;
    this.expiresIn = JWT_EXPIRES_IN;

    try {
      return sign(metadata, this.privateKey, {
        expiresIn,
        allowInsecureKeySizes: true,
        algorithm: 'RS256',
        subject: sub,
      });
    } catch (e: any) {
      throw new UnauthorizedError({
        originalError: e,
        code: 'JwtCreate',
      });
    }
  }

  public verify(token: string): JwtVerifyOutput {
    try {
      const decoded = verify(token, this.publicKey, {
        algorithms: ['RS256'],
      }) as JwtVerifyOutput;
      return { ...decoded, token };
    } catch (e: any) {
      throw new UnauthorizedError({
        originalError: e,
        code: e instanceof TokenExpiredError ? 'JwtExpired' : 'JwtVerify',
      });
    }
  }
}

type Metadata = Record<string, any>;
export type JwtVerifyOutput = Metadata & {
  iat: number;
  exp: number;
  token: string;
  sub: any;
};

export interface JwtInterface {
  create(sub: string, metadata?: Metadata): string;
  verify(token: string): JwtVerifyOutput;
}
