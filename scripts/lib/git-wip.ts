import { execSync } from 'node:child_process';

/** Logical WIP slices — grouped status + scoped checkpoint support. */
export const WIP_SLICES = [
  {
    id: 'trade',
    label: 'Trade terminal',
    paths: [
      'apps/web/src/components/trade/',
      'apps/web/src/features/trading/',
      'tests/e2e/trade-terminal-interaction.spec.ts',
    ],
  },
  {
    id: 'home',
    label: 'Home (golden-earth / survival)',
    paths: [
      'apps/web/src/components/home/',
      'apps/web/src/hooks/useGoldenEarthTap.ts',
      'apps/web/src/hooks/useScriptedCounter.ts',
      'apps/web/src/hooks/useScriptedParticipantCount.ts',
      'apps/web/src/hooks/useSurvivalCheckin.ts',
      'apps/web/src/hooks/useSurvivalWindow.ts',
    ],
  },
  {
    id: 'shell',
    label: 'Shell / social',
    paths: [
      'apps/web/src/components/shell/',
      'apps/web/src/components/social/',
      'apps/web/src/components/ui/resizable.tsx',
    ],
  },
  {
    id: 'i18n',
    label: 'i18n catalog',
    paths: ['packages/i18n/'],
  },
  {
    id: 'tooling',
    label: 'Tooling / package.json',
    paths: ['package.json'],
  },
] as const;

export type WipSliceId = (typeof WIP_SLICES)[number]['id'];

export type WipStatusLine = {
  path: string;
  code: string;
};

export function git(args: string): string {
  return execSync(`git ${args}`, { encoding: 'utf8' }).trim();
}

export function currentBranch(): string {
  return git('rev-parse --abbrev-ref HEAD');
}

export function parseStatusLines(): WipStatusLine[] {
  const out = git('status --porcelain=v1');
  if (!out) return [];
  return out.split('\n').map((line) => ({
    code: line.slice(0, 2),
    path: line
      .slice(3)
      .replace(/^"(.*)"$/, '$1')
      .replace(/\\"/g, '"'),
  }));
}

export function pathMatchesSlice(filePath: string, slicePaths: readonly string[]): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return slicePaths.some((prefix) => {
    const p = prefix.replace(/\\/g, '/');
    if (p.endsWith('/')) return normalized.startsWith(p);
    return normalized === p || normalized.startsWith(`${p}/`);
  });
}

export function classifyStatus(lines: WipStatusLine[]): Map<string, WipStatusLine[]> {
  const buckets = new Map<string, WipStatusLine[]>();
  for (const slice of WIP_SLICES) buckets.set(slice.id, []);
  buckets.set('other', []);

  for (const line of lines) {
    const match = WIP_SLICES.find((slice) => pathMatchesSlice(line.path, slice.paths));
    buckets.get(match?.id ?? 'other')!.push(line);
  }
  return buckets;
}

export function isProtectedBranch(branch: string): boolean {
  return branch === 'main' || branch === 'master';
}

export function defaultWipBranchName(topic?: string): string {
  const slug =
    topic
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'trade-terminal-surfaces';
  return `wip/${slug}`;
}

export function assertOnWipBranch(branch: string): void {
  if (isProtectedBranch(branch)) {
    process.stderr.write(`[wip] FAIL: protected branch "${branch}". Run: bun run wip:branch\n`);
    process.exit(1);
  }
}
