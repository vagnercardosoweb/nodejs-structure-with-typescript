import { UnprocessableEntityError } from '@/shared/errors';

export const DAY_IN_SECONDS = 86400;
export const MAX_VALID_YEAR = Number(process.env.MAX_VALID_YEAR || '120');

type FormatDateInput = {
  /**
   * Use the words YYYY, MM and DD to format the date.
   *
   * @default 'YYYY-MM-DD'
   */
  format?: 'YYYY-MM-DD' | string;
  timeZone?: string;
};

export const formatOnlyDate = (date: Date, options?: FormatDateInput) => {
  const { timeZone = 'UTC', format = 'YYYY-MM-DD' } = options || {};
  const dateToYmd = Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  }).format(date);
  if (format === 'YYYY-MM-DD') return dateToYmd;
  const [year, month, day] = dateToYmd.split('-');
  return format.replace('YYYY', year).replace('MM', month).replace('DD', day);
};

export const calculateAge = (birthday: Date): number => {
  const today = new Date();
  const age = today.getFullYear() - birthday.getFullYear();
  const month = today.getMonth() - birthday.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birthday.getDate())) {
    return age - 1;
  }
  return age;
};

export const isValidDate = (date: Date) => {
  const isValid = date instanceof Date && !isNaN(date.getTime());
  if (!isValid) return false;
  const yearDiff = new Date().getFullYear() - date.getFullYear();
  return yearDiff <= MAX_VALID_YEAR;
};

export const parseDateFromStringWithoutTimeToUtc = (dateAsString: string) => {
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateAsString)) {
    dateAsString = dateAsString.split('/').reverse().join('-');
  } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateAsString)) {
    dateAsString = dateAsString.split('-').reverse().join('-');
  }

  let date: Date | undefined;
  const match = dateAsString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const [y, m, d] = match?.slice(1, 4).map((n) => Number(n)) ?? [0, 0, 0];
  if (match !== null) date = new Date(y, m - 1, d, 3, 0, 0, 0);

  if (!date || !isValidDate(date)) {
    throw new UnprocessableEntityError({
      message:
        `Invalid date "${dateAsString}", only format` +
        ' "DD/MM/YYYY", "DD-MM-YYYY" and "YYYY-MM-DD" are allowed.',
      sendToSlack: true,
    });
  }

  if (date.getDate() !== d) {
    throw new UnprocessableEntityError({
      message:
        `The date "${dateAsString}" is not valid,` +
        ` the date "${formatOnlyDate(date)}" was generated`,
    });
  }

  return date;
};

export const changeTimezoneFromDate = (
  date: Date,
  timeZone: string = 'UTC',
): Date => {
  return new Date(
    new Intl.DateTimeFormat('en-US', {
      timeZone: process.env.TZ === timeZone ? undefined : timeZone,
      fractionalSecondDigits: 3,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour: 'numeric',
      day: 'numeric',
    }).format(date),
  );
};

export const createNewBrlDate = (date = new Date()): Date =>
  changeTimezoneFromDate(date, 'America/Sao_Paulo');

export const createNewUtcDate = (date = new Date()): Date =>
  changeTimezoneFromDate(date, 'UTC');

export const getNowInSeconds = (): number => {
  return Math.floor(Date.now() / 1000);
};

export const getDiffDays = (start: Date, end: Date): number => {
  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffInMs / (DAY_IN_SECONDS * 1000));
};
