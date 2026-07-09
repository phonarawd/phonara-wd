/**
 * P8 Core hub operator visual sign-off display contract (§20.12 · §22.2 Earn+Home).
 * Authority: plan §25.12.8 · §3.4.2 · viewport 390/768/1024 · Toss/Telegram mini-app scan.
 */

import { EARN_HOME_CANONICAL_ROUTE } from './earn-home-display-contract';
import { P8_CORE_REGISTERED_ROUTES } from '../product/shell/subnav-route-manifest';

/** Mandatory operator viewport smoke widths for P8 VISUAL sign-off (§20.12). */
export const P8_CORE_VISUAL_VIEWPORT_WIDTHS = [390, 768, 1024] as const;

/** Operator smoke routes — `/home` + P8 manifest (§12.19.6). */
export const P8_CORE_VISUAL_ROUTES = [
  EARN_HOME_CANONICAL_ROUTE,
  ...P8_CORE_REGISTERED_ROUTES,
] as const;

export type P8CoreVisualRoute = (typeof P8_CORE_VISUAL_ROUTES)[number];

/** §22.2 Earn+Home · §25.12.8 — structural checklist ids (automated gate companions). */
export const P8_EARN_HOME_CHECKLIST = [
  'card-grid-mission-rows',
  'mission-card-3-state',
  'progress-ring-tier-svg',
  'next-action-border-accent',
  'ambient-ticker-cold-start',
  'entry-grid-four-cards',
  'tabular-nums-rewards',
  'no-dashboard-parallel-hub',
] as const;

/** P8 Core hub surfaces — notifications · settings · account checklist companions. */
export const P8_CORE_HUB_CHECKLIST = [
  'notifications-inbox-hub',
  'notifications-prefs-owner-separated',
  'settings-hub-nav-groups',
  'settings-back-to-account',
  'account-hub-identity-tier',
  'account-profile-edit-form',
  'semantic-tokens-only',
] as const;

/** Interactive controls that must wire navigation or engine handlers (dead control 0). */
export const P8_CORE_DEAD_CONTROL_TEST_IDS = [
  'earn-home-next-action-cta',
  'earn-home-entry-cta-missions',
  'notifications-settings-link',
  'notifications-enable-push',
  'settings-hub-back',
  'settings-hub-link-security',
  'account-hub-link-profile',
  'account-hub-logout',
  'account-profile-save',
] as const;

/** Preview deploy script for operator sign-off evidence (§30.1). */
export const P8_CORE_VISUAL_PREVIEW_DEPLOY_SCRIPT = 'deploy:pages:web:preview' as const;

/** Operator preview URL recorded at VISUAL APPROVED closeout (§20.12). */
export const P8_CORE_VISUAL_PREVIEW_URL = 'https://preview.phonara-web.pages.dev' as const;
