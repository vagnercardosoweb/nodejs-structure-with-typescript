import { describe, expect } from 'vitest';

import { REDACTED_TEXT, redactRecursiveKeys } from '@/shared/redact-keys';

const createData = () => {
  const imageBase64 =
    'data:image/jpeg;base64,H4sICPsdulsCAHJlYWRtZS50eHQAC0/NSc7PTVUoyVdISixONTPRSy8tKlUEAPCdUNYXAAAA';
  return Object.freeze({
    name: 'any_name',
    password: 'any_password',
    email: 'any_mail@mail.com',
    undefinedValue: undefined,
    nullValue: null,
    testObject: {
      name: 'any_name',
      password: 'any_password',
      email: 'any_mail@mail.com',
    },
    nestedObject: {
      name: 'any_name',
      password: 'any_password',
      credentials: {
        password: 'any_password',
      },
    },
    arrayAsString: ['one', 'two'],
    arrayAsNumber: [1, 2],
    arrayAsObject: [
      {
        name: 'any_name',
        email: 'any_mail@mail.com',
        password: 'any_password',
      },
      {
        name: 'any_name_2',
        email: 'any_mail_2@mail.com',
        password: 'any_password_2',
      },
    ],
    images: {
      document_front: imageBase64,
      document_back: imageBase64,
      facematch: imageBase64,
      liveness: [imageBase64, imageBase64, imageBase64],
    },
  });
};

const dataRedacted = () =>
  Object.freeze({
    name: 'any_name',
    email: 'any_mail@mail.com',
    password: REDACTED_TEXT,
    nullValue: null,
    testObject: {
      name: 'any_name',
      password: REDACTED_TEXT,
      email: 'any_mail@mail.com',
    },
    nestedObject: {
      name: 'any_name',
      password: REDACTED_TEXT,
      credentials: {
        password: REDACTED_TEXT,
      },
    },
    arrayAsString: ['one', 'two'],
    arrayAsNumber: [1, 2],
    arrayAsObject: [
      {
        name: 'any_name',
        email: 'any_mail@mail.com',
        password: REDACTED_TEXT,
      },
      {
        name: 'any_name_2',
        email: 'any_mail_2@mail.com',
        password: REDACTED_TEXT,
      },
    ],
    images: {
      facematch: REDACTED_TEXT,
      document_front: REDACTED_TEXT,
      document_back: REDACTED_TEXT,
      liveness: [REDACTED_TEXT, REDACTED_TEXT, REDACTED_TEXT],
    },
  });

describe('shared/redact-keys', () => {
  it('should return the modified object and keep the original', () => {
    const value = createData();
    const expected = dataRedacted();
    const obfuscateValue = redactRecursiveKeys(value);
    expect(obfuscateValue).deep.equal(expected);
    expect(value).not.deep.equal(expected);
  });

  it('should return the modified object array and keep the original', () => {
    const value = createData();
    const expected = [
      {
        name: 'any_name',
        email: 'any_mail@mail.com',
        password: REDACTED_TEXT,
      },
      {
        name: 'any_name_2',
        email: 'any_mail_2@mail.com',
        password: REDACTED_TEXT,
      },
    ];
    expect(redactRecursiveKeys(value.arrayAsObject)).deep.equal(expected);
    expect(value).not.deep.equal(expected);
  });

  it('should return the modified imageBase64 array and keep the original', () => {
    const value = createData();
    const expected = [REDACTED_TEXT, REDACTED_TEXT, REDACTED_TEXT];
    expect(redactRecursiveKeys(value.images.liveness)).deep.equal(expected);
    expect(value).not.deep.equal(expected);
  });

  it('should not modify the object passed with env[REDACTED_KEYS=]', () => {
    process.env.REDACTED_KEYS = '';
    const value = createData();
    expect(redactRecursiveKeys(value)).deep.equal(value);
  });
});
