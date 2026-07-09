import { loadRepoEnvFiles } from './load-repo-env';

export const DEFAULT_SITE_URL = 'https://phonara.net';

/** Must match apps/web authCallbackRedirect() targets. */
export const PRODUCTION_REDIRECT_URLS = [
  'http://localhost:3000',
  'http://localhost:3000/auth/callback',
  'http://localhost:3001',
  'http://localhost:3001/auth/callback',
  'http://localhost:3002',
  'http://localhost:3002/auth/callback',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3000/auth/callback',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3001/auth/callback',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3002/auth/callback',
  'https://phonara.net',
  'https://phonara.net/auth/callback',
  'https://www.phonara.net',
  'https://www.phonara.net/auth/callback',
  'https://phonara-web.pages.dev',
  'https://phonara-web.pages.dev/auth/callback',
];

export function productionSiteUrl(): string {
  loadRepoEnvFiles();
  const explicit = process.env.PHONARA_APP_URL?.trim();
  if (explicit) return explicit;

  const vite = process.env.VITE_APP_URL?.trim();
  if (vite && !/localhost|127\.0\.0\.1/.test(vite)) return vite;

  return DEFAULT_SITE_URL;
}

export function buildProductionAuthPatch(): Record<string, unknown> {
  loadRepoEnvFiles();

  const patch: Record<string, unknown> = {
    // Signup + email confirmation (inverse of autoconfirm)
    disable_signup: false,
    external_email_enabled: true,
    mailer_autoconfirm: false,
    mailer_allow_unverified_email_sign_ins: false,
    mailer_secure_email_change_enabled: true,
    secure_password_change_enabled: true,
    password_min_length: 8,
    site_url: productionSiteUrl(),
    uri_allow_list: PRODUCTION_REDIRECT_URLS.join(','),
    jwt_exp: 3600,
    refresh_token_rotation_enabled: true,
  };

  const smtpHost = process.env.SUPABASE_SMTP_HOST?.trim();
  const smtpUser = process.env.SUPABASE_SMTP_USER?.trim();
  const smtpPass = process.env.SUPABASE_SMTP_PASS?.trim();
  const smtpAdmin = process.env.SUPABASE_SMTP_ADMIN_EMAIL?.trim();
  const smtpPort = process.env.SUPABASE_SMTP_PORT?.trim() || '587';

  if (smtpHost && smtpUser && smtpPass && smtpAdmin) {
    patch.smtp_host = smtpHost;
    patch.smtp_port = smtpPort;
    patch.smtp_user = smtpUser;
    patch.smtp_pass = smtpPass;
    patch.smtp_admin_email = smtpAdmin;
    patch.smtp_sender_name = process.env.SUPABASE_SMTP_SENDER_NAME?.trim() || 'PHONARA';
  }

  return patch;
}

export type AuthConfigSnapshot = {
  site_url?: string;
  uri_allow_list?: string;
  disable_signup?: boolean;
  mailer_autoconfirm?: boolean;
  mailer_allow_unverified_email_sign_ins?: boolean;
  external_email_enabled?: boolean;
  password_min_length?: number;
  smtp_host?: string;
  smtp_admin_email?: string;
  smtp_sender_name?: string;
};

export function parseAuthSnapshot(raw: Record<string, unknown>): AuthConfigSnapshot {
  return {
    site_url: typeof raw.site_url === 'string' ? raw.site_url : undefined,
    uri_allow_list: typeof raw.uri_allow_list === 'string' ? raw.uri_allow_list : undefined,
    disable_signup: typeof raw.disable_signup === 'boolean' ? raw.disable_signup : undefined,
    mailer_autoconfirm:
      typeof raw.mailer_autoconfirm === 'boolean' ? raw.mailer_autoconfirm : undefined,
    mailer_allow_unverified_email_sign_ins:
      typeof raw.mailer_allow_unverified_email_sign_ins === 'boolean'
        ? raw.mailer_allow_unverified_email_sign_ins
        : undefined,
    external_email_enabled:
      typeof raw.external_email_enabled === 'boolean' ? raw.external_email_enabled : undefined,
    password_min_length:
      typeof raw.password_min_length === 'number' ? raw.password_min_length : undefined,
    smtp_host: typeof raw.smtp_host === 'string' ? raw.smtp_host : undefined,
    smtp_admin_email: typeof raw.smtp_admin_email === 'string' ? raw.smtp_admin_email : undefined,
    smtp_sender_name: typeof raw.smtp_sender_name === 'string' ? raw.smtp_sender_name : undefined,
  };
}

export function verifyAuthSnapshot(snapshot: AuthConfigSnapshot): string[] {
  const issues: string[] = [];
  const allowList = snapshot.uri_allow_list ?? '';

  if (snapshot.site_url !== DEFAULT_SITE_URL && snapshot.site_url !== productionSiteUrl()) {
    issues.push(`site_url=${snapshot.site_url ?? 'missing'} (expected ${productionSiteUrl()})`);
  }
  if (snapshot.disable_signup === true) issues.push('disable_signup=true');
  if (snapshot.mailer_autoconfirm === true)
    issues.push('mailer_autoconfirm=true (confirmations OFF)');
  if (snapshot.mailer_allow_unverified_email_sign_ins === true) {
    issues.push('mailer_allow_unverified_email_sign_ins=true');
  }
  if (snapshot.external_email_enabled === false) issues.push('external_email_enabled=false');
  if ((snapshot.password_min_length ?? 0) < 8) {
    issues.push(`password_min_length=${snapshot.password_min_length ?? 'missing'}`);
  }
  if (!allowList.includes('https://phonara.net/auth/callback')) {
    issues.push('uri_allow_list missing https://phonara.net/auth/callback');
  }
  if (!snapshot.smtp_host) issues.push('smtp_host missing (Resend not configured on Supabase)');
  if (!snapshot.smtp_admin_email?.includes('phonara.net')) {
    issues.push(`smtp_admin_email=${snapshot.smtp_admin_email ?? 'missing'}`);
  }

  return issues;
}
