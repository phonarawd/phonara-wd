/**
 * Login → Onboarding handoff — Phase 8 display contract.
 * Auth REBUILD routes must funnel incomplete users to `/onboarding` before `/home`.
 *
 * Authority: `MASTER_TODO.md` §Login → Onboarding handoff · `p8-prep-onboarding-handoff`
 */

export const ONBOARDING_HANDOFF_ROUTE = '/onboarding' as const;
export const ONBOARDING_MISSIONS_ROUTE = '/onboarding/missions' as const;
export const ONBOARDING_COMPLETE_ROUTE = '/home' as const;
export const ONBOARDING_STEP_COUNT = 3 as const;

export type OnboardingHandoffSource =
  | 'signup_password'
  | 'login_password'
  | 'login_passkey'
  | 'auth_callback';

export const ONBOARDING_HANDOFF_CONTROLLER_WIRE_STATUS: Readonly<
  Record<OnboardingHandoffSource, 'wired' | 'unwired'>
> = {
  signup_password: 'wired',
  login_password: 'wired',
  login_passkey: 'wired',
  auth_callback: 'wired',
};

export const ONBOARDING_HANDOFF_DESK_SURFACES = [
  'apps/web/src/product/surfaces/login/login-page.tsx',
  'apps/web/src/product/surfaces/signup/signup-page.tsx',
  'apps/web/src/product/surfaces/auth/auth-callback-page.tsx',
  'apps/web/src/product/surfaces/onboarding/onboarding-page.tsx',
  'apps/web/src/product/surfaces/onboarding/onboarding-missions-page.tsx',
] as const;

export function resolvePostAuthDestination(params: {
  userId: string | null | undefined;
  isOnboardingComplete: (userId: string) => boolean;
  explicitNext?: string | null;
  defaultCompleteRoute?: string;
}): string {
  const defaultComplete = params.defaultCompleteRoute ?? ONBOARDING_COMPLETE_ROUTE;
  if (params.explicitNext && params.explicitNext.startsWith('/')) {
    return params.explicitNext;
  }
  if (params.userId && !params.isOnboardingComplete(params.userId)) {
    return ONBOARDING_HANDOFF_ROUTE;
  }
  return defaultComplete;
}
