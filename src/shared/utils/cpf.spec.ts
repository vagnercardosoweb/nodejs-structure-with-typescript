import { describe, expect, it } from 'vitest';

import { Cpf } from './cpf';
import { MaskValue } from './mask-value';

const validCpf = '63676209079';
const validCpfWithMask = MaskValue.create(validCpf, '###.###.###-##');

describe('Utils CPF', () => {
  it('deveria verificar se um cpf é válido', () => {
    expect(() => new Cpf(validCpf)).not.toThrow();
  });

  it('deveria dar erro ao validar o último digito do cpf', () => {
    expect(() => new Cpf(`${validCpf.slice(0, 9)}71`)).toThrow();
  });

  it('deveria dar erro ao validar o penúltimo digito do cpf', () => {
    expect(() => new Cpf(`${validCpf.slice(0, 9)}19`)).toThrow();
  });

  it('deveria retornar true ao validar um cpf válido com mascara', () => {
    expect(() => new Cpf(validCpfWithMask)).not.toThrow();
  });

  it('deveria adicionar a mascara no cpf informado', () => {
    const cpf = new Cpf(validCpf);
    expect(cpf.format()).toEqual(validCpfWithMask);
  });

  it('deveria remover a mascara do cpf informado', () => {
    const cpf = new Cpf(validCpfWithMask);
    expect(cpf.toString()).toEqual(validCpf);
  });

  it('deveriar criar um CPF válido', () => {
    expect(() => Cpf.generate()).not.toThrow();
  });

  for (let i = 0; i < 10; i += 1) {
    const invalidCpf = String(i).repeat(11);
    it(`deveria retornar erro com número repetidos no cpf: ${invalidCpf}`, () => {
      const expectError = `CPF [${invalidCpf}] invalid format`;
      expect(() => new Cpf(invalidCpf)).toThrow(expectError);
    });
  }
});
