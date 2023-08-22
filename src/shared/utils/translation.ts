import dottie from 'dottie';

import { Utils } from './utils';

export class Translation implements TranslationInterface {
  private translations = new Map<string, Data>();

  public constructor(private locale: string = 'pt-br') {}

  public add(locale: string, data: Data) {
    this.translations.set(locale, dottie.flatten(data));
    return this;
  }

  public get(path: string, replaces: Data = {}): string {
    let result = this.translations.get(this.locale)?.[path] ?? path;
    if (Object.keys(replaces).length === 0) return result;
    result = Utils.replaceKeysInString(result, replaces);
    return Utils.normalizeValue(result);
  }

  public getLocale(): string {
    return this.locale;
  }

  public withLocale(locale: string): Translation {
    const clone = Utils.cloneObject(this);
    clone.locale = locale.trim().toLowerCase();
    return clone;
  }

  public clear() {
    this.translations = new Map();
  }
}

type Data = Record<string, any>;

export interface TranslationInterface {
  add(locale: string, data: Data): TranslationInterface;
  getLocale(): string;
  withLocale(locale: string): TranslationInterface;
  get(path: string, replaces: Data): string;
  clear(): void;
}
