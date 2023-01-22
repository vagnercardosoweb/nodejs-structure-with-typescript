import dottie from 'dottie';

import { Util } from '@/shared';
import pt_BR from '@/translations/pt-br';

const fallback = 'pt-br';
const translations: Record<string, any> = {
  'pt-br': pt_BR,
};

export class Translation {
  private static locale = fallback;
  private static translations: Record<string, any> | null;

  public static get(path: string, replaces: Record<string, any> = {}): string {
    let result = this.translations?.[path] ?? path;
    Object.entries(replaces).forEach(([key, value]) => {
      result = result.replace(`{{${key}}}`, value);
    });
    return Util.normalizeValue(result);
  }

  public static has(path: string): boolean {
    return !!this.translations?.[path];
  }

  public static setLocale(locale: string) {
    locale = locale.trim().toLowerCase();
    this.locale = locale;
    Translation.load();
  }

  public static load() {
    let translation = translations?.[this.locale];
    if (!translation) translation = translations[fallback];
    if (translation) this.translations = dottie.flatten(translation);
  }
}
