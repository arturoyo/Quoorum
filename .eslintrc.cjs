/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // ═══════════════════════════════════════════════════════════
    // REGLAS CRÍTICAS - PREVENCIÓN DE DEUDA TÉCNICA
    // ═══════════════════════════════════════════════════════════

    // 🚨 TypeScript - ZERO TOLERANCE
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',

    // [ERROR] Console.log - PROHIBIDO EN PRODUCCION
    'no-console': 'error',
    'no-debugger': 'error',
    'no-alert': 'error',

    // [ERROR] Variables sin usar
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],

    // 🚨 Imports
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      },
    ],

    // 🚨 General
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'no-return-await': 'error',
    'require-await': 'error',

    // 🚨 Floating promises
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',

    // ⚠️ Warnings - Mejores prácticas
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.next/',
    'out/',
    'build/',
    'coverage/',
    '*.config.js',
    '*.config.mjs',
    '*.config.ts',
    '*.config.cjs',
  ],
  overrides: [
    // Configuración específica para tests
    {
      files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-console': 'off',
      },
    },
    // Configuración específica para scripts
    {
      files: ['scripts/**/*'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
}
