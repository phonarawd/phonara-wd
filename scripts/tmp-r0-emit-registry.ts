/**
 * One-shot R0 emitter — delete after use. Generates Finding Registry YAML from audit inventory.
 */
import { writeFileSync } from 'node:fs';

type Profile = 'ui-route' | 'backend-db' | 'type-hygiene';
type Domain =
  | 'Earn'
  | 'Wallet'
  | 'Trade'
  | 'Sports'
  | 'Casino'
  | 'Admin'
  | 'Marketing'
  | 'Auth'
  | 'Platform'
  | 'Security'
  | 'Ops';
type Stage = `R${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`;

type Axes = {
  impact: number;
  likelihood: number;
  exploitability: number;
  customer_impact: number;
  revenue_impact: number;
};

type Row = {
  id: string;
  axes: Axes;
  domain: Domain;
  stage: Stage;
  dod_profile: Profile;
  depends_on?: string[];
  blocked_by?: string[];
  symptom: string;
  owner: string;
  reviewer: string;
  security: string;
  db: string;
  runtime: string;
  owner_path: string;
};

function severityOf(a: Axes): 'CRITICAL' | 'HIGH' | 'MEDIUM' {
  const score = a.impact + a.likelihood + a.exploitability + a.customer_impact + a.revenue_impact;
  if (
    score >= 20 ||
    (a.impact === 5 && a.exploitability >= 4) ||
    (a.impact === 5 && a.customer_impact >= 5 && a.likelihood >= 5)
  ) {
    return 'CRITICAL';
  }
  if (score >= 15) return 'HIGH';
  return 'MEDIUM';
}

