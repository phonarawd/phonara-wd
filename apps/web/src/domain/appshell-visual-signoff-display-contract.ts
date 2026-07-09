/**
 * P6 operator visual sign-off display contract (§20.12 · §12.19.5 AppShell).
 * Authority: plan §25.12.7 · §12.19.4 five-tab IA · viewport 390/768/1024.
 */

/** Mandatory operator viewport smoke widths for P6 VISUAL sign-off (§20.12). */
export const APPSHELL_VISUAL_VIEWPORT_WIDTHS = [390, 768, 1024] as const;

/** Five-tab hub routes for operator smoke (§12.19.4 · BottomNav Tab1 = nav.earn). */
export const APPSHELL_VISUAL_HUB_ROUTES = [
  '/home',
  '/wallet',
  '/trade',
  '/sports',
  '/casino',
] as const;

export type AppshellVisualHubRoute = (typeof APPSHELL_VISUAL_HUB_ROUTES)[number];

/** §12.19.5 AppShell chrome checklist ids (automated gate companions). */
export const APPSHELL_CHROME_CHECKLIST = [
  'bottomnav-56px-safe-area',
  'bottomnav-five-tabs-earn-tab1',
  'bottomnav-active-dot-icon-fill',
  'topbar-56px-no-blur',
  'topbar-avatar-32px',
  'earn-subnav-scroll-snap-48px-chips',
  'desktop-sidenav-240px',
] as const;

/** Interactive chrome controls that must wire navigation (dead control 0). */
export const APPSHELL_DEAD_CONTROL_TEST_IDS = [
  'bottom-nav',
  'app-topbar',
  'topbar-account-avatar',
  'earn-subnav-mobile',
] as const;

/** Preview deploy script for operator sign-off evidence (§30.1). */
export const APPSHELL_VISUAL_PREVIEW_DEPLOY_SCRIPT = 'deploy:pages:web:preview' as const;

/** §12.19.5 CSS token names verified in visual sign-off tests. */
export const APPSHELL_CHROME_CSS_TOKENS = {
  topbarHeight: '--ds-shell-topbar-height',
  bottomnavHeight: '--ds-shell-bottomnav-height',
  earnChipHeight: '--ds-shell-earn-chip-height',
  sidenavExpanded: '--ds-shell-sidenav-expanded',
} as const;
