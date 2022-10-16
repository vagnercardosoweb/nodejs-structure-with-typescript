import childProcess from 'child_process';
import { randomBytes, randomInt, randomUUID } from 'crypto';
import { promisify } from 'util';

export class Util {
  public static uuid(): string {
    return randomUUID();
  }

  public static ucFirst(value: string): string {
    const first = value.charAt(0).toUpperCase();
    return `${first}${value.slice(1)}`;
  }

  public static stripTags(value: string): string {
    return value.replace(/<[^>]+>/gm, '');
  }

  public static randomStr(length = 16): string {
    let result = '';
    let stringLength = result.length;
    while (stringLength < length) {
      const size = length - stringLength;
      const bytes = randomBytes(size);
      result += Buffer.from(bytes)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, size);
      stringLength = result.length;
    }
    return result;
  }

  public static removeAccents(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f|\u00b4|\u0060|\u005e|\u007e]/g, '');
  }

  public static toCamelCase(value: string): string {
    return value.toLowerCase().replace(/^([A-Z])|[\s-_](\w)/g, (_, p1, p2) => {
      if (p2) {
        return p2.toUpperCase();
      }
      return p1.toLowerCase();
    });
  }

  public static toTitleCase(string: string): string {
    if (!string) return '';
    return string.replace(/\w\S*/g, function replace(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  public static rangeCharacters(startChar: string, endChar: string): string {
    return String.fromCharCode(
      ...this.rangeNumbers(
        endChar.charCodeAt(0) - startChar.charCodeAt(0) + 1,
        startChar.charCodeAt(0),
      ),
    );
  }

  public static rangeNumbers(size: number, start = 0): Array<number> {
    return [...Array(size).keys()].map((i) => i + start);
  }

  public static randomNumber(min: number, max: number): number {
    return randomInt(min, max);
  }

  public static onlyNumber(value: string | number): string {
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

  public normalizeMoney(value: string): number {
    return Number.parseInt(value.replace(/[^0-9-]/g, ''), 10) / 100;
  }

  public static formatMoneyToBrl(
    value: number,
    options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>,
  ): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(value);
  }

  public static async mkdirp(path: string): Promise<void> {
    await promisify(childProcess.exec)(`mkdir -p ${path}`);
  }

  public static hideKeysFromAnObject(immutableData: any, keys: string[] = []) {
    const payload = { ...immutableData };
    const allKeys = [...keys, 'password', 'password_confirm'];

    Object.entries(payload).forEach(([key, value]) => {
      if (allKeys.includes(key) || String(value).match(/data:image\/(.+);/gm)) {
        payload[key] = '******';
      }
    });

    return payload;
  }

  public static getFirstAndLastName(value: string): {
    firstName: string;
    lastName: string;
  } {
    const slitName = value.split(' ');
    return {
      firstName: slitName[0],
      lastName: slitName
        .slice(1)
        .map((row) => row.trim())
        .join(' ')
        .trim(),
    };
  }

  public static calculateAge(birthday: Date): number {
    const today = new Date();
    const age = today.getFullYear() - birthday.getFullYear();
    const month = today.getMonth() - birthday.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthday.getDate())) {
      return age - 1;
    }
    return age;
  }

  public static parseBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
  }

  public static strLimit(
    value: string,
    limit?: number,
    endLine?: '...',
  ): string {
    const strLength = value.replace(/\s/g, '').length;
    if (limit && strLength > limit) {
      return value.substring(0, limit) + endLine;
    }
    return value;
  }

  public static async sleep(ms = 0): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  public static parseJson(
    json: string | null,
  ): boolean | Record<string, never> {
    if (typeof json !== 'string') {
      json = JSON.stringify(json);
    }
    try {
      json = JSON.parse(json);
    } catch (e) {
      return false;
    }
    if (typeof json === 'object' && json !== null) {
      return json;
    }
    return false;
  }
}
