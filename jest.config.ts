import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',

  moduleFileExtensions: ['js', 'json', 'ts'],

  testRegex: '.*\\.spec\\.ts$',

  transform: {
    '^.+\\.(t|j)s$': '@swc/jest',
  },

  transformIgnorePatterns: ['node_modules/(?!(@nestjs|@nestjs\\/.*)/)'],

  testEnvironment: 'node',

  coverageProvider: 'v8',

  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/main.ts',
    '!**/index.ts',
    '!**/*.spec.ts',
    '!**/*.d.ts',
    '!**/auth-request.interface.ts',
  ],

  coverageDirectory: './coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],

  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

export default config;
