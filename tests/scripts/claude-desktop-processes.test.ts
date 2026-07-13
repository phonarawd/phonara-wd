import { describe, expect, it } from 'vitest';
import {
  CLAUDE_DESKTOP_IMAGE_NAMES,
  isClaudeDesktopImage,
  sumClaudeDesktopRssMb,
} from '../../scripts/lib/claude-desktop-processes';

describe('claude-desktop-processes', () => {
  it('uses image allowlist SOT', () => {
    expect(CLAUDE_DESKTOP_IMAGE_NAMES).toEqual(['claude.exe', 'claude-helper.exe']);
  });

  it('sums entire Claude Desktop process group RSS', () => {
    const stats = sumClaudeDesktopRssMb([
      { imageName: 'claude.exe', workingSetBytes: 400 * 1024 * 1024 },
      { imageName: 'Claude.exe', workingSetBytes: 300 * 1024 * 1024 },
      { imageName: 'claude-helper.exe', workingSetBytes: 100 * 1024 * 1024 },
      { imageName: 'Cursor.exe', workingSetBytes: 900 * 1024 * 1024 },
    ]);
    expect(stats.count).toBe(3);
    expect(stats.mb).toBe(800);
  });

  it('ignores non-Claude images', () => {
    expect(isClaudeDesktopImage('node.exe')).toBe(false);
    expect(
      sumClaudeDesktopRssMb([{ imageName: 'chrome.exe', workingSetBytes: 500 * 1024 * 1024 }]),
    ).toEqual({ mb: 0, count: 0 });
  });
});
