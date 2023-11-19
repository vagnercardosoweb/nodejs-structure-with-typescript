import { describe, expect, it } from 'vitest';

import { MaskValue, UnprocessableEntityError } from '@/shared';

import { Cnpj } from './cnpj';

const validCnpj = '52558120000102';
const validCnpjWithMask = MaskValue.create(validCnpj, '##.###.###/####-##');

describe('Utils CNPJ', () => {
  it('deveria verificar se um cnpj é válido', () => {
    expect(() => new Cnpj(validCnpj)).not.toThrow();
  });

  it('deveria dar erro ao validar o último digito do cnpj', () => {
    expect(() => new Cnpj(`${validCnpj.slice(0, 12)}49`)).toThrow();
  });

  it('deveria dar erro ao validar o penúltimo digito do cnpj', () => {
    expect(() => new Cnpj(`${validCnpj.slice(0, 12)}91`)).toThrow();
  });

  it('deveria retornar true ao validar um cnpj válido com mascara', () => {
    expect(() => new Cnpj(validCnpjWithMask)).not.toThrow();
  });

  it('deveria adicionar a mascara no cnpj informado', () => {
    const cnpj = new Cnpj(validCnpj);
    expect(cnpj.format()).toEqual(validCnpjWithMask);
  });

  it('deveria remover a mascara do cnpj informado', () => {
    const cnpj = new Cnpj(validCnpjWithMask);
    expect(cnpj.toString()).toEqual(validCnpj);
  });

  it('deveria criar um CNPJ válido', () => {
    expect(() => Cnpj.generate()).not.toThrow();
  });

  for (let i = 0; i < 10; i += 1) {
    const invalidCnpj = String(i).repeat(11);
    it(`deveria retornar erro com número repetidos no cnpj: ${invalidCnpj}`, () => {
      expect(() => new Cnpj(invalidCnpj)).toThrow(
        new UnprocessableEntityError({
          message: `CNPJ "${invalidCnpj}" invalid format`,
          code: 'invalid_cnpj_format',
        }),
      );
    });
  }
});
