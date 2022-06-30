import jsonwebtoken, { SignOptions, VerifyOptions } from 'jsonwebtoken';

import { Env } from '@/utils/env';

export class Jwt {
	public static async encode(
		payload: any,
		options?: SignOptions,
	): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				resolve(
					jsonwebtoken.sign(payload, Env.required('JWT_PRIVATE_KEY'), {
						algorithm: Env.required('JWT_ALGORITHM'),
						expiresIn: Env.required('JWT_EXPIRE_IN_SECONDS'),
						...options,
					}),
				);
			} catch (err) {
				reject(err);
			}
		});
	}

	public static async decode<T = any>(
		token: string,
		options?: VerifyOptions,
	): Promise<T> {
		return new Promise((resolve, reject) => {
			try {
				resolve(
					jsonwebtoken.verify(token, Env.required('JWT_PUBLIC_KEY'), {
						algorithms: [Env.required('JWT_ALGORITHM')],
						...options,
					}) as T,
				);
			} catch (err) {
				reject(err);
			}
		});
	}
}
