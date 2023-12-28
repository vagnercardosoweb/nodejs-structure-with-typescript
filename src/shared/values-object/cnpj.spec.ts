import { describe, expect, it } from 'vitest';

import { UnprocessableEntityError } from '@/shared/errors';
import { MaskValue } from '@/shared/mask-value';
import { Cnpj } from '@/shared/values-object/cnpj';

const validCnpj = '52558120000102';
const validCnpjWithMask = MaskValue.create(validCnpj, '##.###.###/####-##');

describe('shared/values-object/cnpj.js', () => {
  it('should check if a cnpj is valid', () => {
    expect(() => new Cnpj(validCnpj)).not.toThrow();
  });

  it('should give an error when validating the last digit of the CNPJ', () => {
    expect(() => new Cnpj(`${validCnpj.slice(0, 12)}49`)).toThrow();
  });

  it('should be an error when validating the penultimate digit of the CNPJ', () => {
    expect(() => new Cnpj(`${validCnpj.slice(0, 12)}91`)).toThrow();
  });

  it('should return true when validating a valid cnpj with mask', () => {
    expect(() => new Cnpj(validCnpjWithMask)).not.toThrow();
  });

  it('should add the mask to the CNPJ provided', () => {
    const cnpj = new Cnpj(validCnpj);
    expect(cnpj.format()).toEqual(validCnpjWithMask);
  });

  it('should remove the mask from the informed CNPJ', () => {
    const cnpj = new Cnpj(validCnpjWithMask);
    expect(cnpj.toString()).toEqual(validCnpj);
  });

  it('should create a valid CNPJ', () => {
    expect(() => Cnpj.generate()).not.toThrow();
  });

  for (let i = 0; i < 10; i += 1) {
    const invalidCnpj = String(i).repeat(11);
    it(`should return an error with repeated numbers in the cnpj "${invalidCnpj}"`, () => {
      expect(() => new Cnpj(invalidCnpj)).toThrow(
        new UnprocessableEntityError({
          message: `CNPJ "${invalidCnpj}" invalid format`,
          code: 'invalid_cnpj_format',
        }),
      );
    });
  }
});
