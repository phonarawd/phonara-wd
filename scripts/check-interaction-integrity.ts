import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const webUiRoot = join(root, 'apps/web/src/ui');
const webSrc = join(webUiRoot, 'pages');

/** v5 Demolition removed presentation UI; gate resumes when Phase R recreates apps/web/src/ui/**. */
function presentationUiPresent(): boolean {
  return existsSync(webSrc);
}

/** D10 — presentation pages must not ship inert primary CTAs on money/KYC gates. */
const REQUIRED_HANDLERS: Array<{ file: string; pattern: RegExp; reason: string }> = [
  {
    file: 'wallet-page.tsx',
    pattern: /gate\.kyc\.cta[\s\S]*onClick=/,
    reason: 'wallet KYC gate CTA must open KYC flow',
  },
];

/** M0 step 6 — auth pilot surfaces must wire engine handlers (not dead controls). */
const AUTH_ENGINE_WIRING: Array<{ file: string; pattern: RegExp; reason: string }> = [
  {
    file: join(root, 'apps/web/src/ui/auth/login-form.tsx'),
    pattern: /handlePasskeyLogin/,
    reason: 'login passkey CTA must call engine.handlePasskeyLogin',
  },
  {
    file: join(root, 'apps/web/src/ui/auth/login-form.tsx'),
    pattern: /handleMagicLink/,
    reason: 'login magic-link CTA must call engine.handleMagicLink',
  },
  {
    file: join(root, 'apps/web/src/ui/auth/signup-form.tsx'),
    pattern: /data-testid="signup-submit"/,
    reason: 'signup submit control must exist',
  },
  {
    file: join(root, 'apps/web/src/ui/auth/reset-password-form.tsx'),
    pattern: /data-testid="reset-submit"/,
    reason: 'reset submit control must exist',
  },
  {
    file: join(root, 'apps/web/src/ui/auth/terms-panel.tsx'),
    pattern: /data-testid="terms-agree-continue"/,
    reason: 'terms continue control must exist',
  },
];

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith('.tsx')) acc.push(p);
  }
  return acc;
}

export function collectInteractionIntegrityErrors(): string[] {
  if (!presentationUiPresent()) {
    return [];
  }

  const errors: string[] = [];

  for (const rule of REQUIRED_HANDLERS) {
    const path = join(webSrc, rule.file);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, 'utf8');
    if (!rule.pattern.test(src)) {
      errors.push(`${rule.file}: ${rule.reason}`);
    }
  }

  for (const rule of AUTH_ENGINE_WIRING) {
    if (!existsSync(rule.file)) continue;
    const src = readFileSync(rule.file, 'utf8');
    if (!rule.pattern.test(src)) {
      errors.push(`${rule.file.replace(root + '\\', '').replace(root + '/', '')}: ${rule.reason}`);
    }
  }

  for (const file of walk(webSrc)) {
    const rel = file.replace(root + '\\', '').replace(root + '/', '');
    const src = readFileSync(file, 'utf8');
    if (src.includes('onClick={() => {}}') || src.includes('onClick={() => undefined}')) {
      errors.push(`${rel}: empty onClick handler`);
    }
  }

  return errors;
}

export function runInteractionIntegrityCheck(): boolean {
  if (!presentationUiPresent()) {
    process.stdout.write(
      'check:interaction-integrity SKIP — v5 Demolition deleted apps/web/src/ui/**; resumes in Phase R\n',
    );
    return true;
  }

  const errors = collectInteractionIntegrityErrors();
  if (errors.length > 0) {
    process.stderr.write(
      `check:interaction-integrity FAIL\n${errors.map((e) => `- ${e}`).join('\n')}\n`,
    );
    return false;
  }
  process.stdout.write('check:interaction-integrity OK — required gate CTAs wired\n');
  return true;
}

if (process.argv[1]?.includes('check-interaction-integrity')) {
  process.exit(runInteractionIntegrityCheck() ? 0 : 1);
}
