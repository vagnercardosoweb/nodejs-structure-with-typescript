export { Translation } from './translation';

export type TranslationData = Record<string, any>;

export interface TranslationInterface {
  add(locale: string, data: TranslationData): TranslationInterface;
  has(path: string): boolean;
  getLocale(): string;
  withLocale(locale: string): TranslationInterface;
  get(path: string, replaces: TranslationData): string;
  clear(): void;
}
