import type { UserConfig } from 'vite';

/** Shared Vite dev cold-start tuning — web + admin. */
export const PHONARA_VITE_OPTIMIZE_DEPS: NonNullable<UserConfig['optimizeDeps']> = {
  entries: ['src/main.tsx'],
  include: [
    'react',
    'react-dom',
    'react/jsx-dev-runtime',
    'react/jsx-runtime',
    '@tanstack/react-router',
    '@tanstack/react-query',
    '@supabase/supabase-js',
    'zustand',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
    'sonner',
  ],
  // First navigation should not wait for the full module crawl (Vite 6+).
  holdUntilCrawlEnd: false,
};

export const PHONARA_VITE_ESBUILD: NonNullable<UserConfig['esbuild']> = {
  target: 'esnext',
};

/** Pre-transform the shell + landing path so tab open feels instant on low-spec PCs. */
export function phonaraViteDevWarmup(
  appSrcDir: string,
): NonNullable<UserConfig['server']>['warmup'] {
  const root = appSrcDir.replace(/\\/g, '/');
  return {
    clientFiles: [
      `${root}/main.tsx`,
      `${root}/router.ts`,
      `${root}/routes/__root.tsx`,
      `${root}/routes/index.tsx`,
      `${root}/product/i18n/i18n-shell.tsx`,
      `${root}/product/tokens/index.css`,
    ],
  };
}
