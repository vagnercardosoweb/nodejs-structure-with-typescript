import ptBR from '@/languages/pt-br';
import { Translation } from '@/shared';

export const setupTranslation = () => {
  const translation = new Translation();
  translation.add('pt-br', ptBR);
  return translation;
};
