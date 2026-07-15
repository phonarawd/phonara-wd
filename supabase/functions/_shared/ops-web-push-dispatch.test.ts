import {
  buildOpsAdminQueuesClickUrl,
  buildOpsWebPushNotification,
  OPS_WEB_PUSH_DEEP_LINK,
} from './ops-web-push-dispatch.ts';

Deno.test('buildOpsWebPushNotification deep-links to /queues', () => {
  const payload = buildOpsWebPushNotification(
    {
      severity: 'critical',
      summary: 'Reserve ratio low',
      alert_id: 'a1',
      notify_kind: 'immediate',
    },
    [
      {
        user_id: 'u1',
        endpoint: 'https://push.example/1',
        p256dh: 'k',
        auth: 'a',
      },
    ],
  );
  if (payload.url !== OPS_WEB_PUSH_DEEP_LINK) {
    throw new Error(`expected ${OPS_WEB_PUSH_DEEP_LINK}, got ${payload.url}`);
  }
  if (payload.tag !== 'ops-alert:a1') throw new Error(`unexpected tag ${payload.tag}`);
  if (payload.subscriptions.length !== 1) throw new Error('expected 1 subscription');
});

Deno.test('buildOpsAdminQueuesClickUrl joins admin origin', () => {
  const url = buildOpsAdminQueuesClickUrl('https://admin.phonara.example');
  if (url !== 'https://admin.phonara.example/queues') {
    throw new Error(`unexpected click url ${url}`);
  }
  if (buildOpsAdminQueuesClickUrl(undefined) !== null) {
    throw new Error('missing origin must be null');
  }
});
