import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/specs/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@prisma/client$': '<rootDir>/../../apps/server/node_modules/@prisma/client',
  },
  testTimeout: 60000,
  verbose: true,
  maxWorkers: 1,
};

export default config;
