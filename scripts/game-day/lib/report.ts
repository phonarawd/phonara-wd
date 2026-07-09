import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LeverInventoryEntry } from './inventory.ts';
import type { ProbeResult } from './probes.ts';
import type { DbSnapshot } from './snapshot.ts';

export type DrillVerdict = 'pass' | 'fail' | 'skipped';

export interface DrillResult {
  readonly id: string;
  readonly title: string;
  readonly verdict: DrillVerdict;
  readonly summary: string;
  readonly measurements: Record<string, string | number | boolean>;
  readonly probes?: readonly ProbeResult[];
  readonly citations: readonly string[];
}

export interface RunbookRow {
  readonly situation: string;
  readonly lever: string;
  readonly command: string;
  readonly stops: string;
  readonly recovery: string;
}

export interface GamedayReport {
  readonly target: string;
  readonly ranAt: string;
  readonly sectionA: {
    readonly launchBlockers: readonly string[];
    readonly headline: string;
  };
  readonly sectionB: {
    readonly inventory: readonly LeverInventoryEntry[];
    readonly drills: readonly DrillResult[];
  };
  readonly sectionC: {
    readonly runbook: readonly RunbookRow[];
    readonly restoreCommands?: readonly string[];
  };
  readonly sectionD: {
    readonly mechanisms: readonly string[];
  };
}

export function createGamedayReportBuilder(target: string): {
  addBlocker: (msg: string) => void;
  setInventory: (entries: readonly LeverInventoryEntry[]) => void;
  addDrill: (drill: DrillResult) => void;
  setRunbook: (rows: readonly RunbookRow[]) => void;
  setRestoreCommands: (cmds: readonly string[]) => void;
  setMechanisms: (items: readonly string[]) => void;
  finalize: () => GamedayReport;
} {
  const blockers: string[] = [];
  const drills: DrillResult[] = [];
  let inventory: readonly LeverInventoryEntry[] = [];
  let runbook: readonly RunbookRow[] = [];
  let restoreCommands: readonly string[] = [];
  let mechanisms: readonly string[] = [];

  return {
    addBlocker(msg: string) {
      if (!blockers.includes(msg)) blockers.push(msg);
    },
    setInventory(entries) {
      inventory = entries;
    },
    addDrill(drill) {
      drills.push(drill);
      if (drill.verdict === 'fail') {
        const coreRecovery = new Set(['game_bet', 'withdrawal_request', 'deposit_request']);
        for (const p of drill.probes ?? []) {
          if (!p.passed && p.expected === 'reject' && p.ok) {
            this.addBlocker(`킬스위치 누수: ${p.rpc} (${p.actor})`);
          }
          if (
            !p.passed &&
            p.expected === 'allow' &&
            coreRecovery.has(p.name) &&
            (drill.id === 'drill-1' || drill.id === 'drill-2')
          ) {
            this.addBlocker(`복구 실패: ${p.rpc} (${p.actor}) — ${p.error}`);
          }
          if (!p.passed && drill.id === 'drill-4' && p.name.startsWith('aal1_') && p.ok) {
            this.addBlocker(`권한 우회: ${p.rpc} (${p.actor})`);
          }
        }
        if (drill.id === 'drill-4' && drill.verdict === 'fail') {
          this.addBlocker(`권한 우회: ${drill.summary}`);
        }
        if (drill.id === 'drill-5') {
          this.addBlocker(`백업 복원 실패: ${drill.summary}`);
        }
      }
    },
    setRunbook(rows) {
      runbook = rows;
    },
    setRestoreCommands(cmds) {
      restoreCommands = cmds;
    },
    setMechanisms(items) {
      mechanisms = items;
    },
    finalize(): GamedayReport {
      const headline =
        blockers.length === 0
          ? '게임데이 드릴 — 차단급 ❌ 없음'
          : `게임데이 드릴 — 차단급 ❌ ${blockers.length}건`;
      return {
        target,
        ranAt: new Date().toISOString(),
        sectionA: { launchBlockers: blockers, headline },
        sectionB: { inventory, drills },
        sectionC: { runbook, restoreCommands },
        sectionD: { mechanisms },
      };
    },
  };
}

export function writeGamedayReport(report: GamedayReport): string {
  const path = join(process.cwd(), 'scripts', 'game-day', 'last-gameday-report.json');
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return path;
}

