import {
  Algorithm,
  JwtPayload as JwtPayloadOriginal,
  Secret,
  sign,
  SignOptions,
  verify,
  VerifyOptions,
} from 'jsonwebtoken';

import { InternalServerError } from '@/shared/errors';

export class Jwt implements JwtInterface {
  protected static ALGORITHM: Algorithm = 'RS256';
  protected static EXPIRES_IN = 604800; // 7 days

  public constructor(
    protected readonly privateKey: Secret,
    protected readonly publicKey: Secret,
  ) {}

  public encode(
    input: JwtPayload,
    options?: Omit<SignOptions, 'algorithm'>,
  ): string {
    if (!input.sub) {
      throw new InternalServerError({
        message: 'When creating a token, the "sub" is mandatory.',
        metadata: { input, options },
      });
    }
    const expiresIn = options?.expiresIn ?? Jwt.EXPIRES_IN;
    return sign(input, this.privateKey, {
      expiresIn,
      allowInsecureKeySizes: true,
      ...options,
      algorithm: Jwt.ALGORITHM,
    });
  }

  public decode(
    token: string,
    options?: Omit<VerifyOptions, 'algorithms'>,
  ): JwtDecoded {
    const decoded = verify(token, this.publicKey, {
      ...options,
      algorithms: [Jwt.ALGORITHM],
    }) as JwtDecoded;
    if (!decoded.sub) {
      throw new InternalServerError({
        message: 'When decoding a token, the "sub" is mandatory.',
        metadata: { decoded, options },
      });
    }
    return decoded;
  }
}

export type JwtPayload = JwtPayloadOriginal & { sub: any };
export type JwtDecoded = JwtPayloadOriginal & {
  iat: number;
  exp: number;
  sub: any;
};

export interface JwtInterface {
  encode(payload: JwtPayload, options?: SignOptions): string;
  decode(token: string, options?: VerifyOptions): JwtDecoded;
}
