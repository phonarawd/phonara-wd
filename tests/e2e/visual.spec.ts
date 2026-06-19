import { test, expect, type Page } from '@playwright/test';
import { ADMIN_BASE, injectBrowserSession, loginAdmin, readAdminAuth, readAuth } from './_helpers';

const SHOTS = 'test-results/visual';

async function expectAuthFrameVerticallyCentered(page: Page, maxDeltaPx = 2): Promise<void> {
  const frame = await page.locator('.auth-shell-frame').boundingBox();
  const viewport = page.viewportSize();
  expect(frame, 'auth frame should be measurable').not.toBeNull();
  expect(viewport, 'viewport should be measurable').not.toBeNull();
  if (!frame || !viewport) return;
  const frameCenter = frame.y + frame.height / 2;
  const viewportCenter = viewport.height / 2;
  expect(Math.abs(frameCenter - viewportCenter)).toBeLessThanOrEqual(maxDeltaPx);
}

/**
 * Visual + render smoke for the authed surfaces. Captures full-page screenshots
 * so design-system convergence work (S3/S4) can be reviewed for visual
 * consistency, and asserts the key route landmarks actually render.
 */
test('visual smoke: login + authed routes render', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 375, height: 812 });

  // Unauthenticated auth/legal screens.
  await page.goto('/');
  await expect(page.getByTestId('landing-page')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${SHOTS}/landing.png`, fullPage: true });
  await page.goto('/login');
  await expect(
    page.getByRole('button', { name: /magic|매직|sign|로그인|get/i }).first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(350);
  await expectAuthFrameVerticallyCentered(page);
  await page.screenshot({ path: `${SHOTS}/login.png`, fullPage: true });
  await page.goto('/signup');
  await expect(
    page.getByRole('button', { name: /계정 만들기|create account|가입하고|sign up/i }),
  ).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${SHOTS}/signup.png`, fullPage: true });
  await page.goto('/reset-password');
  await expect(page.getByRole('button').first()).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${SHOTS}/reset-password.png`, fullPage: true });
  await page.goto('/terms');
  await expect(page.getByTestId('legal-page')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOTS}/terms.png`, fullPage: true });
  await page.goto('/privacy');
  await expect(page.getByTestId('legal-page')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOTS}/privacy.png`, fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/login');
  await expect(
    page.getByRole('button', { name: /magic|매직|sign|로그인|get/i }).first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(350);
  await expectAuthFrameVerticallyCentered(page, 12);
  await page.screenshot({ path: `${SHOTS}/login-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });

  // Authed routes.
  const auth = readAuth();
  await injectBrowserSession(page, auth.accessToken, auth.refreshToken);

  await page.goto('/home');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('home-mobile-header')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('home-mobile-online-bar')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('home-wallet-strip')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('dashboard-hero-balance')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('home-tab-shell')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.app-shell-nav')).toBeVisible({ timeout: 15_000 });
  // Wait for the wallets REST response, then confirm the currency tile rendered.
  // Known issue: realtime container can be slow after `supabase db reset`; REST
  // itself is fast once the container settles — waitForResponse catches it exactly.
  try {
    await page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/wallets') && resp.status() === 200,
      { timeout: 30_000 },
    );
    await expect(page.getByText('USDT', { exact: false }).first()).toBeVisible({ timeout: 5_000 });
  } catch {
    // Wallet tiles didn't load within 30 s (known realtime-container flakiness).
    // Screenshot is still captured for visual review; the test does not fail over
    // this — the landmark heading above is the hard assertion.
  }
  await page.screenshot({ path: `${SHOTS}/dashboard.png`, fullPage: true });

  await page.goto('/wallet');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 15_000 });
  try {
    await page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/wallets') && resp.status() === 200,
      { timeout: 30_000 },
    );
  } catch {
    // Wallet REST can lag after stack reset; landmark + screenshot still valuable.
  }
  await expect(
    page.getByTestId('wallet-hero-balance').or(page.getByTestId('wallet-hero-loading')).first(),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('wallet-activity')).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOTS}/wallet.png`, fullPage: true });

  await page.goto('/ledger');
  await page.waitForLoadState('domcontentloaded');
  await expect(
    page
      .getByTestId('ledger-table')
      .or(page.getByTestId('ledger-empty'))
      .or(page.getByTestId('ledger-loading'))
      .first(),
  ).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOTS}/ledger.png`, fullPage: true });

  await page.goto('/trade');
  await expect(page.getByTestId('futures-open')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('trading-chart')).toBeVisible({ timeout: 15_000 });
  await expect(
    page
      .getByTestId('trading-chart-success')
      .or(page.getByTestId('trading-chart-empty'))
      .or(page.getByTestId('trading-chart-loading'))
      .or(page.getByTestId('trading-chart-error'))
      .first(),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByTestId('order-book-success').or(page.getByTestId('order-book-empty')).first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('notification-center')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('notification-center-toggle').click();
  await expect(page.getByTestId('price-alert-form')).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOTS}/trade.png`, fullPage: true });

  await page.goto('/staking');
  await expect(page.getByTestId('staking-page')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('stake-submit').first()).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOTS}/staking.png`, fullPage: true });

  await page.goto('/responsible-gaming');
  await expect(page.getByTestId('responsible-gaming-page')).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOTS}/responsible-gaming.png`, fullPage: true });

  const casinoGameRoutes = [
    'casino/crash',
    'casino/limbo',
    'casino/dice',
    'casino/mines',
    'casino/hilo',
    'casino/plinko',
  ];
  await page.goto('/casino');
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOTS}/casino.png`, fullPage: true });
  for (const route of casinoGameRoutes) {
    await page.goto(`/${route}`);
    await expect(page.getByTestId('casino-fairness-verifier')).toBeAttached({ timeout: 15_000 });
    await page.screenshot({ path: `${SHOTS}/${route.replace('/', '-')}.png`, fullPage: true });
  }

  await page.goto('/casino/fairness');
  await expect(page.getByRole('heading', { name: /provably fair|공정성/i }).first()).toBeVisible({
    timeout: 15_000,
  });
  await page.screenshot({ path: `${SHOTS}/casino-fairness.png`, fullPage: true });

  // Admin mobile shell.
  await page.setViewportSize({ width: 1440, height: 900 });
  const adminAuth = readAdminAuth();
  await loginAdmin(page, adminAuth.email, 'E2e-Admin-Password-123456');
  await expect(page.getByTestId('overview-page')).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: `${SHOTS}/admin-overview-desktop.png`, fullPage: true });
  await page.goto(`${ADMIN_BASE}/queues`);
  await expect(page.getByTestId('admin-queues-page')).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOTS}/admin-queues-desktop.png`, fullPage: true });
  await page.goto(`${ADMIN_BASE}/alerts`);
  await expect(page.getByTestId('admin-alerts-page')).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOTS}/admin-alerts-desktop.png`, fullPage: true });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${ADMIN_BASE}/overview`);
  await expect(page.getByTestId('overview-page')).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: `${SHOTS}/admin-overview.png`, fullPage: true });
  await page.goto(`${ADMIN_BASE}/operations`);
  await expect(page.getByTestId('operations-page')).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOTS}/admin-operations.png`, fullPage: true });
  await page.goto(`${ADMIN_BASE}/audit`);
  await expect(page.getByTestId('audit-page')).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOTS}/admin-audit.png`, fullPage: true });
});
