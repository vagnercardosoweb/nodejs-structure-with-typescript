import { UnprocessableEntityError } from '@/shared';

export class Cnpj {
  constructor(
    protected readonly value: string,
    validateImmediately = true,
  ) {
    this.value = this.value.replace(/\.|-|\/|\s/gi, '');
    validateImmediately && this.isValidOrThrow();
  }

  public static generate(): Cnpj {
    let value = '';
    for (let i = 0; i < 12; i += 1) {
      value += Math.floor(Math.random() * 9);
    }
    value += Cnpj.calculateDigit(value, 12);
    value += Cnpj.calculateDigit(value, 13);
    return new Cnpj(value);
  }

  protected static calculateDigit(value: string, length: number): string {
    let sum = 0;
    let position = length - 7;
    for (let i = length; i >= 1; i -= 1) {
      sum += Number(value.charAt(length - i)) * position;
      position -= 1;
      if (position < 2) position = 9;
    }
    const rest = sum % 11;
    return `${rest < 2 ? 0 : 11 - rest}`;
  }

  public toString(): string {
    return this.value;
  }

  public format(): string {
    return this.value.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5',
    );
  }

  public isValid(): boolean {
    if (
      this.value.length !== 14 ||
      this.value.charAt(0).repeat(14) === this.value
    ) {
      return false;
    }
    const validTwelveDigit =
      Cnpj.calculateDigit(this.value, 12) === this.value.charAt(12);
    const validThirteenDigit =
      Cnpj.calculateDigit(this.value, 13) === this.value.charAt(13);
    return validTwelveDigit && validThirteenDigit;
  }

  protected isValidOrThrow(): void {
    if (!this.isValid()) {
      throw new UnprocessableEntityError({
        message: `CNPJ "${this.value}" invalid format`,
        code: 'invalid_cnpj_format',
      });
    }
  }
}
