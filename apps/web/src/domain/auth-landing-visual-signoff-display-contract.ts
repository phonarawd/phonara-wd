/**
 * P3 operator visual sign-off display contract (§20.12 · §22.2 Landing+Auth).
 * Authority: plan §25.12.4–5 · §3.5 platform narrative · viewport 390/768/1024.
 */

import { MARKETING_SHELL_AUTH_ROUTES } from '@/domain/marketing-shell-display-contract';

/** Mandatory operator viewport smoke widths for P3 VISUAL sign-off (§20.12). */
export const AUTH_LANDING_VISUAL_VIEWPORT_WIDTHS = [390, 768, 1024] as const;

export const AUTH_LANDING_VISUAL_ROUTES = ['/', ...MARKETING_SHELL_AUTH_ROUTES] as const;

export type AuthLandingVisualRoute = (typeof AUTH_LANDING_VISUAL_ROUTES)[number];

/** §22.2 Landing — structural checklist ids (automated gate companions). */
export const AUTH_LANDING_LANDING_CHECKLIST = [
  'hero-single-cta',
  'hero-no-fake-phone',
  'cold-start-proof',
  'legal-footer',
  'platform-narrative-pillars',
  'no-casino-hero-copy',
  'cvr-fold-modules',
  'faq-8-plus-3',
  'analytics-funnel-contract',
  'design-release-v1',
] as const;

/** CVR pass Phase 2 — Design Release v1.0 signoff companion ids. */
export const AUTH_LANDING_CVR_SIGNOFF_CHECKLIST = [
  'why-strip',
  'differentiators',
  'mission-preview-fold',
  'wallet-preview',
  'final-cta-after-faq',
] as const;

/** §22.2 Auth — structural checklist ids (automated gate companions). */
export const AUTH_LANDING_AUTH_CHECKLIST = [
  'auth-trust-hierarchy',
  'recovery-always-visible',
  'field-adjacent-errors',
  'desktop-trust-aside',
  'semantic-tokens-only',
] as const;

/** Interactive controls that must wire engine handlers (dead control 0). */
export const AUTH_LANDING_DEAD_CONTROL_TEST_IDS = [
  'login-submit',
  'login-passkey',
  'login-magic-link',
  'signup-submit',
  'signup-resend',
  'reset-submit',
  'reset-resend',
] as const;

/** Preview deploy script for operator sign-off evidence (§30.1). */
export const AUTH_LANDING_VISUAL_PREVIEW_DEPLOY_SCRIPT = 'deploy:pages:web:preview' as const;
