import jestConfig from './jest.config';

jestConfig.displayName = 'integration-test';
jestConfig.testMatch = ['**/*.test.ts'];

export default jestConfig;
