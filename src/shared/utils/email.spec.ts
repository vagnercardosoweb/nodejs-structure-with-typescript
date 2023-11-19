import { describe, expect, it } from 'vitest';

import { UnprocessableEntityError } from '@/shared';

import { Email } from './email';

describe('Utils E-MAIL', () => {
  it('deveria verificar se o e-mail informado é válido', () => {
    expect(() => new Email('any@email.com')).not.toThrow();
    expect(() => new Email('any@email.com.br')).not.toThrow();
  });

  it('deveria verificar se o e-mail informado não é válido', () => {
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

  it('deveria recuperar o e-mail informado com método toString', () => {
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
