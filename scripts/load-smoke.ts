#!/usr/bin/env bun
/**
 * H6 scale smoke — lightweight load probe (no k6 dependency).
 * Runs concurrent health RPC reads against local Supabase REST.
 */
const base = process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anon = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!anon) {
  console.error('[load-smoke] missing anon key');
  process.exit(1);
}

const url = `${base}/rest/v1/rpc/rpc_get_ops_health_summary`;
const concurrency = Number(process.env.PHONARA_LOAD_SMOKE_CONCURRENCY ?? '20');
const iterations = Number(process.env.PHONARA_LOAD_SMOKE_ITERATIONS ?? '50');

async function oneFetch(i: number): Promise<number> {
  const started = performance.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  if (!res.ok) throw new Error(`request ${i} failed: ${res.status}`);
  await res.json();
  return performance.now() - started;
}

const latencies: number[] = [];
for (let i = 0; i < iterations; i += 1) {
  const batch: Promise<number>[] = [];
  for (let j = 0; j < concurrency && i + j < iterations; j += 1) {
    batch.push(oneFetch(i + j));
  }
  latencies.push(...(await Promise.all(batch)));
  i += concurrency - 1;
}

const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
console.log(
  `[load-smoke] ok concurrency=${concurrency} iterations=${iterations} avg_ms=${avg.toFixed(1)}`,
);
