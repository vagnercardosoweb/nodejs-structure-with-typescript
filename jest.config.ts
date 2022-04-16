import type { Config } from '@jest/types';

const configuration: Config.InitialOptions = {
  bail: true,
  displayName: 'root-test',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  clearMocks: true,
  testEnvironment: 'node',
  coverageProvider: 'babel',
  testMatch: ['**/*.(spec|test).ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/config/setup.ts'],
  coverageDirectory: '<rootDir>/tests/coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  transform: { '^.+\\.ts$': '@swc/jest' },
  moduleNameMapper: {
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    '<rootDir>/src/{modules}/**/*.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};

export default configuration;
