#!/usr/bin/env tsx
/**
 * Merge `supabase gen types` outputs (public + graphql_public) into database.types.ts.
 * Used by gen:types:remote when local Docker/Supabase is unavailable.
 * CI authoritative path remains: supabase db reset → bun run gen:types (local --db-url).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import {
  DATABASE_TYPES_OUTPUT,
  finalizeDatabaseTypesContent,
  sha256DatabaseTypes,
} from './lib/database-types-gen.ts';

const publicPath = process.argv[2];
const graphqlPath = process.argv[3];
if (!publicPath || !graphqlPath) {
  console.error(
    'Usage: tsx scripts/sync-database-types-remote.ts <public-gen.ts> <graphql-gen.ts>',
  );
  process.exit(1);
}

function extractGraphqlBlock(source: string): string {
  const start = source.indexOf('graphql_public: {');
  if (start < 0) throw new Error('graphql_public block missing');
  let depth = 0;
  let i = source.indexOf('{', start);
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }
  throw new Error('graphql_public block unterminated');
}

function readCliGenFile(path: string): string {
  const raw = readFileSync(path);
  if (raw.length >= 2 && raw[0] === 0xff && raw[1] === 0xfe) {
    return raw.toString('utf16le').replace(/^\uFEFF/, '');
  }
  return raw.toString('utf8').replace(/^\uFEFF/, '');
}

const publicFile = readCliGenFile(publicPath);
const graphqlFile = readCliGenFile(graphqlPath);
const graphqlBlock = extractGraphqlBlock(graphqlFile);

let merged = publicFile.trim();
if (!merged.includes('graphql_public')) {
  const publicStart = merged.indexOf('  public: {');
  if (publicStart < 0) {
    throw new Error('Database schema anchors missing in public gen output');
  }
  merged = `${merged.slice(0, publicStart)}  ${graphqlBlock}\n${merged.slice(publicStart)}`;
}

const final = finalizeDatabaseTypesContent(merged);
writeFileSync(DATABASE_TYPES_OUTPUT, final, 'utf8');
console.log(`database-types:remote wrote ${DATABASE_TYPES_OUTPUT}`);
console.log(`database-types:remote sha256 ${sha256DatabaseTypes(final)}`);
console.log(
  'database-types:remote note: CI check:types uses local db reset — run `bun run gen:types` when Docker is available.',
);
