import { test, expect, type Page } from '@playwright/test';
import {
  adminClient,
  freshenOracle,
  injectBrowserSession,
  readAuth,
  selectTradeTab,
} from './_helpers';

test.setTimeout(120_000);

async function injectTradeSession(page: Page): Promise<void> {
  const auth = readAuth();
  await injectBrowserSession(page, auth.accessToken, auth.refreshToken, {
    unregisterServiceWorkers: true,
  });
}

test.describe('Trade terminal interaction matrix (T-QA-IX) — mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('futures tabs, CTA, sheet, chart', async ({ page }) => {
    await injectTradeSession(page);
    const admin = adminClient();
    await freshenOracle(admin);
    await page.goto('/trade');
    await selectTradeTab(page, 'futures');

    const futuresPanel = page.getByTestId('trade-panel-futures');
    const mobileSurface = futuresPanel.locator('.trade-terminal__mobile-surface');
    await expect(
      mobileSurface.getByTestId('exchange-live-chart'),
    ).toBeVisible({ timeout: 45_000 });

    const tabs = mobileSurface.getByTestId('trade-terminal__mobile-tab');
    await expect(tabs).toHaveCount(4);
    await tabs.nth(1).click();
    await tabs.nth(3).click();

    await page.getByRole('button', { name: /롱|Long/i }).first().click();
    const sheet = page.locator('.trade-terminal__sheet');
    await expect(sheet.getByTestId('futures-open')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });
});

test.describe('Trade terminal — guest i18n (no raw keys)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('futures guest panel shows translated login copy, not key names', async ({ page }) => {
    await page.goto('/trade');
    await selectTradeTab(page, 'futures');

    const futuresPanel = page.getByTestId('trade-panel-futures');
    await expect(futuresPanel).toBeVisible({ timeout: 15_000 });

    const desktopSurface = futuresPanel.locator('.trade-terminal__desktop-surface');
    await expect(desktopSurface).toBeVisible();

    await expect(page.getByText('trade.loginRequired')).toHaveCount(0);
    await expect(
      desktopSurface.getByText(/로그인이 필요합니다|Login required/),
    ).toBeVisible();
    await expect(
      desktopSurface.getByRole('link', { name: /^(로그인|Sign in)$/ }),
    ).toBeVisible();
  });
});

test.describe('Trade terminal interaction matrix (T-QA-IX) — desktop', () => {
  test('futures chart and order ticket', async ({ page }) => {
    await injectTradeSession(page);
    const admin = adminClient();
    await freshenOracle(admin);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/trade');
    await selectTradeTab(page, 'futures');

    const futuresPanel = page.getByTestId('trade-panel-futures');
    const desktopSurface = futuresPanel.locator('.trade-terminal__desktop-surface');
    await expect(
      desktopSurface.getByTestId('exchange-live-chart'),
    ).toBeVisible({ timeout: 45_000 });
    await expect(desktopSurface.getByTestId('futures-open')).toBeVisible();
  });
});