const rows: Row[] = [
  {
    id: 'C-01',
    axes: { impact: 5, likelihood: 5, exploitability: 2, customer_impact: 5, revenue_impact: 4 },
    domain: 'Marketing',
    stage: 'R1',
    dod_profile: 'ui-route',
    symptom: '공개 랜딩이 합성 수치를 실제 참여·지급 실적처럼 표시',
    owner: 'marketing',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/domain/landing-member-bot.ts',
  },
  {
    id: 'C-02',
    axes: { impact: 5, likelihood: 5, exploitability: 2, customer_impact: 5, revenue_impact: 3 },
    domain: 'Marketing',
    stage: 'R1',
    dod_profile: 'ui-route',
    depends_on: ['R4-public-status-rpc'],
    symptom: '작업 트리 /status가 원격 장애와 무관하게 전 구성요소 정상 표시',
    owner: 'marketing',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/product/surfaces/marketing/system-status-page.tsx',
  },
  {
    id: 'H-01',
    axes: { impact: 4, likelihood: 5, exploitability: 2, customer_impact: 4, revenue_impact: 3 },
    domain: 'Marketing',
    stage: 'R1',
    dod_profile: 'ui-route',
    symptom: '랜딩 지갑이 1 PHON = 1 KRW로 잘못 환산',
    owner: 'marketing',
    reviewer: 'wallet',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/domain/landing-display-contract.ts',
  },
  {
    id: 'H-02',
    axes: { impact: 5, likelihood: 4, exploitability: 4, customer_impact: 3, revenue_impact: 2 },
    domain: 'Security',
    stage: 'R3',
    dod_profile: 'backend-db',
    depends_on: ['R3-a-wallet-mutator'],
    symptom: '범용 rpc_lock_wallet이 authenticated에 노출',
    owner: 'security',
    reviewer: 'wallet',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'supabase/migrations/',
  },
  {
    id: 'H-03',
    axes: { impact: 4, likelihood: 5, exploitability: 2, customer_impact: 4, revenue_impact: 4 },
    domain: 'Wallet',
    stage: 'R2',
    dod_profile: 'ui-route',
    symptom: 'Crypto rail 노출과 운영 설정(missing_config)이 서로 모순',
    owner: 'wallet',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/domain/launch-gates.ts',
  },
  {
    id: 'H-04',
    axes: { impact: 4, likelihood: 5, exploitability: 2, customer_impact: 3, revenue_impact: 4 },
    domain: 'Trade',
    stage: 'R4',
    dod_profile: 'backend-db',
    depends_on: ['ADR-021-obs-stack'],
    symptom: '시장 대규모 저하인데 edge_ops_events는 ok false-green',
    owner: 'trade',
    reviewer: 'sre',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'supabase/functions/_shared/edge-observability.ts',
  },
  {
    id: 'H-05',
    axes: { impact: 4, likelihood: 5, exploitability: 2, customer_impact: 4, revenue_impact: 3 },
    domain: 'Sports',
    stage: 'R2',
    dod_profile: 'ui-route',
    symptom: '스포츠 배당 337개 stale · betting/cashout built_disabled',
    owner: 'sports',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/product/surfaces/sports/',
  },
  {
    id: 'H-06',
    axes: { impact: 4, likelihood: 5, exploitability: 2, customer_impact: 4, revenue_impact: 3 },
    domain: 'Ops',
    stage: 'R8',
    dod_profile: 'type-hygiene',
    symptom: '배포본과 작업 트리가 trust route에서 분리(dirty deploy)',
    owner: 'sre',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'docs/OPERATIONS/',
  },
  {
    id: 'H-07',
    axes: { impact: 4, likelihood: 4, exploitability: 3, customer_impact: 3, revenue_impact: 2 },
    domain: 'Admin',
    stage: 'R5',
    dod_profile: 'ui-route',
    symptom: 'Admin 역할별 메뉴 allowlist가 실제 nav에 미적용',
    owner: 'admin',
    reviewer: 'security',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/admin/src/product/layout/admin-nav.tsx',
  },
  {
    id: 'H-08',
    axes: { impact: 4, likelihood: 4, exploitability: 3, customer_impact: 2, revenue_impact: 3 },
    domain: 'Admin',
    stage: 'R5',
    dod_profile: 'ui-route',
    symptom: 'Earn settlement 승인에 운영자 사유 입력 없음',
    owner: 'admin',
    reviewer: 'security',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/admin/src/product/surfaces/',
  },
  {
    id: 'H-09',
    axes: { impact: 4, likelihood: 3, exploitability: 4, customer_impact: 4, revenue_impact: 2 },
    domain: 'Auth',
    stage: 'R3',
    dod_profile: 'backend-db',
    symptom: 'Supabase leaked-password protection 비활성',
    owner: 'security',
    reviewer: 'auth',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'supabase/config.toml',
  },
  {
    id: 'H-10',
    axes: { impact: 4, likelihood: 5, exploitability: 1, customer_impact: 5, revenue_impact: 5 },
    domain: 'Wallet',
    stage: 'R2',
    dod_profile: 'ui-route',
    symptom: '출금 기능이 feature_withdrawal_enabled=false로 전역 중지',
    owner: 'wallet',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/domain/platform-gate-contract.ts',
  },
  {
    id: 'H-11',
    axes: { impact: 3, likelihood: 5, exploitability: 1, customer_impact: 3, revenue_impact: 3 },
    domain: 'Wallet',
    stage: 'R2',
    dod_profile: 'ui-route',
    symptom: 'Giftcard 시장 6개 전부 비활성인데 rail 노출',
    owner: 'wallet',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/features/wallet/',
  },
  {
    id: 'M-01',
    axes: { impact: 3, likelihood: 5, exploitability: 1, customer_impact: 3, revenue_impact: 2 },
    domain: 'Earn',
    stage: 'R1',
    dod_profile: 'ui-route',
    symptom: 'P와 PHON 단위가 같은 흐름에서 혼용',
    owner: 'earn',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/domain/earn-static-missions.ts',
  },
  {
    id: 'M-02',
    axes: { impact: 3, likelihood: 4, exploitability: 1, customer_impact: 2, revenue_impact: 2 },
    domain: 'Admin',
    stage: 'R5',
    dod_profile: 'ui-route',
    symptom: 'Admin 3 desk가 PHON 금액을 문자열로 이어 붙임',
    owner: 'admin',
    reviewer: 'wallet',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/admin/src/product/surfaces/',
  },
  {
    id: 'M-03',
    axes: { impact: 3, likelihood: 4, exploitability: 1, customer_impact: 3, revenue_impact: 2 },
    domain: 'Trade',
    stage: 'R6',
    dod_profile: 'ui-route',
    symptom: '비지갑 base asset도 USDT precision으로 포맷',
    owner: 'trade',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/product/surfaces/trade/',
  },
  {
    id: 'M-04',
    axes: { impact: 4, likelihood: 3, exploitability: 4, customer_impact: 2, revenue_impact: 1 },
    domain: 'Security',
    stage: 'R3',
    dod_profile: 'backend-db',
    symptom: '익명 SIWE·analytics 쓰기에 익명 rate limit 없음',
    owner: 'security',
    reviewer: 'auth',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'supabase/migrations/',
  },
  {
    id: 'M-05',
    axes: { impact: 3, likelihood: 4, exploitability: 3, customer_impact: 2, revenue_impact: 1 },
    domain: 'Security',
    stage: 'R3',
    dod_profile: 'backend-db',
    depends_on: ['R3-c-search-path'],
    symptom: '함수 hardening WARN 대량 잔존(search_path 등)',
    owner: 'security',
    reviewer: 'db',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'supabase/migrations/',
  },
  {
    id: 'M-06',
    axes: { impact: 3, likelihood: 3, exploitability: 3, customer_impact: 2, revenue_impact: 1 },
    domain: 'Security',
    stage: 'R3',
    dod_profile: 'backend-db',
    depends_on: ['R3-b-service-grants'],
    symptom: 'service-write table에 client DML base GRANT 잔존',
    owner: 'security',
    reviewer: 'db',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'supabase/migrations/',
  },
  {
    id: 'M-07',
    axes: { impact: 2, likelihood: 4, exploitability: 1, customer_impact: 2, revenue_impact: 1 },
    domain: 'Auth',
    stage: 'R6',
    dod_profile: 'ui-route',
    symptom: '알림 센터 launch gate가 chrome마다 다르게 적용',
    owner: 'auth',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/domain/settings-hub-display-contract.ts',
  },
  {
    id: 'M-08',
    axes: { impact: 2, likelihood: 5, exploitability: 1, customer_impact: 3, revenue_impact: 2 },
    domain: 'Earn',
    stage: 'R6',
    dod_profile: 'ui-route',
    symptom: 'Home Fold4 미션 카드가 route를 받지만 클릭 불가',
    owner: 'earn',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/product/surfaces/home/',
  },
  {
    id: 'M-09',
    axes: { impact: 2, likelihood: 3, exploitability: 1, customer_impact: 2, revenue_impact: 1 },
    domain: 'Casino',
    stage: 'R6',
    dod_profile: 'ui-route',
    symptom: '/casino/tournaments가 registry에 남았지만 route 없음',
    owner: 'casino',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/product/shell/',
  },
  {
    id: 'M-10',
    axes: { impact: 2, likelihood: 4, exploitability: 1, customer_impact: 2, revenue_impact: 1 },
    domain: 'Trade',
    stage: 'R6',
    dod_profile: 'ui-route',
    symptom: 'Price alert가 local store에만 저장',
    owner: 'trade',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/product/surfaces/trade/',
  },
  {
    id: 'M-11',
    axes: { impact: 3, likelihood: 4, exploitability: 1, customer_impact: 3, revenue_impact: 2 },
    domain: 'Trade',
    stage: 'R6',
    dod_profile: 'ui-route',
    symptom: 'limit/stop TP·SL과 cross margin이 구축됐지만 비활성',
    owner: 'trade',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/domain/trade-rpc-capabilities.ts',
  },
  {
    id: 'M-12',
    axes: { impact: 2, likelihood: 4, exploitability: 1, customer_impact: 1, revenue_impact: 1 },
    domain: 'Admin',
    stage: 'R5',
    dod_profile: 'ui-route',
    symptom: '사용자 tier write hook은 열렸지만 조작 UI 없음',
    owner: 'admin',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/admin/src/',
  },
  {
    id: 'M-13',
    axes: { impact: 2, likelihood: 4, exploitability: 1, customer_impact: 2, revenue_impact: 1 },
    domain: 'Admin',
    stage: 'R5',
    dod_profile: 'ui-route',
    symptom: 'agents tab과 여러 EmptyState action이 no-op',
    owner: 'admin',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/admin/src/',
  },
  {
    id: 'M-14',
    axes: { impact: 2, likelihood: 3, exploitability: 1, customer_impact: 1, revenue_impact: 1 },
    domain: 'Platform',
    stage: 'R7',
    dod_profile: 'type-hygiene',
    symptom: 'route 미사용 surface·hook 잔존',
    owner: 'platform',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/',
  },
  {
    id: 'M-15',
    axes: { impact: 2, likelihood: 4, exploitability: 1, customer_impact: 2, revenue_impact: 1 },
    domain: 'Platform',
    stage: 'R7',
    dod_profile: 'ui-route',
    symptom: '공용 primitive·token 우회가 Casino·Trade·Auth에 집중',
    owner: 'platform',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/',
  },
  {
    id: 'M-16',
    axes: { impact: 3, likelihood: 4, exploitability: 2, customer_impact: 2, revenue_impact: 1 },
    domain: 'Platform',
    stage: 'R7',
    dod_profile: 'type-hygiene',
    symptom: 'RPC 정적 타입 증명이 cast로 약화(as never/type-lie)',
    owner: 'platform',
    reviewer: 'security',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/features/',
  },
  {
    id: 'M-17',
    axes: { impact: 2, likelihood: 2, exploitability: 1, customer_impact: 1, revenue_impact: 1 },
    domain: 'Ops',
    stage: 'R5',
    dod_profile: 'backend-db',
    symptom: '운영 auth에 test-like 이름 패턴 3개(신원 UNVERIFIED)',
    owner: 'sre',
    reviewer: 'security',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'docs/OPERATIONS/',
  },
  {
    id: 'M-18',
    axes: { impact: 3, likelihood: 5, exploitability: 1, customer_impact: 3, revenue_impact: 2 },
    domain: 'Ops',
    stage: 'R0',
    dod_profile: 'ui-route',
    blocked_by: [],
    symptom: '1455px·580px Browser DOM 검증 도구(Browser/DevTools MCP) 부재',
    owner: 'sre',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R0/browser-mcp-probe.md',
  },
  {
    id: 'M-19',
    axes: { impact: 2, likelihood: 3, exploitability: 1, customer_impact: 2, revenue_impact: 1 },
    domain: 'Platform',
    stage: 'R7',
    dod_profile: 'ui-route',
    symptom: 'install banner bottom offset이 shell token과 분리',
    owner: 'platform',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/',
  },
  {
    id: 'M-20',
    axes: { impact: 2, likelihood: 4, exploitability: 1, customer_impact: 1, revenue_impact: 1 },
    domain: 'Ops',
    stage: 'R7',
    dod_profile: 'backend-db',
    symptom: '성능 advisor 경고 62개(auth initplan·multiple permissive)',
    owner: 'db',
    reviewer: 'sre',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'supabase/',
  },
  {
    id: 'M-21',
    axes: { impact: 3, likelihood: 4, exploitability: 1, customer_impact: 3, revenue_impact: 3 },
    domain: 'Wallet',
    stage: 'R2',
    dod_profile: 'ui-route',
    symptom: 'KRW proof RPC는 live지만 Web caller 없음',
    owner: 'wallet',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'apps/web/src/domain/launch-gates.ts',
  },
  {
    id: 'EXT-01',
    axes: { impact: 4, likelihood: 5, exploitability: 1, customer_impact: 4, revenue_impact: 3 },
    domain: 'Ops',
    stage: 'R4',
    dod_profile: 'backend-db',
    depends_on: ['ADR-021-obs-stack'],
    symptom: '관측/알림 스택 미구축 — Release Gate §39 blocker',
    owner: 'sre',
    reviewer: 'product',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'docs/PRODUCT/ADR/021-platform-observability-stack.md',
  },
  {
    id: 'EXT-02',
    axes: { impact: 3, likelihood: 4, exploitability: 1, customer_impact: 2, revenue_impact: 1 },
    domain: 'Ops',
    stage: 'R0',
    dod_profile: 'type-hygiene',
    symptom: 'Evidence 보관 bucket 미지정 시 Finding 마감 지연(§45)',
    owner: 'sre',
    reviewer: 'security',
    security: 'security',
    db: 'db',
    runtime: 'sre',
    owner_path: 'docs/OPERATIONS/PLATFORM_EVIDENCE_RETENTION.md',
  },
];

