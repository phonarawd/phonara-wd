/**
 * Move dirty WIP off main onto a dedicated branch — standard before long slices.
 */
import { currentBranch, defaultWipBranchName, git, isProtectedBranch } from './lib/git-wip';

const topic = process.argv.slice(2).join(' ').trim() || undefined;
const branch = defaultWipBranchName(topic);
const current = currentBranch();

if (current === branch) {
  process.stdout.write(`[wip:branch] already on ${branch}\n`);
  process.exit(0);
}

if (!isProtectedBranch(current)) {
  process.stdout.write(
    `[wip:branch] already on feature branch "${current}" — no switch (create manually if needed)\n`,
  );
  process.exit(0);
}

try {
  git(`show-ref --verify --quiet refs/heads/${branch}`);
  git(`checkout ${branch}`);
  process.stdout.write(
    `[wip:branch] switched to existing ${branch} (uncommitted changes preserved)\n`,
  );
} catch {
  git(`checkout -b ${branch}`);
  process.stdout.write(
    `[wip:branch] created ${branch} from ${current} (uncommitted changes preserved)\n`,
  );
}

process.stdout.write(
  '[wip:branch] main stays merge-ready; checkpoint with: bun run wip:checkpoint\n',
);
