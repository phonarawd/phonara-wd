#!/usr/bin/env bun
/**
 * Machine-readable repo folder tree appendix for Master Inventory Audit.
 * Output: docs/audit/REPO_TREE_APPENDIX.txt (+ .json summary)
 */
import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'docs', 'audit');
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.vite',
  'coverage',
  'test-results',
  'playwright-report',
  'blob-report',
  '.turbo',
  '.next',
  'supabase/.temp',
]);

const SKIP_FILE_RE = /\.(tsbuildinfo|eslintcache)$/;

type TreeNode = {
  name: string;
  type: 'dir' | 'file';
  children?: TreeNode[];
};

function shouldSkip(name: string, isDir: boolean): boolean {
  if (SKIP_DIRS.has(name)) return true;
  if (name.startsWith('.') && name !== '.cursor' && name !== '.github' && name !== '.vscode') {
    // keep .cursorrules / .env.example at root via files; skip other dotdirs
    if (isDir && name !== '.cursor' && name !== '.github' && name !== '.vscode') return true;
  }
  if (!isDir && SKIP_FILE_RE.test(name)) return true;
  return false;
}

function walk(dir: string, depth: number, maxDepth: number): TreeNode[] {
  if (depth > maxDepth) return [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  entries.sort((a, b) => a.localeCompare(b));
  const nodes: TreeNode[] = [];
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    const isDir = st.isDirectory();
    if (shouldSkip(name, isDir)) continue;
    if (isDir) {
      nodes.push({
        name: `${name}/`,
        type: 'dir',
        children: walk(full, depth + 1, maxDepth),
      });
    } else {
      nodes.push({ name, type: 'file' });
    }
  }
  return nodes;
}

function renderText(nodes: TreeNode[], prefix = ''): string[] {
  const lines: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const last = i === nodes.length - 1;
    const branch = last ? '└── ' : '├── ';
    lines.push(`${prefix}${branch}${node.name}`);
    if (node.children?.length) {
      const next = prefix + (last ? '    ' : '│   ');
      lines.push(...renderText(node.children, next));
    }
  }
  return lines;
}

function countNodes(nodes: TreeNode[]): { dirs: number; files: number } {
  let dirs = 0;
  let files = 0;
  for (const n of nodes) {
    if (n.type === 'dir') {
      dirs += 1;
      const c = countNodes(n.children ?? []);
      dirs += c.dirs;
      files += c.files;
    } else {
      files += 1;
    }
  }
  return { dirs, files };
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const maxDepth = Number(process.env.PHONARA_TREE_MAX_DEPTH ?? '6');
  const children = walk(ROOT, 0, maxDepth);
  const counts = countNodes(children);
  const generatedAt = new Date().toISOString();

  const text = [
    `# PHONARA Repository Tree Appendix`,
    `# Generated: ${generatedAt}`,
    `# Root: ${ROOT}`,
    `# Max depth: ${maxDepth}`,
    `# Excluded: node_modules, dist, .git, coverage, test-results, playwright-report, …`,
    `# Counts: dirs=${counts.dirs} files=${counts.files}`,
    ``,
    `phonara-gb/`,
    ...renderText(children),
    ``,
  ].join('\n');

  const txtPath = join(OUT_DIR, 'REPO_TREE_APPENDIX.txt');
  writeFileSync(txtPath, text, 'utf8');

  const jsonPath = join(OUT_DIR, 'REPO_TREE_APPENDIX.json');
  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        generatedAt,
        root: relative(ROOT, ROOT) || '.',
        maxDepth,
        counts,
        tree: { name: 'phonara-gb/', type: 'dir', children },
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`[tree-appendix] wrote ${relative(ROOT, txtPath).replace(/\\/g, '/')}`);
  console.log(`[tree-appendix] wrote ${relative(ROOT, jsonPath).replace(/\\/g, '/')}`);
  console.log(`[tree-appendix] dirs=${counts.dirs} files=${counts.files} maxDepth=${maxDepth}`);
}

main();
