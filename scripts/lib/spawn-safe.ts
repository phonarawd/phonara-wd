/**
 * Cross-platform child_process helpers — never use shell:true with argv arrays
 * (Node DEP0190 + Windows escaping bugs).
 */
import { spawn, spawnSync, type SpawnOptions, type SpawnSyncOptions } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

let cachedBunExe: string | null = null;

/** Resolve bun.exe directly — avoids npm bun.ps1 shim stderr noise on Windows. */
export function resolveBunExe(): string {
  if (cachedBunExe) return cachedBunExe;
  const fromEnv = process.env.PHONARA_BUN_EXE?.trim();
  if (fromEnv && existsSync(fromEnv)) {
    cachedBunExe = fromEnv;
    return cachedBunExe;
  }
  const candidates =
    process.platform === 'win32'
      ? [
          join(process.env.APPDATA ?? '', 'npm', 'node_modules', 'bun', 'bin', 'bun.exe'),
          join(homedir(), '.bun', 'bin', 'bun.exe'),
        ]
      : [join(homedir(), '.bun', 'bin', 'bun'), '/usr/local/bin/bun'];
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      cachedBunExe = candidate;
      return cachedBunExe;
    }
  }
  cachedBunExe = process.platform === 'win32' ? 'bun.exe' : 'bun';
  return cachedBunExe;
}

type Normalized = { cmd: string; argv: string[] };

function normalizeCommand(command: string, args: string[]): Normalized {
  const base = command.replace(/\.exe$/i, '');
  if (base === 'bun') {
    return { cmd: resolveBunExe(), argv: args };
  }
  if (base === 'bunx') {
    return { cmd: resolveBunExe(), argv: ['x', ...args] };
  }
  if (base === 'supabase') {
    return { cmd: resolveBunExe(), argv: ['x', 'supabase', ...args] };
  }
  return { cmd: command, argv: args };
}

export function spawnSyncSafe(
  command: string,
  args: string[] = [],
  options: SpawnSyncOptions = {},
): ReturnType<typeof spawnSync> {
  const { cmd, argv } = normalizeCommand(command, args);
  return spawnSync(cmd, argv, { ...options, shell: false });
}

export function spawnSafe(
  command: string,
  args: string[] = [],
  options: SpawnOptions = {},
): ReturnType<typeof spawn> {
  const { cmd, argv } = normalizeCommand(command, args);
  return spawn(cmd, argv, { ...options, shell: false });
}

/** `powershell -NoProfile -Command "Start-Sleep ..."` without shell:true. */
export function sleepMs(ms: number): void {
  if (process.platform === 'win32') {
    spawnSyncSafe('powershell.exe', ['-NoProfile', '-Command', `Start-Sleep -Milliseconds ${ms}`], {
      stdio: 'ignore',
    });
    return;
  }
  spawnSyncSafe('sleep', [`${Math.max(1, Math.ceil(ms / 1000))}`], { stdio: 'ignore' });
}
