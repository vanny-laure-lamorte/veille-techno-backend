import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',

  moduleFileExtensions: ['js', 'json', 'ts'],

  testRegex: '.*\\.spec\\.ts$',

  transform: {
    '^.+\\.(t|j)s$': '@swc/jest',
  },

  transformIgnorePatterns: [
    'node_modules/(?!(@nestjs|@nestjs\\/.*)/)',
  ],

  testEnvironment: 'node',

  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],

  coverageDirectory: './coverage',
};

export default config;