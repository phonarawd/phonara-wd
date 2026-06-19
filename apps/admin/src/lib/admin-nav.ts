/** PHONARA standalone admin routes (ZIP `/admin/*` → apps/admin paths). */
export const ADMIN_ROUTES = {
  overview: '/overview',
  alerts: '/alerts',
  queues: '/queues',
  audit: '/audit',
  operations: '/operations',
  mfaEnroll: '/mfa/enroll',
  mfaChallenge: '/mfa/challenge',
  users: '/users',
  settings: '/settings',
  sports: '/sports',
  casino: '/casino',
  earn: '/earn',
  cms: '/cms',
  login: '/login',
  mfaPolicy: '/mfa/policy',
} as const;

export type AdminRoutePath = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES];

export function isAdminNavActive(pathname: string, to: string): boolean {
  if (to === ADMIN_ROUTES.overview) {
    return pathname === ADMIN_ROUTES.overview || pathname === '/';
  }
  if (to === ADMIN_ROUTES.mfaEnroll) {
    return pathname.startsWith('/mfa');
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}
