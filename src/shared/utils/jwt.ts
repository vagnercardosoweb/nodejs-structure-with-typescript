import jsonwebtoken, {
  Algorithm,
  JwtPayload,
  SignOptions,
  VerifyOptions,
} from 'jsonwebtoken';

import { Env, InternalServerError } from '@/shared';
import { Utils } from '@/shared/utils';

export class Jwt implements JwtInterface {
  private get publicKey() {
    return Utils.base64ToValue(Env.required('JWT_PUBLIC_KEY'));
  }

  private get secretKey() {
    return Utils.base64ToValue(Env.required('JWT_PRIVATE_KEY'));
  }

  private get algorithm(): Algorithm {
    return 'RS256';
  }

  private get expiresIn() {
    const expiresIn7day = 604800;
    return Env.get('JWT_EXPIRES_IN_SECONDS', expiresIn7day);
  }

  private get audience() {
    return Env.required('JWT_AUDIENCE');
  }

  private get issuer() {
    return Env.required('JWT_ISSUER');
  }

  public encode(payload: JwtEncoded, options?: SignOptions): string {
    if (!payload.sub) {
      throw new InternalServerError({
        message: 'Jwt payload.sub is required.',
        metadata: { payload, options },
      });
    }
    return jsonwebtoken.sign(payload, this.secretKey, {
      algorithm: this.algorithm,
      expiresIn: this.expiresIn,
      allowInsecureKeySizes: true,
      audience: this.audience,
      issuer: this.issuer,
      ...options,
    });
  }

  public decode(token: string, options?: VerifyOptions): JwtDecoded {
    const decoded = jsonwebtoken.verify(token, this.publicKey, {
      algorithms: [this.algorithm],
      audience: this.audience,
      issuer: this.issuer,
      ...options,
    }) as JwtDecoded;
    if (!decoded.sub) {
      throw new InternalServerError({
        message: 'Jwt decoded.sub is required.',
        metadata: { decoded, options },
      });
    }
    return decoded;
  }
}

type JwtEncoded = {
  meta?: Record<string, any>;
  sub: any;
};

export interface JwtDecoded extends JwtPayload {
  iat: number;
  exp: number;
  sub: any;
}

export interface JwtInterface {
  encode(payload: JwtEncoded, options?: SignOptions): string;
  decode(token: string, options?: VerifyOptions): JwtDecoded;
}
