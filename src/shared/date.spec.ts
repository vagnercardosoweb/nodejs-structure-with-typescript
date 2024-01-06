import {
  calculateAge,
  changeTimezoneFromDate,
  createNewBrlDate,
  createNewUtcDate,
  formatOnlyDate,
  getDiffDays,
  getNowInSeconds,
  isValidDate,
  parseDateFromStringWithoutTimeToUtc,
} from '@/shared/date';

describe('src/shared/utils/date', () => {
  it.each([
    [new Date('2024-01-01'), true],
    [new Date('2024-102-03'), false],
    [new Date('2024-02-28'), true],
    [new Date('2023-02-28'), true],
    [new Date('2023-02-29'), true],
    [new Date('1900'), false],
    [new Date('a199s'), false],
  ])('isValidDate("%s") should return "%s"', (date, expected) => {
    expect(isValidDate(date)).toBe(expected);
  });

  it.each([
    [new Date('2018-06-16'), 5],
    [new Date('1994-12-15'), 29],
    [new Date('1992-11-05'), 31],
    [new Date('1992-11-05'), 31],
    [new Date('1982-01-01'), 42],
    [new Date('1982-01-02'), 41],
  ])('calculateAge("%s") should return "%s"', (date, expected) => {
    vi.useFakeTimers({ now: new Date('2024-01-01') });
    expect(calculateAge(date)).toEqual(expected);
    vi.useRealTimers();
  });

  it.each([
    [new Date('2024-01-01'), 'YYYY-MM-DD', 'UTC', '2024-01-01'],
    [new Date('2024-01-02'), 'DD-MM-YYYY', 'UTC', '02-01-2024'],
    [new Date('2024-02-03'), 'MM-DD-YYYY', 'UTC', '02-03-2024'],
    [new Date(2024, 0, 1), 'YYYY/MM/DD', 'UTC', '2024/01/01'],
    [new Date(2024, 0, 2), 'DD/MM/YYYY', 'UTC', '02/01/2024'],
    [new Date(2024, 1, 3), 'MM/DD/YYYY', 'UTC', '02/03/2024'],
    [new Date('2024-01-01'), 'YYYY.MM.DD', 'UTC', '2024.01.01'],
    [new Date('2024-01-02'), 'DD.MM.YYYY', 'UTC', '02.01.2024'],
    [new Date('2024-02-03'), 'MM.DD.YYYY', 'UTC', '02.03.2024'],
    [new Date('2024-01-01'), 'YYYY MM DD', 'UTC', '2024 01 01'],
    [new Date('2024-01-02'), 'DD MM YYYY', 'UTC', '02 01 2024'],
    [new Date('2024-02-03'), 'MM DD YYYY', 'UTC', '02 03 2024'],
    [new Date(2024, 0, 1), 'YYYYMMDD', 'UTC', '20240101'],
    [new Date(2024, 0, 2), 'DDMMYYYY', 'UTC', '02012024'],
    [new Date(2024, 1, 3), 'MMDDYYYY', 'UTC', '02032024'],
    [
      new Date('2024-01-01T02:59:59Z'),
      'YYYY-MM-DD',
      'America/Sao_Paulo',
      '2023-12-31',
    ],
    [
      new Date('2024-01-01T03:00:00Z'),
      'YYYY-MM-DD',
      'America/Sao_Paulo',
      '2024-01-01',
    ],
    [
      new Date('2023-12-31T13:00:00Z'),
      'YYYY-MM-DD',
      'Australia/Sydney',
      '2024-01-01',
    ],
    [
      new Date('2023-12-31T12:59:59Z'),
      'YYYY-MM-DD',
      'Australia/Sydney',
      '2023-12-31',
    ],
  ])(
    'formatOnlyDate("%s", "%s") should return "%s"',
    (date, format, timeZone, expected) => {
      expect(formatOnlyDate(date, { format, timeZone })).toBe(expected);
    },
  );

  it.each([
    ['2024-01-01', new Date(2024, 0, 1, 3, 0, 0, 0)],
    ['2024-01-02', new Date(2024, 0, 2, 3, 0, 0, 0)],
    ['01/01/2024', new Date(2024, 0, 1, 3, 0, 0, 0)],
    ['02-01-2024', new Date(2024, 0, 2, 3, 0, 0, 0)],
  ])(
    'parseDateFromStringWithoutTimeToUtc("%s") should return "%s" in success',
    (dateAsString, expected) => {
      expect(parseDateFromStringWithoutTimeToUtc(dateAsString)).toEqual(
        expected,
      );
    },
  );

  it('getNowInSeconds() should return the current time in seconds', () => {
    vi.useFakeTimers({ now: new Date(2024, 0, 1, 0, 0, 0, 0) });
    expect(getNowInSeconds()).toEqual(1704067200);
    vi.useRealTimers();
  });

  it.each([
    [new Date(2024, 0, 1), new Date(2024, 0, 1), 0],
    [new Date(2023, 6, 27), new Date(2024, 0, 1), 158],
    [new Date(2023, 11, 27), new Date(2024, 0, 1), 5],
    [new Date(2024, 0, 1), new Date(2024, 0, 2), 1],
  ])('getDiffDays("%s", "%s") should return "%s"', (date1, date2, expected) => {
    expect(getDiffDays(date1, date2)).toEqual(expected);
  });

  it('createNewBrlDate() should return the current date in Brazil', () => {
    vi.useFakeTimers({ now: new Date('2024-01-01T03:00:00Z') });
    expect(createNewBrlDate()).toEqual(new Date('2024-01-01T00:00:00Z'));
    vi.useRealTimers();
  });

  it('createNewUtcDate() should return the current date in UTC', () => {
    vi.useFakeTimers({ now: new Date('2024-01-01T03:00:00Z') });
    expect(createNewUtcDate()).toEqual(new Date('2024-01-01T03:00:00Z'));
    vi.useRealTimers();
  });

  it('changeTimezoneFromDate(new Date("2024-01-01T03:00:00Z"), "UTC") should return the same date', () => {
    expect(
      changeTimezoneFromDate(new Date('2024-01-01T03:00:00Z'), 'UTC'),
    ).toEqual(new Date('2024-01-01T03:00:00Z'));
  });

  it('changeTimezoneFromDate(new Date("2024-01-01T03:00:00Z"), "America/Sao_Paulo") should return a different date', () => {
    expect(
      changeTimezoneFromDate(
        new Date('2024-01-01T03:00:00Z'),
        'America/Sao_Paulo',
      ),
    ).toEqual(new Date('2024-01-01T00:00:00Z'));
  });

  it('parseDateFromStringWithoutTimeToUtc("2024-01-01T03:00:00Z") should throw an error when invalid format', () => {
    expect(() =>
      parseDateFromStringWithoutTimeToUtc('2024-01-01T03:00:00Z'),
    ).toThrowError(
      'Invalid date "2024-01-01T03:00:00Z", only format "DD/MM/YYYY", "DD-MM-YYYY" and "YYYY-MM-DD" are allowed.',
    );
  });

  it('parseDateFromStringWithoutTimeToUtc("2023-02-29") should throw an error when invalid date', () => {
    expect(() =>
      parseDateFromStringWithoutTimeToUtc('2023-02-29'),
    ).toThrowError(
      'The date "2023-02-29" is not valid, the date "2023-03-01" was generated',
    );
  });
});
