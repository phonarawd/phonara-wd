import {
  buildNtfyPublishUrl,
  ntfyPriorityForSeverity,
  ntfyTagsForPayload,
  normalizeNtfyServer,
} from './ops-ntfy-dispatch.ts';

Deno.test('normalizeNtfyServer trims trailing slash', () => {
  if (normalizeNtfyServer('https://ntfy.sh/') !== 'https://ntfy.sh') {
    throw new Error('expected trimmed server');
  }
});

Deno.test('buildNtfyPublishUrl encodes topic', () => {
  const url = buildNtfyPublishUrl('https://ntfy.sh', 'phonara-ops-test');
  if (url !== 'https://ntfy.sh/phonara-ops-test') throw new Error(`unexpected url ${url}`);
});

Deno.test('ntfyPriorityForSeverity maps critical to urgent', () => {
  if (ntfyPriorityForSeverity('critical') !== '5') throw new Error('critical must be priority 5');
  if (ntfyPriorityForSeverity('warning') !== '3') throw new Error('warning must be priority 3');
});

Deno.test('ntfyTagsForPayload includes digest marker', () => {
  const tags = ntfyTagsForPayload({ notify_kind: 'digest', severity: 'critical' });
  if (!tags.includes('digest')) throw new Error('missing digest tag');
});
