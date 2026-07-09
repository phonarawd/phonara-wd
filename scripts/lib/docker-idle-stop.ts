/**
 * Stop idle Docker Desktop on session start — frees WSL vmmem RAM without starting stack.
 * Safe when Supabase local is stopped and E2E ports 3000–3002 are free.
 */
import {
  dockerAutoQuitEnabled,
  isDockerDesktopProcessRunning,
  quitDockerDesktopAndReleaseWsl,
} from './docker-desktop-lifecycle';
import { isDockerDaemonReady } from './docker-ready';
import { getBlockedE2ePorts } from './e2e-lifecycle';
import { isLocalSupabaseRunning } from './supabase-local';

export function stopIdleDockerIfSafe(options: { quiet?: boolean } = {}): boolean {
  const { quiet = true } = options;

  if (process.env['PHONARA_KEEP_STACK'] === '1') {
    return false;
  }
  if (!dockerAutoQuitEnabled()) {
    return false;
  }
  if (!isDockerDesktopProcessRunning()) {
    return false;
  }
  if (!isDockerDaemonReady()) {
    return false;
  }
  if (isLocalSupabaseRunning()) {
    return false;
  }
  if (getBlockedE2ePorts().length > 0) {
    return false;
  }

  if (!quiet) {
    process.stdout.write('[cursor:hygiene] idle Docker ON — releasing WSL RAM (on-demand OFF)\n');
  }
  quitDockerDesktopAndReleaseWsl({ quiet });
  return true;
}
