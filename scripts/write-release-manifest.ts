#!/usr/bin/env tsx
/**
 * Write `/release-manifest.json` into apps/<app>/dist after production build (H-06).
 *
 * Usage:
 *   bun run release:manifest -- --app=web --branch=preview
 *   bun run release:manifest -- --app=admin --branch=main
 *   bun run release:manifest -- --app=all --branch=preview
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import {
  RELEASE_MANIFEST_FILENAME,
  assertReleaseManifest,
  buildReleaseManifest,
  distManifestPath,
  type ReleaseApp,
  type ReleaseBranch,
} from './lib/release-manifest';

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function resolveApps(raw: string | undefined): ReleaseApp[] {
  const v = (raw ?? 'all').toLowerCase();
  if (v === 'all') return ['web', 'admin'];
  if (v === 'web' || v === 'admin') return [v];
  throw new Error(`--app must be web|admin|all (got ${raw})`);
}

function resolveBranch(raw: string | undefined): ReleaseBranch {
  const v = (raw ?? process.env.PHONARA_RELEASE_BRANCH ?? 'preview').toLowerCase();
  if (v === 'main' || v === 'preview') return v;
  throw new Error(`--branch must be main|preview (got ${raw})`);
}

function main(): void {
  const apps = resolveApps(parseArg('app'));
  const branch = resolveBranch(parseArg('branch'));
  const allowDirty = process.argv.includes('--allow-dirty');
  const deploymentId = parseArg('deployment-id') ?? process.env.PHONARA_DEPLOYMENT_ID ?? null;

  for (const app of apps) {
    const distDir = path.dirname(distManifestPath(app));
    if (!existsSync(distDir)) {
      mkdirSync(distDir, { recursive: true });
    }
    const manifest = buildReleaseManifest({
      app,
      branch,
      deploymentId,
    });
    if (manifest.gitDirty && !allowDirty) {
      process.stderr.write(
        `[release:manifest] FAIL — working tree dirty; refuse to stamp ${app} manifest ` +
          `(H-06 clean SHA). Pass --allow-dirty only for local fixture writes.\n`,
      );
      process.exit(1);
    }
    assertReleaseManifest(manifest);
    const outPath = distManifestPath(app);
    writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    process.stdout.write(
      `[release:manifest] wrote ${app}/${RELEASE_MANIFEST_FILENAME} sha=${manifest.releaseShaShort} ` +
        `lock=${manifest.migrationLockHash.slice(0, 12)}… dirty=${manifest.gitDirty}\n`,
    );
  }
}

main();
