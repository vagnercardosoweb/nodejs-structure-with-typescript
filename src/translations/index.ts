import dottie from 'dottie';

import pt_BR from './pt-br';

export class Translation {
  private static translations: Record<string, any> | null;
  private static fallback = 'pt-br';
  private static locale = 'pt-br';

  public static get(path: string, replaces: Record<string, any> = {}): string {
    let result = this.translations?.[path] ?? path;
    Object.entries(replaces).forEach(([key, value]) => {
      result = result.replace(`{{${key}}}`, value);
    });
    return result;
  }

  public static setLocale(locale: string) {
    locale = locale.trim().toLowerCase();
    this.locale = locale;
    Translation.load();
  }

  public static load() {
    this.translations = { 'pt-br': pt_BR };
    let translation = this.translations?.[this.locale];
    if (!translation) translation = this.translations[this.fallback];
    this.translations = dottie.flatten(translation);
  }
}
