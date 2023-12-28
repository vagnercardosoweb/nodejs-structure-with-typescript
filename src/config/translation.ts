import ptBR from '@/languages/pt-br';
import { Translation } from '@/shared/translation';

export const setupTranslation = () => {
  const translation = new Translation();
  translation.add('pt-br', ptBR);
  return translation;
};
