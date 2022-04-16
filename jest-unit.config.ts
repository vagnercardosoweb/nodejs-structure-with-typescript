import jestConfig from './jest.config';

jestConfig.displayName = 'unit-test';
jestConfig.testMatch = ['**/*.spec.ts'];

export default jestConfig;
