import { currentBranch, isProtectedBranch } from './git-wip';
import { execSync } from 'node:child_process';

const PROTECTED_REMOTE_REFS = new Set(['refs/heads/main', 'refs/heads/master']);

/** Emergency override — operator explicit only. */
export function isMainPushAllowed(): boolean {
  return process.env['PHONARA_ALLOW_MAIN_PUSH'] === '1';
}

export type PrePushRefLine = {
  localRef: string;
  localSha: string;
  remoteRef: string;
  remoteSha: string;
};

export function parsePrePushRefLines(stdin: string): PrePushRefLine[] {
  return stdin
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [localRef, localSha, remoteRef, remoteSha] = line.split(/\s+/);
      return { localRef, localSha, remoteRef, remoteSha };
    })
    .filter((row) => row.localRef && row.remoteRef);
}

export function isBlockedRemoteRef(remoteRef: string): boolean {
  return PROTECTED_REMOTE_REFS.has(remoteRef);
}

export function checkPrePushRefs(lines: PrePushRefLine[]): { allowed: boolean; reason?: string } {
  if (isMainPushAllowed()) return { allowed: true };

  for (const line of lines) {
    if (isBlockedRemoteRef(line.remoteRef)) {
      return {
        allowed: false,
        reason: `Blocked push to protected remote ref ${line.remoteRef}. Use feature branch + PR. Override: PHONARA_ALLOW_MAIN_PUSH=1`,
      };
    }
  }

  return { allowed: true };
}

const PUSH_MAIN_COMMAND_PATTERNS: readonly RegExp[] = [
  /\bgit\s+push\b[^\n]*\s+origin\s+main\b/i,
  /\bgit\s+push\b[^\n]*\s+origin\s+master\b/i,
  /\bgit\s+push\b[^\n]*\s+-u\s+origin\s+main\b/i,
  /\bgit\s+push\b[^\n]*\s+-u\s+origin\s+master\b/i,
  /\bgit\s+push\b[^\n]*\s+[^:]+:main(?:\s|$)/i,
  /\bgit\s+push\b[^\n]*\s+[^:]+:master(?:\s|$)/i,
  /\bgit\s+push\b[^\n]*\s+--all\b/i,
  /\bgit\s+push\b[^\n]*\s+--mirror\b/i,
];

function readCurrentBranchSafe(): string | undefined {
  try {
    return currentBranch();
  } catch {
    return undefined;
  }
}

/** Cursor shell hook — block agent/operator `git push` to main from the IDE terminal. */
export function checkShellPushCommandForHook(command: string): {
  allowed: boolean;
  reason?: string;
} {
  if (isMainPushAllowed()) return { allowed: true };

  if (!/\bgit\s+push\b/i.test(command)) {
    return { allowed: true };
  }

  for (const pattern of PUSH_MAIN_COMMAND_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        reason: `Blocked git push to main/master (hook). Use: bun run git:push  (feature branch only). Override: PHONARA_ALLOW_MAIN_PUSH=1`,
      };
    }
  }

  // Bare `git push` / `git push -u origin` pushes the current branch.
  const barePush =
    /\bgit\s+push(?:\s+-u)?(?:\s+origin)?(?:\s+HEAD)?\s*$/i.test(command.trim()) ||
    /\bgit\s+push\s+-u\s+origin\s+HEAD\s*$/i.test(command.trim());

  if (barePush) {
    const branch = readCurrentBranchSafe();
    if (branch && isProtectedBranch(branch)) {
      return {
        allowed: false,
        reason: `Blocked git push from protected branch "${branch}". Run: bun run wip:branch -- "<topic>" then bun run git:push`,
      };
    }
  }

  return { allowed: true };
}

/** Install helper — verify hook file exists. */
export function gitHooksDir(): string {
  return execSync('git rev-parse --git-path hooks', { encoding: 'utf8' }).trim();
}
