import { describe, expect, it } from 'vitest';

import { UnprocessableEntityError } from '@/shared/errors';
import { MaskValue } from '@/shared/mask-value';
import { Cpf } from '@/shared/values-object';

const validCpf = '63676209079';
const validCpfWithMask = MaskValue.create(validCpf, '###.###.###-##');

describe('shared/values-object/cpf.js', () => {
  it('should check if a cpf is valid', () => {
    expect(() => new Cpf(validCpf)).not.toThrow();
  });

  it('should give an error when validating the last digit of the CPF', () => {
    expect(() => new Cpf(`${validCpf.slice(0, 9)}71`)).toThrow();
  });

  it('should give an error when validating the penultimate digit of the CPF', () => {
    expect(() => new Cpf(`${validCpf.slice(0, 9)}19`)).toThrow();
  });

  it('should return true when validating a valid cpf with mask', () => {
    expect(() => new Cpf(validCpfWithMask)).not.toThrow();
  });

  it('should add the mask to the CPF provided', () => {
    const cpf = new Cpf(validCpf);
    expect(cpf.format()).toEqual(validCpfWithMask);
  });

  it('should remove the mask from the CPF provided', () => {
    const cpf = new Cpf(validCpfWithMask);
    expect(cpf.toString()).toEqual(validCpf);
  });

  it('should create a valid CPF', () => {
    expect(() => Cpf.generate()).not.toThrow();
  });

  for (let i = 0; i < 10; i += 1) {
    const invalidCpf = String(i).repeat(11);
    it(`should return an error with repeated numbers in the cpf "${invalidCpf}"`, () => {
      expect(() => new Cpf(invalidCpf)).toThrow(
        new UnprocessableEntityError({
          message: `CPF "${invalidCpf}" invalid format`,
          code: 'invalid_cpf_format',
        }),
      );
    });
  }
});
