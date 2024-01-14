import ptBR from '@/languages/pt-br';
import { LoggerInterface } from '@/shared/logger';
import { Translation } from '@/shared/translation';

export const setupTranslation = (logger: LoggerInterface) => {
  logger.info('setup translation');
  const translation = new Translation();
  translation.add('pt-br', ptBR);
  return translation;
};
