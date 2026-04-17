const { pathsToModuleNameMapper } = require('ts-jest');
const { defaults } = require('ts-jest/presets');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  ...defaults,
  preset: 'jest-expo',
  verbose: true,
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        isolatedModules: true,
        babelConfig: true,
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist'],
};
