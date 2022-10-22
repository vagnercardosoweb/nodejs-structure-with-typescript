import { BadRequestError } from '../errors';

export class Email {
  constructor(private readonly value: string, validateImmediate = true) {
    if (validateImmediate && !this.isValid()) {
      throw new BadRequestError({
        message: 'emial.invalid',
      });
    }
  }

  public getValue(): string {
    return this.value;
  }

  public isValid(): boolean {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(this.value);
  }

  public toString(): string {
    return this.value;
  }
}