const now = '2026-07-13T00:34:00+09:00';
const releaseSha = '9c4bf29b40d31b2d2952bd6257f5690d691ecbc2';

const findings = rows.map((r) => {
  const sev = severityOf(r.axes);
  return {
    id: r.id,
    severity: sev,
    impact: r.axes.impact,
    likelihood: r.axes.likelihood,
    exploitability: r.axes.exploitability,
    customer_impact: r.axes.customer_impact,
    revenue_impact: r.axes.revenue_impact,
    score:
      r.axes.impact +
      r.axes.likelihood +
      r.axes.exploitability +
      r.axes.customer_impact +
      r.axes.revenue_impact,
    domain: r.domain,
    stage: r.stage,
    status: r.id === 'EXT-02' ? 'IN_PROGRESS' : 'OPEN',
    dod_profile: r.dod_profile,
    depends_on: r.depends_on ?? [],
    blocked_by: r.blocked_by ?? [],
    symptom: r.symptom,
    root_cause: '',
    fix: '',
    evidence: [],
    regression: '',
    owner: r.owner,
    reviewer: r.reviewer,
    security: r.security,
    db: r.db,
    runtime: r.runtime,
    owner_path: r.owner_path,
    pr: '',
    sha: '',
    adr: r.id === 'EXT-01' || r.id === 'H-04' ? 'ADR-021' : '',
    updated_at: now,
  };
});

