import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('check-deploy-parity wiring (H-06)', () => {
  it('package.json routes Pages deploys through deploy-pages.ts without commit-dirty=true', () => {
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    const keys = [
      'deploy:pages:web',
      'deploy:pages:web:preview',
      'deploy:pages:admin',
      'deploy:pages:admin:preview',
    ];
    for (const key of keys) {
      const body = pkg.scripts[key] ?? '';
      expect(body, key).toContain('deploy-pages.ts');
      expect(body, key).not.toContain('commit-dirty=true');
    }
    expect(pkg.scripts['check:deploy-parity']).toContain('check-deploy-parity.ts');
    expect(pkg.scripts['release:manifest']).toContain('write-release-manifest.ts');
  });

  it('deploy-pages.ts forces commit-dirty=false and commit-hash', () => {
    const source = readFileSync(path.join(process.cwd(), 'scripts/deploy-pages.ts'), 'utf8');
    expect(source).toContain('--commit-dirty=false');
    expect(source).toContain('--commit-hash');
    expect(source).toContain('isGitWorkingTreeDirty');
  });
});
