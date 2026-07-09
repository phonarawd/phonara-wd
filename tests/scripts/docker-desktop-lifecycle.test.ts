import { describe, expect, it } from 'vitest';
import {
  classifyDockerDesktopState,
  resolveDockerQuitStrategy,
} from '../../scripts/lib/docker-desktop-lifecycle';

describe('docker-desktop-lifecycle', () => {
  it('classifies engine ready when daemon responds', () => {
    expect(
      classifyDockerDesktopState({ installed: true, daemonReady: true, uiRunning: true }),
    ).toBe('engine_ready');
  });

  it('classifies zombie UI when tray is open but engine is down', () => {
    expect(
      classifyDockerDesktopState({ installed: true, daemonReady: false, uiRunning: true }),
    ).toBe('zombie_ui');
  });

  it('classifies engine off when fully stopped', () => {
    expect(
      classifyDockerDesktopState({ installed: true, daemonReady: false, uiRunning: false }),
    ).toBe('engine_off');
  });

  it('classifies not installed', () => {
    expect(
      classifyDockerDesktopState({ installed: false, daemonReady: false, uiRunning: false }),
    ).toBe('not_installed');
  });

  it('skips quit when engine is fully off', () => {
    expect(resolveDockerQuitStrategy('engine_off')).toBe('skip');
    expect(resolveDockerQuitStrategy('not_installed')).toBe('skip');
  });

  it('uses lightweight cleanup for zombie UI', () => {
    expect(resolveDockerQuitStrategy('zombie_ui')).toBe('zombie_cleanup');
  });

  it('uses full quit when engine is running', () => {
    expect(resolveDockerQuitStrategy('engine_ready')).toBe('full_quit');
  });
});
