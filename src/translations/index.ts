import dottie from 'dottie';

import { Util } from '@/shared';
import pt_BR from '@/translations/pt-br';

export class Translation {
  private static locale = 'pt-br';
  private static translations: Record<string, any> = { 'pt-br': pt_BR };
  private static loaded: Record<string, boolean> = {};

  public static get(path: string, replaces: Record<string, any> = {}): string {
    let result = this.translations?.[this.locale]?.[path] ?? path;
    Object.entries(replaces).forEach(([key, value]) => {
      result = result.replace(`{{${key}}}`, value);
    });
    return Util.normalizeValue(result);
  }

  public static has(path: string): boolean {
    return !!this.translations?.[this.locale]?.[path];
  }

  public static setLocale(locale: string) {
    locale = locale.trim().toLowerCase();
    if (this.translations?.[locale]) this.locale = locale;
  }

  public static load() {
    const keys = Object.keys(this.translations);
    for (const key of keys) {
      if (this.loaded?.[key]) continue;
      this.translations[key] = dottie.flatten(this.translations[key]);
      this.loaded[key] = true;
    }
  }
}

Translation.load();
