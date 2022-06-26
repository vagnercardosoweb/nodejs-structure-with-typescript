import { Num } from './number';

export const normalizeValue = (value: any) => {
	if (Num.isDecimal(value)) {
		return parseFloat(value);
	}

	if (Num.isNumber(value)) {
		return Number(value);
	}

	if (value === 'true') {
		return true;
	}

	if (value === 'false') {
		return false;
	}

	if (value === 'null') {
		return null;
	}

	if (value?.toString() === 'undefined') {
		return undefined;
	}

	return value;
};
