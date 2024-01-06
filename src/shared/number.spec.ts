import {
  formatBytes,
  generateNumbers,
  isDecimal,
  isNumber,
  normalizeMoneyFromString,
  onlyNumber,
  randomNumber,
  roundNumber,
  toCents,
  toDecimal,
} from '@/shared/number';

describe('src/shared/utils/number', () => {
  it.each([
    [987.82, 2, 987.82],
    [98231.8621, 2, 98231.86],
    [528.1892, 4, 528.1892],
    [982713.18291123, 2, 982713.18],
    [528372.4898723, 2, 528372.49],
    [8273125.8792193, 5, 8273125.87922],
    [8273125.8792193, 0, 8273126],
    [1.6300000000000001, 2, 1.63],
    [0.5, 0, 1],
    [1.42 + 0.82, 2, 2.24],
    [1.33 + 0.33, 2, 1.66],
    [0.5, 1, 0.5],
    [0.8, 2, 0.8],
  ])('roundNumber(%s, %s) should return %s', (value, decimals, expected) => {
    expect(roundNumber(value, decimals)).toEqual(expected);
  });

  it('randomNumber should return a random number', () => {
    expect(randomNumber(0, 9999)).toBeLessThanOrEqual(9999);
    expect(randomNumber(0, 10)).toBeLessThanOrEqual(10);
  });

  it('generateNumbers should return a range of numbers', () => {
    expect(generateNumbers(0, 5)).toEqual([0, 1, 2, 3, 4, 5]);
    const numbers = generateNumbers(10, 25);
    expect(numbers).toHaveLength(16);
    expect(numbers[numbers.length - 1]).toBe(25);
    expect(numbers[0]).toBe(10);
  });

  it.each([
    [1, '1'],
    ['123.456.789-00', '12345678900'],
    ['1234abcd567890', '1234567890'],
    ['any 987623 value', '987623'],
  ])('onlyNumber("%s") should return "%s"', (value, expected) => {
    expect(onlyNumber(value)).toEqual(expected);
  });

  it.each([
    [111, 1.11],
    [2928, 29.28],
    [198221, 1982.21],
    [871029728, 8710297.28],
    [99976121, 999761.21],
  ])('toDecimal("%s") should return "%s"', (value, expected) => {
    expect(toDecimal(value)).toEqual(expected);
  });

  it.each([
    [1.11, 111],
    [29.28, 2928],
    [1982.21, 198221],
    [8710297.28, 871029728],
    [999761.21, 99976121],
  ])('toCents("%s") should return "%s"', (value, expected) => {
    expect(toCents(value)).toEqual(expected);
  });

  it.each([
    [0, true],
    [1, true],
    ['0', true],
    ['1', true],
    ['abc', false],
    ['1.33', true],
    ['1.33.33', false],
    ['123abc', false],
    ['abc123', false],
  ])('isNumber("%s") should return "%s"', (value, expected) => {
    expect(isNumber(value)).toBe(expected);
  });

  it.each([
    [0, false],
    [1, false],
    ['1.33', true],
    [1.33, true],
    [1.33 + 0.33, true],
    ['1.33.33', false],
    [9999.99, true],
    ['9999.99', true],
    ['abc123.23', false],
    ['123abc.23', false],
  ])('isDecimal("%s") should return "%s"', (value, expected) => {
    expect(isDecimal(value)).toBe(expected);
  });

  it.each([
    ['R$ 1.11', 1.11],
    ['R$ 29,28', 29.28],
    ['R$ 1.982,21', 1982.21],
    ['R$ 999.761,21', 999761.21],
  ])('normalizeMoneyFromString("%s") should return "%s"', (value, expected) => {
    expect(normalizeMoneyFromString(value)).toBe(expected);
  });

  it.each([
    [0, 0, '0 Bytes'],
    [1024, 0, '1 KB'],
    [1024 * 1024, 0, '1 MB'],
    [1024 * 1024 * 1024, 0, '1 GB'],
    [1024 * 1024 * 1024 * 1024, 0, '1 TB'],
    [1024 * 1024 * 1024 * 1024 * 1024, 0, '1 PB'],
    [1024 * 1024 * 1024 * 1024 * 1024 * 1024, 0, '1 EB'],
    [1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024, 0, '1 ZB'],
    [1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024, 0, '1 YB'],
    [1572864, 2, '1.5 MB'],
    [982371721, 2, '936.86 MB'],
    [982371721, -1, '937 MB'],
  ])(
    'formatBytes("%s", "%s") should return "%s"',
    (bytes, decimals, expected) => {
      expect(formatBytes(bytes, decimals)).toBe(expected);
    },
  );
});
