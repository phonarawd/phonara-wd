import { test, expect, type Page } from '@playwright/test';
import { GAME_CONFIGS, casinoGamePath } from '../../apps/web/src/features/casino/game-config';
import { readAuth, SUPABASE_URL } from './_helpers';

interface JwtPayload {
  aud?: string;
  exp?: number;
  role?: string;
}

function authStorageKey(): string {
  return `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
}

function jwtPayload(accessToken: string): JwtPayload {
  const [, payload] = accessToken.split('.');
  if (!payload) return {};
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as JwtPayload;
}

async function seedPreviewSession(page: Page): Promise<void> {
  const auth = readAuth();
  const payload = jwtPayload(auth.accessToken);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = payload.exp ?? now + 3600;

  await page.addInitScript(
    ({ key, session }) => {
      window.localStorage.setItem(key, JSON.stringify(session));
    },
    {
      key: authStorageKey(),
      session: {
        access_token: auth.accessToken,
        refresh_token: auth.refreshToken,
        token_type: 'bearer',
        expires_in: Math.max(expiresAt - now, 0),
        expires_at: expiresAt,
        user: {
          id: auth.userId,
          aud: payload.aud ?? 'authenticated',
          role: payload.role ?? 'authenticated',
          email: auth.email,
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {},
        },
      },
    },
  );
}

test.describe('casino production preview smoke', () => {
  test('all registered casino routes render the bet surface', async ({ page }) => {
    await seedPreviewSession(page);

    for (const game of GAME_CONFIGS) {
      await page.goto(casinoGamePath(game.code), { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`${casinoGamePath(game.code)}$`));
      await expect(page.getByTestId('casino-fairness-verifier')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId('casino-stake-input')).toBeVisible();
      await expect(page.getByTestId('casino-prepare-hash')).toBeVisible();
      await expect(page.getByTestId('casino-place-bet')).toBeVisible();
    }
  });
});
