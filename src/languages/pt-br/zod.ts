import { ZodIssueCode } from 'zod';

export const schema = {
  default:
    'Não foi possível validar os dados recebidos, verifique se estão corretos e tente novamente.' +
    ` Se o problema persistir entre em contato com nosso suporte e informe o código "{{errorId}}"`,
  [ZodIssueCode.invalid_type]:
    'O campo "{{path}}" deve ser do tipo "{{expected}}" mais recebeu "{{received}}".',
  [ZodIssueCode.invalid_literal]:
    'O campo "{{path}}" deve ser um literal "{{expected}}" mais recebeu "{{received}}".',
  [ZodIssueCode.unrecognized_keys]:
    'As chaves "{{keys}}" não são reconhecidas no objeto.',
  [ZodIssueCode.not_multiple_of]:
    'O campo "{{path}}" deve ser múltiplo de "{{multipleOf}}".',
  [ZodIssueCode.invalid_string]: {
    default: 'O campo "{{path}}" deve ser um "{{validation}}" válido.',
    includes: 'O campo "{{path}}" deve conter "{{validation.includes}}".',
    startsWith:
      'O campo "{{path}}" deve começar com "{{validation.startsWith}}".',
    endsWith: 'O campo "{{path}}" deve terminar com "{{validation.endsWith}}".',
  },
  [ZodIssueCode.not_finite]: 'O campo "{{path}}" deve ser um número infinito.',
  [ZodIssueCode.invalid_intersection_types]:
    'Valores de interseção não poderam ser mesclados.',
  [ZodIssueCode.invalid_date]:
    'A data informada no campo "{{path}}" não é válida.',
  [ZodIssueCode.invalid_enum_value]:
    'O campo "{{path}}" aceita apenas os valores "{{options}}" e recebeu "{{received}}".',
  [ZodIssueCode.invalid_union_discriminator]:
    'O campo "{{path}}" aceita apenas os valores "{{options}}".',
  [ZodIssueCode.too_small]: {
    array: {
      'exact':
        'O campo "{{path}}" deve conter exatamente "{{minimum}}" elemento(s).',
      'inclusive':
        'O campo "{{path}}" deve conter no mínimo "{{minimum}}" elemento(s).',
      'not-inclusive':
        'O campo "{{path}}" deve conter mais de "{{minimum}}" elemento(s).',
    },
    string: {
      'exact':
        'O campo "{{path}}" deve conter exatamente "{{minimum}}" caracter(es).',
      'inclusive':
        'O campo "{{path}}" deve conter pelo menos "{{minimum}}" caracter(es).',
      'not-inclusive':
        'O campo "{{path}}" deve conter mais de "{{minimum}}" caracter(es).',
    },
    number: {
      'exact':
        'O campo "{{path}}" deve conter exatamente "{{minimum}}" caracter(es).',
      'inclusive':
        'O campo "{{path}}" deve ser maior ou igual a "{{minimum}}".',
      'not-inclusive': 'O campo "{{path}}" deve ser maior que "{{minimum}}".',
    },
    date: {
      'exact': 'O campo "{{path}}" deve ser exatamente "{{isoDate}}".',
      'inclusive':
        'O campo "{{path}}" deve ser maior ou igual a "{{isoDate}}".',
      'not-inclusive': 'O campo "{{path}}" deve ser maior que "{{isoDate}}".',
    },
  },
  [ZodIssueCode.too_big]: {
    array: {
      'exact':
        'O campo "{{path}}" deve conter exatamente "{{maximum}}" elemento(s).',
      'inclusive':
        'O campo "{{path}}" deve conter no máximo "{{maximum}}" elemento(s).',
      'not-inclusive':
        'O campo "{{path}}" deve conter menos de "{{maximum}}" elemento(s).',
    },
    string: {
      'exact':
        'O campo "{{path}}" deve conter exatamente "{{maximum}}" caracter(es).',
      'inclusive':
        'O campo "{{path}}" pode conter no máximo "{{maximum}}" caracter(es).',
      'not-inclusive':
        'O campo "{{path}}" deve conter menos que "{{maximum}}" caracter(es).',
    },
    number: {
      'exact':
        'O campo "{{path}}" deve conter exatamente "{{maximum}}" caracter(es).',
      'inclusive':
        'O campo "{{path}}" deve ser menor ou igual a "{{maximum}}".',
      'not-inclusive': 'O campo "{{path}}" deve ser menor que "{{maximum}}".',
    },
    date: {
      'exact': 'O campo "{{path}}" deve ser exatamente "{{isoDate}}".',
      'inclusive':
        'O campo "{{path}}" deve ser menor ou igual a "{{isoDate}}".',
      'not-inclusive': 'O campo "{{path}}" deve ser menor que "{{isoDate}}".',
    },
  },
};
