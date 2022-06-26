import { InternalServerError } from '@/errors';
import { normalizeValue } from '@/utils/normalize-value';

export class Env {
	public static get(key: string, defaultValue?: any) {
		const value = process.env[key] || defaultValue;

		return normalizeValue(value);
	}

	public static set(key: string, value: any) {
		process.env[key] = value;
	}

	public static required(key: string, defaultValue?: any) {
		const value = this.get(key, defaultValue);

		if (!value) {
			throw new InternalServerError({
				message: `Environment variable ${key} is not defined`,
			});
		}

		return value;
	}
}
