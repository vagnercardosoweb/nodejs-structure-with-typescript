import jsonwebtoken, {
  JwtPayload,
  SignOptions,
  VerifyOptions,
} from 'jsonwebtoken';

import { Env } from '@/shared/env';
import { removeUndefined } from '@/shared/remove-undefined';

type EncodePayload = { sub: any; [key: string]: any };
interface DecodePayload extends JwtPayload {
  iat: number;
  exp: number;
  sub: any;
}

export class Jwt {
  private static get publicKey() {
    return Env.required('JWT_PUBLIC_KEY');
  }

  private static get secretKey() {
    return Env.required('JWT_PRIVATE_KEY');
  }

  private static get algorithm() {
    return Env.get('JWT_ALGORITHM', 'RS256');
  }

  private static get expiresIn() {
    return Env.get('JWT_EXPIRE_IN_SECONDS', 604800);
  }

  private static get audience() {
    return Env.get('JWT_AUDIENCE');
  }

  private static get issuer() {
    return Env.get('JWT_ISSUER');
  }

  public static async encode(
    payload: EncodePayload,
    options?: SignOptions,
  ): Promise<string> {
    if (!payload.sub) throw new Error('Jwt payload.sub is required.');
    return new Promise<string>((resolve, reject) => {
      try {
        resolve(
          jsonwebtoken.sign(
            payload,
            this.secretKey,
            removeUndefined({
              algorithm: this.algorithm,
              expiresIn: this.expiresIn,
              audience: this.audience,
              issuer: this.issuer,
              ...options,
            }),
          ),
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  public static async decode(
    token: string,
    options?: VerifyOptions,
  ): Promise<DecodePayload> {
    return new Promise((resolve, reject) => {
      try {
        const decoded = jsonwebtoken.verify(
          token,
          this.publicKey,
          removeUndefined({
            algorithms: [this.algorithm],
            audience: this.audience,
            issuer: this.issuer,
            ...options,
          }),
        ) as DecodePayload;
        if (!decoded.sub) throw new Error('Jwt decoded.sub is required.');
        resolve(decoded);
      } catch (err) {
        reject(err);
      }
    });
  }
}
