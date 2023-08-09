export class Cpf {
  constructor(private readonly value: string) {
    this.value = this.value.replace(/\.|-|\s/gi, '');
    if (!this.isValid()) throw new Error(`CPF [${this.value}] invalid format`);
  }

  public static generate(): Cpf {
    let value = '';
    for (let i = 0; i < 9; i += 1) {
      value += Math.floor(Math.random() * 7);
    }
    value += Cpf.calculateDigit(value, 10);
    value += Cpf.calculateDigit(value, 11);
    return new Cpf(value);
  }

  private static calculateDigit(value: string, length: number): string {
    let sum = 0;
    for (let i = 0; i <= length - 2; i += 1) {
      sum += Number(value.charAt(i)) * (length - i);
    }
    const rest = sum % 11;
    return `${rest < 2 ? 0 : 11 - rest}`;
  }

  public toString(): string {
    return this.value;
  }

  public isValid(): boolean {
    if (
      this.value.length !== 11 ||
      this.value.charAt(0).repeat(11) === this.value
    ) {
      return false;
    }
    const validTenDigit =
      Cpf.calculateDigit(this.value, 10) === this.value.charAt(9);
    const validElevenDigit =
      Cpf.calculateDigit(this.value, 11) === this.value.charAt(10);
    return validTenDigit && validElevenDigit;
  }

  public format(): string {
    return this.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