const doc = {
  schema_version: 1,
  playbook_version: '1.0.0',
  release_sha: releaseSha,
  known_good_sha: releaseSha,
  updated_at: now,
  source_audit: 'docs/audit/PLATFORM_AUDIT_REFERENCE.md',
  finding_count: findings.length,
  notes:
    'R0 control plane bootstrap. Status OPEN until Finding DoD. EXT-02 closes when Evidence bucket doc + probe land in same PR.',
  findings,
};

function yamlEscape(s: string): string {
  if (s === '') return '""';
  return JSON.stringify(s);
}

function emit(): string {
  const lines: string[] = [];
  lines.push(`schema_version: ${doc.schema_version}`);
  lines.push(`playbook_version: ${yamlEscape(doc.playbook_version)}`);
  lines.push(`release_sha: ${yamlEscape(doc.release_sha)}`);
  lines.push(`known_good_sha: ${yamlEscape(doc.known_good_sha)}`);
  lines.push(`updated_at: ${yamlEscape(doc.updated_at)}`);
  lines.push(`source_audit: ${yamlEscape(doc.source_audit)}`);
  lines.push(`finding_count: ${doc.finding_count}`);
  lines.push(`notes: ${yamlEscape(doc.notes)}`);
  lines.push(`findings:`);
  for (const f of findings) {
    lines.push(`  - id: ${yamlEscape(f.id)}`);
    lines.push(`    severity: ${yamlEscape(f.severity)}`);
    lines.push(`    impact: ${f.impact}`);
    lines.push(`    likelihood: ${f.likelihood}`);
    lines.push(`    exploitability: ${f.exploitability}`);
    lines.push(`    customer_impact: ${f.customer_impact}`);
    lines.push(`    revenue_impact: ${f.revenue_impact}`);
    lines.push(`    score: ${f.score}`);
    lines.push(`    domain: ${yamlEscape(f.domain)}`);
    lines.push(`    stage: ${yamlEscape(f.stage)}`);
    lines.push(`    status: ${yamlEscape(f.status)}`);
    lines.push(`    dod_profile: ${yamlEscape(f.dod_profile)}`);
    lines.push(`    depends_on: [${f.depends_on.map((x) => yamlEscape(x)).join(', ')}]`);
    lines.push(`    blocked_by: [${f.blocked_by.map((x) => yamlEscape(x)).join(', ')}]`);
    lines.push(`    symptom: ${yamlEscape(f.symptom)}`);
    lines.push(`    root_cause: ""`);
    lines.push(`    fix: ""`);
    lines.push(`    evidence: []`);
    lines.push(`    regression: ""`);
    lines.push(`    owner: ${yamlEscape(f.owner)}`);
    lines.push(`    reviewer: ${yamlEscape(f.reviewer)}`);
    lines.push(`    security: ${yamlEscape(f.security)}`);
    lines.push(`    db: ${yamlEscape(f.db)}`);
    lines.push(`    runtime: ${yamlEscape(f.runtime)}`);
    lines.push(`    owner_path: ${yamlEscape(f.owner_path)}`);
    lines.push(`    pr: ""`);
    lines.push(`    sha: ""`);
    lines.push(`    adr: ${f.adr ? yamlEscape(f.adr) : '""'}`);
    lines.push(`    updated_at: ${yamlEscape(f.updated_at)}`);
  }
  return lines.join('\n') + '\n';
}

