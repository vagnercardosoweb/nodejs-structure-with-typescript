import { UnprocessableEntityError } from '@/shared/errors';

const REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export class Email {
  constructor(
    protected readonly value: string,
    validateImmediately = true,
  ) {
    this.value = this.value.toLowerCase();
    validateImmediately && this.isValidOrThrow();
  }

  public toString(): string {
    return this.value;
  }

  public isValid(): boolean {
    return REGEX.test(this.value);
  }

  protected isValidOrThrow(): void {
    if (!this.isValid()) {
      throw new UnprocessableEntityError({
        message: `The email "${this.value}" does not have a valid format.`,
        code: 'invalid_email_format',
      });
    }
  }
}
