import dottie from 'dottie';

import { Common } from '@/shared/common';
import { TranslationData, TranslationInterface } from '@/shared/translation';

export class Translation implements TranslationInterface {
  private translations = new Map<string, TranslationData>();

  public constructor(private locale: string = 'pt-br') {}

  public add(locale: string, data: TranslationData) {
    this.translations.set(locale, dottie.flatten(data));
    return this;
  }

  public has(path: string): boolean {
    return !!this.translations.get(this.locale)?.[path];
  }

  public get(path: string, replaces: TranslationData = {}): string {
    let result = this.translations.get(this.locale)?.[path] ?? path;
    if (Object.keys(replaces).length === 0) return result;
    result = Common.replaceKeysInString(result, replaces);
    return Common.normalizeValue(result);
  }

  public getLocale(): string {
    return this.locale;
  }

  public withLocale(locale: string): Translation {
    locale = locale.trim().toLowerCase();
    if (locale === this.locale) return this;
    if (!this.translations.has(locale)) [locale] = locale.split('-');
    if (!this.translations.has(locale)) return this;
    const clone = Common.cloneObject(this);
    clone.locale = locale;
    return clone;
  }

  public clear() {
    this.translations = new Map();
  }
}
