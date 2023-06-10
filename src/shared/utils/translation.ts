import dottie from 'dottie';

import { Utils } from './utils';

type Data = Record<string, any>;

export class Translation {
  private locale = 'pt-br';
  private languages = new Map<string, Data>();

  public add(locale: string, data: Data) {
    this.languages.set(locale, dottie.flatten(data));
  }

  public get(path: string, replaces: Data = {}): string {
    let result = this.languages.get(this.locale)?.[path] ?? path;
    const keys = Object.keys(replaces);
    if (keys.length === 0) return result;
    for (const key of keys) {
      result = result.replace(`{{${key}}}`, replaces[key]);
    }
    return Utils.normalizeValue(result);
  }

  public getLocale(): string {
    return this.locale;
  }

  public withLocale(locale: string): Translation {
    const clone = Object.assign(
      Object.create(Object.getPrototypeOf(this)),
      this,
    );
    locale = locale.trim().toLowerCase();
    if (clone.languages.get(locale)) clone.locale = locale;
    return clone;
  }

  public clear() {
    this.languages = new Map();
  }
}
