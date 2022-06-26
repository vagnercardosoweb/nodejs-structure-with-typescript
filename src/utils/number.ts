import { randomInt } from 'crypto';

export class Num {
	public static range(size: number, start = 0): Array<number> {
		return [...Array(size).keys()].map((i) => i + start);
	}

	public static random(min: number, max: number): number {
		return randomInt(min, max);
	}

	public static only(value: string | number): string {
		return `${value}`.replace(/[^\d]/gi, '');
	}

	public static isDecimal(value: string | number): boolean {
		return /^\d+\.\d+$/.test(value?.toString());
	}

	public static isNumber(value: string | number): boolean {
		return /^\d+$/.test(value?.toString());
	}

	public static toCents(value: number): number {
		return Math.round(value * 100);
	}

	public static toDecimal(value: number): number {
		return value / 100;
	}
}
