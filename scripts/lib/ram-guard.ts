import { execSync } from 'node:child_process';

export const RAM_CRITICAL_MB = 1024;
export const RAM_WARN_MB = 1228;

export function readRamFreeMb(): number {
  if (process.platform !== 'win32') return 0;
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024,0)"',
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10_000 },
    ).trim();
    return Number.parseInt(raw, 10) || 0;
  } catch {
    return 0;
  }
}

export type RamVerdict = 'ok' | 'warn' | 'critical';

export function checkRam(): { freeMb: number; verdict: RamVerdict; message: string } {
  const freeMb = readRamFreeMb();
  if (freeMb > 0 && freeMb < RAM_CRITICAL_MB) {
    return {
      freeMb,
      verdict: 'critical',
      message: `RAM critical (${freeMb}MB free < ${RAM_CRITICAL_MB}MB) — close Chrome/Docker/Cursor tabs before heavy gates`,
    };
  }
  if (freeMb > 0 && freeMb < RAM_WARN_MB) {
    return {
      freeMb,
      verdict: 'warn',
      message: `RAM low (${freeMb}MB free) — heavy gates may lag; close extra apps`,
    };
  }
  return {
    freeMb,
    verdict: 'ok',
    message: freeMb > 0 ? `RAM OK (${freeMb}MB free)` : 'RAM check skipped (non-Windows)',
  };
}
