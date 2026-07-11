import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/*.d.ts',
      'scripts/tmp-*.ts',
      '**/.tmp-*/**',
      '**/.tmp-*',
      '**/.paste-intake/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    // RPC single-boundary enforcement: routes/components must go through the
    // domain layer (apps/*/src/domain/**) or hooks, never call PostgREST RPC
    // directly. Keeps RPC names, payload shapes, and error translation in one
    // place so the UI stays declarative and decoupled from the DB contract.
    files: ['apps/*/src/routes/**/*.{ts,tsx}', 'apps/*/src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='rpc'][callee.object.name='supabase']",
          message:
            'Do not call supabase.rpc() directly from routes/components. Add a function in apps/*/src/domain/** (or a hook) and call that instead.',
        },
        {
          selector: 'Literal[value=/\\/rest\\/v1\\/rpc\\//]',
          message:
            'Do not call the PostgREST /rest/v1/rpc/ endpoint directly from routes/components. Use the domain layer (callRpc) instead.',
        },
        {
          selector: 'TemplateElement[value.raw=/\\/rest\\/v1\\/rpc\\//]',
          message:
            'Do not call the PostgREST /rest/v1/rpc/ endpoint directly from routes/components. Use the domain layer (callRpc) instead.',
        },
      ],
    },
  },
  {
    files: ['apps/web/public/**/*.js', 'apps/admin/public/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
  },
);
