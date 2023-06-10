import jsonwebtoken, {
  JwtPayload,
  SignOptions,
  VerifyOptions,
} from 'jsonwebtoken';

import { Env } from '@/shared';
import { Utils } from '@/shared/utils';

type EncodePayload = {
  meta: Record<string, any>;
  sub: any;
};

export interface JwtDecoded extends JwtPayload {
  iat: number;
  exp: number;
  sub: any;
}

export class Jwt {
  private static get publicKey() {
    return Utils.base64ToValue(Env.required('JWT_PUBLIC_KEY'));
  }

  private static get secretKey() {
    return Utils.base64ToValue(Env.required('JWT_PRIVATE_KEY'));
  }

  private static get algorithm() {
    return Env.get('JWT_ALGORITHM', 'RS256');
  }

  private static get expiresIn() {
    return Env.get('JWT_EXPIRE_IN_SECONDS', 604800);
  }

  private static get audience() {
    return Env.required('JWT_AUDIENCE');
  }

  private static get issuer() {
    return Env.required('JWT_ISSUER');
  }

  public static encode(payload: EncodePayload, options?: SignOptions): string {
    if (!payload.sub) throw new Error('Jwt payload.sub is required.');
    return jsonwebtoken.sign(
      payload,
      this.secretKey,
      Utils.removeUndefined({
        algorithm: this.algorithm,
        expiresIn: this.expiresIn,
        audience: this.audience,
        issuer: this.issuer,
        ...options,
      }),
    );
  }

  public static decode(token: string, options?: VerifyOptions): JwtDecoded {
    const decoded = jsonwebtoken.verify(
      token,
      this.publicKey,
      Utils.removeUndefined({
        algorithms: [this.algorithm],
        audience: this.audience,
        issuer: this.issuer,
        ...options,
      }),
    ) as JwtDecoded;
    if (!decoded.sub) throw new Error('Jwt decoded.sub is required.');
    return decoded;
  }
}
