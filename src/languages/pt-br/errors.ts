export const errors = {
  page_not_found: 'Página ({{method}} {{path}}) não encontrada',
  method_not_allowed: 'Método ({{method}} {{path}}) não permitido',
  internal_server_error:
    'Ocorreu um erro, tente novamente, se o problema persistir entre em contato com nosso suporte e informe o código "{{errorId}}".',
  unauthorized:
    'Acesso não autorizado, se o problema persistir entre em contato com nosso suporte e informe o código "{{errorId}}".',
  forbidden:
    'Acesso não permitido, se o problema persistir entre em contato com nosso suporte e informe o código "{{errorId}}".',
  unprocessable_entity: 'unprocessable_entity',
  rate_limiter: 'Muitas requisições do IP {{ip}}. Por favor tente mais tarde.',
  not_found: 'not_found',
  not_acceptable: 'not_acceptable',
  gateway_timeout: 'gateway_timeout',
  bad_request: 'bad_request',
  conflict: 'conflict',
};