export function printGamedayReport(report: GamedayReport): void {
  console.log('\n═══════════════════════════════════════════');
  console.log('(A) 출시 차단 ❌ 목록');
  console.log('═══════════════════════════════════════════');
  if (report.sectionA.launchBlockers.length === 0) {
    console.log(report.sectionA.headline);
  } else {
    for (const item of report.sectionA.launchBlockers) {
      console.log(`❌ ${item}`);
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('(B) 드릴 0~6 실측');
  console.log('═══════════════════════════════════════════');
  console.log(`§0 인벤토리: ${report.sectionB.inventory.length} 레버`);
  for (const drill of report.sectionB.drills) {
    const icon = drill.verdict === 'pass' ? '✅' : drill.verdict === 'fail' ? '❌' : '⏭';
    console.log(`${icon} ${drill.title}: ${drill.summary}`);
    for (const [k, v] of Object.entries(drill.measurements)) {
      console.log(`   ${k}: ${v}`);
    }
    if (drill.probes?.length) {
      const failed = drill.probes.filter((p) => !p.passed);
      for (const p of failed.slice(0, 5)) {
        console.log(
          `   probe FAIL ${p.name}: expected=${p.expected} ok=${p.ok} err=${p.error.slice(0, 80)}`,
        );
      }
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('(C) 비상 런북');
  console.log('═══════════════════════════════════════════');
  for (const row of report.sectionC.runbook) {
    console.log(`| ${row.situation} | ${row.lever} | ${row.command.slice(0, 60)}… |`);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('(D) 작동 메커니즘 요약');
  console.log('═══════════════════════════════════════════');
  for (const m of report.sectionD.mechanisms) {
    console.log(`- ${m}`);
  }
}

export function defaultRunbook(): RunbookRow[] {
  return [
    {
      situation: '전체 정지',
      lever: 'system_halt',
      command: "rpc_set_system_mode(true, false, '<reason>') — Admin AAL2",
      stops: '사용자 balance-moving RPC (_assert_system_live)',
      recovery: "rpc_set_system_mode(false, false, '<reason>') + money probe matrix green",
    },
    {
      situation: '유지보수 읽기전용',
      lever: 'system_readonly',
      command: "rpc_set_system_mode(false, true, '<reason>')",
      stops: '자금 이동 RPC; 조회(SELECT) 허용',
      recovery: 'rpc_set_system_mode(false, false, reason)',
    },
    {
      situation: '출금만 차단',
      lever: 'feature_withdrawal_enabled',
      command: "rpc_set_feature_enabled('withdrawal', false, reason)",
      stops: '출금 요청·승인·sent',
      recovery: "rpc_set_feature_enabled('withdrawal', true, reason)",
    },
    {
      situation: '특정 게임 차단 (mines)',
      lever: 'feature_game_mines_enabled',
      command: "UPDATE app_config SET value='false' WHERE key='feature_game_mines_enabled'",
      stops: 'mines rpc_place_game_bet only',
      recovery: "SET value='true'",
    },
    {
      situation: '솔벤시 의심',
      lever: 'reconciliation + solvency gate',
      command: 'rpc_run_reconciliation(); 출금 시 withdrawal_solvency_hold',
      stops: '출금; mismatch 시 auto system_readonly',
      recovery: 'treasury attestation + fresh reconciliation + mode OFF',
    },
    {
      situation: 'DB 복원',
      lever: 'pg_dump / psql restore',
      command: 'scripts/game-day/lib/restore-drill.ts 절차 (drill 5 실측 명령)',
      stops: 'N/A',
      recovery: 'restore + verify_ledger_hash_chain=0 + snapshot match',
    },
  ];
}

export function snapshotMeasurements(snap: DbSnapshot): Record<string, string | number | boolean> {
  return {
    phon_available: snap.wallet?.phon_available ?? 'n/a',
    phon_locked: snap.wallet?.phon_locked ?? 'n/a',
    sigma_phon: snap.sigma?.PHON ?? 'n/a',
    sigma_usdt: snap.sigma?.USDT ?? 'n/a',
    sigma_krw: snap.sigma?.KRW ?? 'n/a',
    game_bets: snap.gameBetsCount,
    ledger_entries: snap.ledgerEntriesCount,
  };
}
