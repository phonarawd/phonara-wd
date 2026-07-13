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
    // RPC single-boundary enforcement (ZA-05): every call site must go through
    // the typed `callRpc()` wrapper (apps/*/src/lib/rpc.ts), never call
    // PostgREST RPC directly. Keeps RPC names, payload shapes, and error
    // translation in one place so the UI stays declarative and decoupled from
    // the DB contract. Scope covers routes/components (both apps) AND
    // apps/web features/hooks/domain — the 2026-07-13 Zero Assumption audit
    // found ~25 call sites there that the original routes/components-only
    // scope missed. apps/admin features/hooks/domain are intentionally out of
    // this expansion (separate, unaudited scope — do not lint-fail existing
    // admin call sites as a side effect of the web-scoped ZA-05 fix).
    files: [
      'apps/*/src/routes/**/*.{ts,tsx}',
      'apps/*/src/components/**/*.{ts,tsx}',
      'apps/web/src/features/**/*.{ts,tsx}',
      'apps/web/src/hooks/**/*.{ts,tsx}',
      'apps/web/src/domain/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='rpc'][callee.object.name='supabase']",
          message:
            'Do not call supabase.rpc() directly. Use callRpc() from apps/*/src/lib/rpc.ts instead.',
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
  {
    // One-off Node dev/analysis scripts (not built/shipped) — CommonJS/ESM
    // script globals only, no browser globals.
    files: ['scripts/**/*.mjs', 'scripts/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
      },
    },
  },
);
