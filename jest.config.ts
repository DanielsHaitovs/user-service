import { pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',

  roots: ['<rootDir>/src'],

  coverageDirectory: '<rootDir>/coverage',
  moduleFileExtensions: ['js', 'json', 'ts'],
  // testRegex: '.*\\.spec\\.ts$',
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.e2e.spec.ts',
    '<rootDir>/src/**/*.integration.spec.ts',
  ],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },

  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  maxWorkers: '100%',
  testTimeout: 10000,
};
