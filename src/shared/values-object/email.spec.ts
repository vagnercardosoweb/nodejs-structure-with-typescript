import { describe, expect, it } from 'vitest';

import { UnprocessableEntityError } from '@/shared/errors';

import { Email } from './email';

describe('shared/values-object/email.js', () => {
  it('should check if the email provided is valid', () => {
    expect(() => new Email('any@email.com')).not.toThrow();
    expect(() => new Email('any@email.com.br')).not.toThrow();
  });

  it('should check if the email provided is not valid', () => {
    const values = ['mail', 'mail@', 'mail@domain', '@email', '@email.com'];
    values.forEach((mail) => {
      expect(() => new Email(mail)).toThrow(
        new UnprocessableEntityError({
          message: `The email "${mail}" does not have a valid format.`,
          code: 'invalid_email_format',
        }),
      );
    });
  });

  it('should retrieve the email entered with the toString method', () => {
    const values = [
      'any_mail@mail.com',
      'ANY_MAIL2@MAIL.COM',
      'aNyMail3@MaiL.cOm.Br',
    ];

    values.forEach((mail) => {
      const mailInstance = new Email(mail);
      expect(mailInstance.toString()).toStrictEqual(mail.toLowerCase());
    });
  });
});
