import { BadRequestError } from '../errors';

export class Email {
  constructor(private readonly value: string) {
    if (!this.isValid()) {
      throw new BadRequestError({
        message: 'emial.invalid',
      });
    }
  }

  public isValid(): boolean {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(this.value);
  }

  public toString(): string {
    return this.value;
  }
}
