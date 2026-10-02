module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/**/*.test.(ts|tsx)'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp)$': '<rootDir>/__tests__/mocks/image.mock.ts',
    '^@/(.*)$': '<rootDir>/$1',
    '^react-native$': '<rootDir>/__tests__/mocks/react-native.mock.ts',
    '^expo-router$': '<rootDir>/__tests__/mocks/expo-router.mock.ts',
    '^expo-haptics$': '<rootDir>/__tests__/mocks/expo-haptics.mock.ts',
    '^react-native-reanimated$': '<rootDir>/__tests__/mocks/reanimated.mock.ts',
    '^react-native-safe-area-context$': '<rootDir>/__tests__/mocks/safe-area.mock.ts',
    '^@expo/vector-icons$': '<rootDir>/__tests__/mocks/vector-icons.mock.ts',
    '^react-native-svg$': '<rootDir>/__tests__/mocks/svg.mock.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__tests__/mocks/async-storage.mock.ts',
    '^expo-image$': '<rootDir>/__tests__/mocks/expo-image.mock.ts',
    '^react-native-gesture-handler$': '<rootDir>/__tests__/mocks/gesture-handler.mock.ts',
    '^react-native-worklets$': '<rootDir>/__tests__/mocks/worklets.mock.ts',
    '^expo-glass-effect$': '<rootDir>/__tests__/mocks/glass-effect.mock.ts',
    '^expo-secure-store$': '<rootDir>/__tests__/mocks/secure-store.mock.ts',
    '^expo-constants$': '<rootDir>/__tests__/mocks/expo-constants.mock.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        diagnostics: false,
        tsconfig: {
          rootDir: '.',
          jsx: 'react',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
};
