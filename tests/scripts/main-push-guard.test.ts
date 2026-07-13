import { describe, expect, it } from 'vitest';
import {
  checkPrePushRefs,
  checkShellPushCommandForHook,
  parsePrePushRefLines,
} from '../../scripts/lib/main-push-guard';

describe('main-push-guard', () => {
  it('parses pre-push ref lines', () => {
    const lines = parsePrePushRefLines(
      'refs/heads/phase-r/foo abc123 refs/heads/phase-r/foo 0000000\n',
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]?.remoteRef).toBe('refs/heads/phase-r/foo');
  });

  it('blocks push to refs/heads/main', () => {
    const result = checkPrePushRefs([
      {
        localRef: 'refs/heads/main',
        localSha: 'abc',
        remoteRef: 'refs/heads/main',
        remoteSha: 'def',
      },
    ]);
    expect(result.allowed).toBe(false);
  });

  it('allows push to phase-r feature ref', () => {
    const result = checkPrePushRefs([
      {
        localRef: 'refs/heads/phase-r/da-w2',
        localSha: 'abc',
        remoteRef: 'refs/heads/phase-r/da-w2',
        remoteSha: '0000000',
      },
    ]);
    expect(result.allowed).toBe(true);
  });

  it('blocks git push origin main in shell hook', () => {
    const result = checkShellPushCommandForHook('git push origin main');
    expect(result.allowed).toBe(false);
  });

  it('blocks git push HEAD:main in shell hook', () => {
    const result = checkShellPushCommandForHook('git push origin HEAD:main');
    expect(result.allowed).toBe(false);
  });

  it('allows git push -u origin HEAD for feature branch command shape', () => {
    const result = checkShellPushCommandForHook('git push -u origin HEAD');
    expect(result.allowed).toBe(true);
  });
});
