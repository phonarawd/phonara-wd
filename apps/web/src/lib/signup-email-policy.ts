/**
 * Signup-only email domain policy (presentation layer).
 * Blocks disposable / high-abuse domains before auth.signUp is called.
 */

/** Exact domains and parent domains (subdomains also blocked). */
const BLOCKED_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  'dispostable.com',
  'dropmail.me',
  'emailondeck.com',
  'fakeinbox.com',
  'getairmail.com',
  'getnada.com',
  'guerrillamail.biz',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'harakirimail.com',
  'inboxkitten.com',
  'maildrop.cc',
  'mailinator.com',
  'mailinator.net',
  'mailinator.org',
  'mailnesia.com',
  'mintemail.com',
  'moakt.com',
  'mohmal.com',
  'mytemp.email',
  'sharklasers.com',
  'spam4.me',
  'temp-mail.org',
  'tempmail.com',
  'tempmail.net',
  'tempmailo.com',
  'throwaway.email',
  'trashmail.com',
  'trashmail.de',
  'trashmail.net',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
]);

/** TLDs overwhelmingly used for throwaway / abuse signup traffic. */
const BLOCKED_TLDS = new Set([
  'buzz',
  'cam',
  'cfd',
  'click',
  'gq',
  'ga',
  'cf',
  'ml',
  'tk',
  'icu',
  'monster',
  'quest',
  'rest',
  'sbs',
  'top',
  'work',
]);

/** Substrings in the full domain that indicate disposable / abuse hosts. */
const BLOCKED_DOMAIN_KEYWORDS = [
  'tempmail',
  'temp-mail',
  'trashmail',
  'throwaway',
  'disposable',
  'fakeinbox',
  'guerrillamail',
  'mailinator',
  'yopmail',
  'sharklasers',
  'getnada',
  'maildrop',
  '10minutemail',
  'minuteinbox',
  'burnermail',
  'discard.email',
  'spambox',
  'fakemail',
  'tmpmail',
  'jetable',
  'mailsac',
  'mailcatch',
  'spamgourmet',
  'mail-temp',
  'tempinbox',
  'tmpbox',
  'anonbox',
  'hidebox',
  'proxymail',
];

export type SignupEmailIssue = 'invalid' | 'blocked';

export function extractSignupEmailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return null;
  return trimmed.slice(at + 1);
}

export function isBlockedSignupEmailDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return true;

  const labels = normalized.split('.');
  const tld = labels[labels.length - 1];
  if (tld && BLOCKED_TLDS.has(tld)) return true;

  if (BLOCKED_DOMAINS.has(normalized)) return true;
  for (const blocked of BLOCKED_DOMAINS) {
    if (normalized === blocked || normalized.endsWith(`.${blocked}`)) return true;
  }

  for (const keyword of BLOCKED_DOMAIN_KEYWORDS) {
    if (normalized.includes(keyword)) return true;
  }

  return false;
}

export function getSignupEmailIssue(
  email: string,
  isFormatValid: (value: string) => boolean,
): SignupEmailIssue | null {
  const trimmed = email.trim();
  if (!trimmed) return null;
  if (!isFormatValid(trimmed)) return 'invalid';

  const domain = extractSignupEmailDomain(trimmed);
  if (!domain || isBlockedSignupEmailDomain(domain)) return 'blocked';

  return null;
}
