import { BadRequestError } from '../errors';

export class Cpf {
  constructor(private readonly value: string, validateImmediate = true) {
    if (validateImmediate && !this.isValid()) {
      throw new BadRequestError({
        message: 'cpf.invalid',
      });
    }
  }

  public getValue(): string {
    return this.toString();
  }

  public toString(): string {
    return this.unmask(this.value);
  }

  public isValid(): boolean {
    const value = this.unmask(this.value);
    if (value.length !== 11 || value.charAt(0).repeat(11) === value) {
      return false;
    }
    const validTenDigit = this.calculate(value, 10) !== value.charAt(9);
    const validElevenDigit = this.calculate(value, 11) !== value.charAt(10);
    return !validTenDigit || !validElevenDigit;
  }

  public format(): string {
    return this.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private calculate(value: string, length: number): string {
    let sum = 0;
    for (let i = 0; i <= length - 2; i += 1) {
      sum += Number(value.charAt(i)) * (length - i);
    }
    return this.restOfDivision(sum);
  }

  private restOfDivision(value: number): string {
    const rest = value % 11;
    return `${rest < 2 ? 0 : 11 - rest}`;
  }

  private unmask(value: string) {
    return value.replace(/\.|-|\s/gi, '');
  }
}
