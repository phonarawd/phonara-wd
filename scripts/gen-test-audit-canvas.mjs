import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const rows = JSON.parse(readFileSync('scripts/audit-test-refs-data.json', 'utf8'));
const canvasPath = join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-PC-Desktop-phonara-gb',
  'canvases',
  'test-spec-file-audit.canvas.tsx',
);

const dataLit = JSON.stringify(rows);

const src = `import { Callout, Card, CardBody, CardHeader, Divider, H1, H2, Pill, Row, Stack, Stat, Table, Text } from 'cursor/canvas';

const ROWS = ${dataLit} as Array<{
  file: string;
  classification: 'Keep' | 'Safe to delete';
  hasCodeRef: boolean;
  runner: string;
  refs: string[];
  reason: string;
}>;

const keep = ROWS.filter((r) => r.classification === 'Keep');
const safe = ROWS.filter((r) => r.classification === 'Safe to delete');
const withRef = ROWS.filter((r) => r.hasCodeRef);

export default function TestSpecFileAudit() {
  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <H1>*.test.ts / *.spec.ts reference audit</H1>
        <Text tone="secondary">
          2026-07-14 · code/config path refs + vitest/playwright runner globs · docs/ mentions excluded · *.test.tsx out of scope (174 files)
        </Text>
      </Stack>

      <Row gap={16}>
        <Stat value={String(ROWS.length)} label="Total *.test.ts/*.spec.ts" />
        <Stat value={String(keep.length)} label="Keep" tone="success" />
        <Stat value={String(safe.length)} label="Safe to delete" tone="warning" />
        <Stat value={String(withRef.length)} label="Explicit code path ref" />
      </Row>

      <Callout tone="info" title="Classification">
        Keep = matched by vitest/playwright include, or path string appears in non-test code/config.
        Safe to delete = neither. Unit/E2E tests are almost never imported — runners discover them via globs, so 450 are Keep.
      </Callout>

      <Card>
        <CardHeader trailing={<Pill tone="warning" active>{\`\${safe.length} files\`}</Pill>}>
          Safe to delete (orphan)
        </CardHeader>
        <CardBody>
          <Table
            headers={['File', 'Runner', 'Reason']}
            rows={safe.map((r) => [r.file, r.runner, r.reason])}
            rowTone={safe.map(() => 'warning' as const)}
          />
          <Text tone="secondary" size="small">
            Note: package.json test:engine only lists edge-observability.test.ts. These 5 are outside default vitest include.
            Prefer wiring into a suite over deleting if coverage still matters.
          </Text>
        </CardBody>
      </Card>

      <Divider />

      <H2>Full list (455)</H2>
      <Table
        stickyHeader
        headers={['File', 'Class', 'Code ref', 'Runner', 'Reason']}
        columnAlign={['left', 'left', 'center', 'left', 'left']}
        rows={ROWS.map((r) => [
          r.file,
          r.classification,
          r.hasCodeRef ? 'Yes' : 'No',
          r.runner,
          r.reason,
        ])}
        rowTone={ROWS.map((r) =>
          r.classification === 'Safe to delete' ? ('warning' as const) : undefined,
        )}
      />
    </Stack>
  );
}
`;

writeFileSync(canvasPath, src);
console.log('wrote', canvasPath, 'bytes', Buffer.byteLength(src));