const outPath = 'docs/OPERATIONS/PLATFORM_AUDIT_FINDING_REGISTRY.yaml';
writeFileSync(outPath, emit(), 'utf8');

const mdLines: string[] = [];
mdLines.push('# Platform Audit Finding Registry');
mdLines.push('');
mdLines.push(
  '> **기계 정본:** [`PLATFORM_AUDIT_FINDING_REGISTRY.yaml`](PLATFORM_AUDIT_FINDING_REGISTRY.yaml) (불일치 시 YAML 우선)',
);
mdLines.push(`> **schema_version:** 1 · **playbook:** 1.0.0 · **updated:** ${now}`);
mdLines.push(`> **Known Good / baseline SHA:** \`${releaseSha}\``);
mdLines.push(
  '> **상태 enum:** OPEN · INVESTIGATING · APPROVED_FOR_IMPLEMENT · IN_PROGRESS · VERIFYING · VERIFIED_FIXED · VERIFIED_GATED · VERIFIED_NOT_DEFECT · UNVERIFIED · BLOCKED_STOP · BLOCKED_DEP · CLOSED',
);
mdLines.push('> **dod_profile:** `ui-route` · `backend-db` · `type-hygiene`');
mdLines.push('');
mdLines.push('## Summary');
mdLines.push('');
mdLines.push(`| 항목 | 값 |`);
mdLines.push(`| --- | --- |`);
mdLines.push(`| Finding 수 | ${findings.length} (감사 34 + EXT 2) |`);
mdLines.push(`| CRITICAL | ${findings.filter((f) => f.severity === 'CRITICAL').length} |`);
mdLines.push(`| HIGH | ${findings.filter((f) => f.severity === 'HIGH').length} |`);
mdLines.push(`| MEDIUM | ${findings.filter((f) => f.severity === 'MEDIUM').length} |`);
mdLines.push(`| CLOSED | 0 (R0 Exit = Finding CLOSED 아님) |`);
mdLines.push('');
mdLines.push('## Registry');
mdLines.push('');
mdLines.push(
  '| Finding | Severity | Score | Impact | Likelihood | Exploitability | CustomerImpact | RevenueImpact | Domain | Stage | Status | dod_profile | depends_on | blocked_by | Symptom | RootCause | Fix | Evidence | Regression | Owner | Reviewer | Security | DB | Runtime | PR | SHA | ADR | UpdatedAt |',
);
mdLines.push(
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
);
for (const f of findings) {
  mdLines.push(
    `| ${f.id} | ${f.severity} | ${f.score} | ${f.impact} | ${f.likelihood} | ${f.exploitability} | ${f.customer_impact} | ${f.revenue_impact} | ${f.domain} | ${f.stage} | ${f.status} | ${f.dod_profile} | ${f.depends_on.join(';') || '—'} | ${f.blocked_by.join(';') || '—'} | ${f.symptom} | — | — | — | — | ${f.owner} | ${f.reviewer} | ${f.security} | ${f.db} | ${f.runtime} | — | — | ${f.adr || '—'} | ${f.updated_at} |`,
  );
}
mdLines.push('');
mdLines.push('## Severity formula (§35)');
mdLines.push('');
mdLines.push('`score = Impact + Likelihood + Exploitability + CustomerImpact + RevenueImpact`');
mdLines.push('');
mdLines.push(
  '- CRITICAL: score ≥ 20 또는 Impact=5+Exploitability≥4 또는 Money/Permission 직접 파괴',
);
mdLines.push('- HIGH: score 15–19');
mdLines.push('- MEDIUM: score ≤ 14');
mdLines.push('');

writeFileSync('docs/OPERATIONS/PLATFORM_AUDIT_FINDING_REGISTRY.md', mdLines.join('\n'), 'utf8');
console.log(`wrote ${outPath} · findings=${findings.length}`);
