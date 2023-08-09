import { HttpStatusCode } from '../enums';
import { AppError } from '../errors';

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
    throw new AppError({
      code: 'VALIDATE:EMAIL',
      message: 'Email [{{value}}] entered does not have a valid format',
      statusCode: HttpStatusCode.BAD_REQUEST,
      metadata: { value: this.value },
    });
  }
}
