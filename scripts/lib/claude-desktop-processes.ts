/** Image allowlist SOT — gate-diagnosis · cursor:status --full share this module. */
export const CLAUDE_DESKTOP_IMAGE_NAMES = ['claude.exe', 'claude-helper.exe'] as const;

export type ClaudeDesktopImageName = (typeof CLAUDE_DESKTOP_IMAGE_NAMES)[number];

export interface WinProcessRow {
  imageName: string;
  workingSetBytes: number;
}

export interface ClaudeDesktopStats {
  mb: number;
  count: number;
}

export function normalizeImageName(imageName: string): string {
  return imageName.trim().toLowerCase();
}

export function isClaudeDesktopImage(imageName: string): boolean {
  const normalized = normalizeImageName(imageName);
  return (CLAUDE_DESKTOP_IMAGE_NAMES as readonly string[]).includes(normalized);
}

export function sumRssMb(processes: readonly WinProcessRow[]): number {
  const bytes = processes.reduce((sum, proc) => sum + Math.max(0, proc.workingSetBytes), 0);
  return Math.round(bytes / (1024 * 1024));
}

export function sumClaudeDesktopRssMb(processes: readonly WinProcessRow[]): ClaudeDesktopStats {
  const matched = processes.filter((proc) => isClaudeDesktopImage(proc.imageName));
  return { mb: sumRssMb(matched), count: matched.length };
}
