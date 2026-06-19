import { defineConfig } from 'vitest/config';
import path from 'path';

const root = path.resolve(__dirname);
const webSrc = path.resolve(root, 'apps/web/src');

const packageAliases = {
  '@phonara/shared-types': path.resolve(root, 'packages/shared-types/src'),
  '@phonara/money': path.resolve(root, 'packages/money/src'),
  '@phonara/wallet-ledger': path.resolve(root, 'packages/wallet-ledger/src'),
  '@phonara/trading-engine': path.resolve(root, 'packages/trading-engine/src'),
  '@phonara/game-engine': path.resolve(root, 'packages/game-engine/src'),
  '@phonara/sportsbook-engine': path.resolve(root, 'packages/sportsbook-engine/src'),
  '@phonara/sports-ingest': path.resolve(root, 'packages/sports-ingest/src'),
  '@phonara/i18n': path.resolve(root, 'packages/i18n/src'),
  '@phonara/i18n/react': path.resolve(root, 'packages/i18n/src/react'),
  '@phonara/ui': path.resolve(root, 'packages/ui/src'),
};

export default defineConfig({
  test: {
    /** Low-spec operator PC: single worker avoids CPU thrash + Cursor freeze. */
    maxWorkers: 1,
    pool: 'forks',
    projects: [
      {
        extends: true,
        resolve: {
          alias: packageAliases,
        },
        test: {
          name: 'packages',
          globals: false,
          environment: 'node',
          include: ['packages/**/*.test.ts', 'tests/**/*.test.ts'],
          server: {
            deps: {
              inline: ['decimal.js'],
            },
          },
          coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary'],
            include: ['packages/*/src/**/*.ts'],
            exclude: ['packages/*/src/**/*.test.ts', 'packages/*/src/**/*.d.ts'],
          },
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            '@/games': path.resolve(webSrc, 'components/games'),
            '@': webSrc,
            'react-router-dom': path.resolve(webSrc, 'shims/react-router-dom.tsx'),
            ...packageAliases,
          },
        },
        test: {
          name: 'web',
          globals: false,
          environment: 'jsdom',
          include: ['apps/web/src/**/*.test.{ts,tsx}'],
          setupFiles: [path.resolve(root, 'vitest.web.setup.ts')],
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            '@': path.resolve(root, 'apps/admin/src'),
            ...packageAliases,
          },
        },
        test: {
          name: 'admin',
          globals: false,
          environment: 'jsdom',
          include: ['apps/admin/src/**/*.test.{ts,tsx}'],
          setupFiles: [path.resolve(root, 'vitest.admin.setup.ts')],
        },
      },
    ],
  },
});
