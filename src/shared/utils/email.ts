import { BadRequestError } from '@/shared';

const REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export class Email {
  constructor(private readonly value: string) {
    this.value = this.value.toLowerCase();
    this.validate();
  }

  public toString(): string {
    return this.value;
  }

  private validate(): boolean {
    const isValid = REGEX.test(this.value);
    if (isValid) return true;
    throw new BadRequestError({
      code: 'VALIDATE:EMAIL',
      message: 'Email [{{value}}] entered does not have a valid format',
      metadata: { value: this.value },
    });
  }
}
