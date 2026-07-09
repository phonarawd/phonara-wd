#!/usr/bin/env node
/**
 * apply-plan-todo-merge-51.ts — 51차 Tier-1 todo 병합 (plan frontmatter + 본문 id 치환)
 * Usage: bun run scripts/apply-plan-todo-merge-51.ts [--dry-run]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePlanYamlTodos, summarizePlanTodos, type PlanTodo } from './lib/parse-plan-yaml-todos';

const PLAN_PATH = resolve(
  process.env.USERPROFILE ?? '',
  '.cursor/plans/phase_r_super-app_8bdf2c10.plan.md',
);

const EXPECTED = {
  beforeIds: 346,
  afterIds: 273,
  removed: 73,
  completed: 179,
  pending: 87,
  cancelled: 7,
  trackA: 238,
  trackB: 35,
  firstPendingId: 'da-w0-foundation-ssot-bundle',
} as const;

/** removed id → surviving id (본문 grep 치환용) */
const ID_REDIRECT: Record<string, string> = {
  // DA W3
  'da-w3-home-progressive-disclosure': 'da-w3-ia-progressive-bundle',
  'da-w3-wallet-hero-accordion': 'da-w3-ia-progressive-bundle',
  'da-w3-trade-mobile-ticket-collapse': 'da-w3-ia-progressive-bundle',
  // DA W4
  'da-w4-motion-interaction-wire': 'da-w4-motion-system-bundle',
  'da-w4-motion-number-count-up': 'da-w4-motion-system-bundle',
  // DA W6
  'da-w6-brand-mark-aurora': 'da-w6-brand-elevation-bundle',
  'da-w6-brand-domain-empty-states': 'da-w6-brand-elevation-bundle',
  'da-w6-brand-loading-signature': 'da-w6-brand-elevation-bundle',
  // DA W8 (6 surfaces → bundle; sound defer + gate 유지)
  'da-w8-signature-home-dashboard': 'da-w8-signature-surfaces-bundle',
  'da-w8-signature-wallet-living-balance': 'da-w8-signature-surfaces-bundle',
  'da-w8-signature-trade-market-heat': 'da-w8-signature-surfaces-bundle',
  'da-w8-signature-casino-tile-hover': 'da-w8-signature-surfaces-bundle',
  'da-w8-signature-sports-countdown': 'da-w8-signature-surfaces-bundle',
  'da-w8-signature-vip-xp-animation': 'da-w8-signature-surfaces-bundle',
  // P10 Sports/Casino/Games
  'p10-page-sports-prematch': 'p10-sports-hub-pages',
  'p10-page-sports-fixture': 'p10-sports-hub-pages',
  'p10-page-sports-my-bets': 'p10-sports-hub-pages',
  'p10-sports-cashout-wire': 'p10-sports-slip-advanced-wire',
  'p10-sports-sgp-system-unlock': 'p10-sports-slip-advanced-wire',
  'p10-sports-risk-limit-display': 'p10-sports-slip-advanced-wire',
  'p10-page-sports-rules': 'p10-sports-rules-and-vip-stub',
  'p10-page-sports-vip': 'p10-sports-rules-and-vip-stub',
  // P10 games batches — 51차 표 −31 정합: instant/pixi bundle 제외(단독 유지)
  // P11 Earn (wallet-redeem 단독 유지)
  'p11-page-events': 'p11-earn-side-surfaces',
  'p11-page-earn-play': 'p11-earn-side-surfaces',
  'p11-page-earn-cashback': 'p11-earn-side-surfaces',
  'p11-page-referral-leaderboard': 'p11-earn-side-surfaces',
  // P12 Marketing/Community/Legal
  'p12-page-tier-landing': 'p12-trust-marketing-hub',
  'p12-page-features': 'p12-trust-marketing-hub',
  'p12-page-fees': 'p12-trust-marketing-hub',
  'p12-page-security-landing': 'p12-trust-marketing-hub',
  'p12-trust-center-narrative': 'p12-trust-marketing-hub',
  'p12-page-announcements': 'p12-community-support-hub',
  'p12-page-system-status': 'p12-community-support-hub',
  'p12-page-support-ticket': 'p12-community-support-hub',
  'p12-page-support': 'p12-community-support-hub',
  'p12-page-support-faq': 'p12-community-support-hub',
  'p12-page-feedback': 'p12-community-support-hub',
  'p12-page-referral-terms': 'p12-legal-pages',
  'p12-page-legal-cookies': 'p12-legal-pages',
  // P13 Launch/Closeout
  'p13-soft-launch-qa': 'p13-soft-launch-bundle',
  'p13-soft-launch-beta': 'p13-soft-launch-bundle',
  'p13-closeout-legacy-class-purge': 'p13-closeout-bundle',
  'p13-closeout-docs': 'p13-closeout-bundle',
  'p13-closeout-ci': 'p13-closeout-bundle',
  // Track B E1–E10
  'ew-e1-adr-tier-decay': 'ew-e1-decay-wave',
  'ew-e1-engine-decay-rpc': 'ew-e1-decay-wave',
  'ew-e2-adr-mission-admin': 'ew-e2-missions-wave',
  'ew-e2-engine-mission-crud': 'ew-e2-missions-wave',
  'ew-e3-adr-viral-leaderboard': 'ew-e3-viral-cms-wave',
  'ew-e3-engine-leaderboard-rpc': 'ew-e3-viral-cms-wave',
  'ew-e3-engine-promotions-cms': 'ew-e3-viral-cms-wave',
  'ew-e4-adr-tier-option-b': 'ew-e4-tier-option-b-wave',
  'ew-e4-engine-tier-option-b': 'ew-e4-tier-option-b-wave',
  'ew-e4-engine-prime-elite': 'ew-e4-tier-option-b-wave',
  'ew-e4-engine-admin-tier-write': 'ew-e4-tier-option-b-wave',
  'ew-e5-page-tier-me-decay-wire': 'ew-e5-gap-surfaces-wire',
  'ew-e5-page-referral-leaderboard': 'ew-e5-gap-surfaces-wire',
  'ew-e5-page-sports-vip': 'ew-e5-gap-surfaces-wire',
  'ew-e6-page-admin-promotions': 'ew-e6-admin-desks-wave',
  'ew-e6-page-admin-cms': 'ew-e6-admin-desks-wave',
  'ew-e6-page-admin-tier-benefits': 'ew-e6-admin-desks-wave',
  'ew-e6-page-admin-casino': 'ew-e6-admin-desks-wave',
  'ew-e6-page-admin-staking': 'ew-e6-admin-desks-wave',
  'ew-e6-page-admin-earn-activity': 'ew-e6-admin-desks-wave',
  'ew-e6-page-admin-audit-export': 'ew-e6-admin-desks-wave',
  'ew-e7-adr-social-co-mission': 'ew-e7-social-wave',
  'ew-e7-engine-social': 'ew-e7-social-wave',
  'ew-e21-adr-trade-exchange-parity': 'ew-e21-trade-parity-wave',
  'ew-e21-engine-hedge-position-mode': 'ew-e21-trade-parity-wave',
  'ew-e21-engine-reduce-only-orders': 'ew-e21-trade-parity-wave',
  'ew-e21-engine-position-tpsl-amend': 'ew-e21-trade-parity-wave',
  'ew-e21-engine-spot-limit-stop': 'ew-e21-trade-parity-wave',
  'ew-e22-adr-sports-parity': 'ew-e22-sports-parity-wave',
  'ew-e22-engine-partial-cashout': 'ew-e22-sports-parity-wave',
  'ew-e22-engine-odds-acceptance': 'ew-e22-sports-parity-wave',
  'ew-e22-engine-market-catalog': 'ew-e22-sports-parity-wave',
  'ew-e23-adr-casino-live': 'ew-e23-casino-live-wave',
  'ew-e23-engine-progressive-rounds': 'ew-e23-casino-live-wave',
  'ew-e23-engine-live-crash': 'ew-e23-casino-live-wave',
  'ew-e23-engine-pf-seed-controls': 'ew-e23-casino-live-wave',
  'ew-e8-adr-financial-connectivity': 'ew-e8-financial-wave',
  'ew-e8-engine-p2p-transfer': 'ew-e8-financial-wave',
  'ew-e8-engine-api-keys': 'ew-e8-financial-wave',
  'ew-e8-engine-points-shop-reverse': 'ew-e8-financial-wave',
  'ew-e9-adr-identity-support-analytics': 'ew-e9-identity-wave',
  'ew-e9-engine-siwe-auth': 'ew-e9-identity-wave',
  'ew-e9-engine-support-tickets': 'ew-e9-identity-wave',
  'ew-e9-engine-product-analytics': 'ew-e9-identity-wave',
  'ew-e9-engine-app-install-attribution': 'ew-e9-identity-wave',
  'ew-e9-engine-tier-leaderboard': 'ew-e9-identity-wave',
  'ew-e10-adr-platform-trust-native': 'ew-e10-platform-engine-wave',
  'ew-e10-engine-krw-proof-upload': 'ew-e10-platform-engine-wave',
  'ew-e10-engine-mission-chains': 'ew-e10-platform-engine-wave',
  'ew-e10-engine-co-bet': 'ew-e10-platform-engine-wave',
  'ew-e10-engine-ml-missions': 'ew-e10-platform-engine-wave',
  'ew-e10-ui-wallet-transfer': 'ew-e10-wallet-settings-ui',
  'ew-e10-ui-settings-api-keys': 'ew-e10-wallet-settings-ui',
  'ew-e10-ui-support-ticket': 'ew-e10-trust-support-ui',
  'ew-e10-ui-system-status': 'ew-e10-trust-support-ui',
  'ew-e10-ui-tier-leaderboard': 'ew-e10-trust-support-ui',
  'ew-e10-ui-kakao-share-sdk': 'ew-e10-growth-ui',
  'ew-e10-ui-app-install-mission': 'ew-e10-growth-ui',
};

/** trigger id → bundle id (frontmatter 치환) */
const MERGE_TRIGGERS: Record<string, string> = {
  'da-w3-home-progressive-disclosure': 'da-w3-ia-progressive-bundle',
  'da-w4-motion-interaction-wire': 'da-w4-motion-system-bundle',
  'da-w6-brand-mark-aurora': 'da-w6-brand-elevation-bundle',
  'da-w8-signature-home-dashboard': 'da-w8-signature-surfaces-bundle',
  'p10-page-sports-prematch': 'p10-sports-hub-pages',
  'p10-sports-cashout-wire': 'p10-sports-slip-advanced-wire',
  'p10-page-sports-rules': 'p10-sports-rules-and-vip-stub',
  'p11-page-events': 'p11-earn-side-surfaces',
  'p12-page-tier-landing': 'p12-trust-marketing-hub',
  'p12-page-announcements': 'p12-community-support-hub',
  'p12-page-referral-terms': 'p12-legal-pages',
  'p13-soft-launch-qa': 'p13-soft-launch-bundle',
  'p13-closeout-legacy-class-purge': 'p13-closeout-bundle',
  'ew-e1-adr-tier-decay': 'ew-e1-decay-wave',
  'ew-e2-adr-mission-admin': 'ew-e2-missions-wave',
  'ew-e3-adr-viral-leaderboard': 'ew-e3-viral-cms-wave',
  'ew-e4-adr-tier-option-b': 'ew-e4-tier-option-b-wave',
  'ew-e5-page-referral-leaderboard': 'ew-e5-gap-surfaces-wire',
  'ew-e6-page-admin-casino': 'ew-e6-admin-desks-wave',
  'ew-e7-adr-social-co-mission': 'ew-e7-social-wave',
  'ew-e21-adr-trade-exchange-parity': 'ew-e21-trade-parity-wave',
  'ew-e22-adr-sports-parity': 'ew-e22-sports-parity-wave',
  'ew-e23-adr-casino-live': 'ew-e23-casino-live-wave',
  'ew-e8-adr-financial-connectivity': 'ew-e8-financial-wave',
  'ew-e9-adr-identity-support-analytics': 'ew-e9-identity-wave',
  'ew-e10-adr-platform-trust-native': 'ew-e10-platform-engine-wave',
  'ew-e10-ui-wallet-transfer': 'ew-e10-wallet-settings-ui',
  'ew-e10-ui-support-ticket': 'ew-e10-trust-support-ui',
  'ew-e10-ui-kakao-share-sdk': 'ew-e10-growth-ui',
};

/** 흡수 id만 skip — trigger id는 MERGE_TRIGGERS로 bundle 치환 */
const SKIP_IDS = new Set(
  Object.keys(ID_REDIRECT).filter((id) => ID_REDIRECT[id] !== id && !(id in MERGE_TRIGGERS)),
);

const MERGED: Record<string, string> = {
  'da-w3-ia-progressive-bundle':
    '[DA·W3·BUNDLE] §34.12–34.14 Progressive IA — /home fold 1~5 · wallet-hero accordion · trade mobile ticket collapse · CollapsibleSection · HOME_UX_CANON · **동일 PR 필수**(51차 merge) · 선행:da-w2-gate-shell-elevation',
  'da-w4-motion-system-bundle':
    '[DA·W4·BUNDLE] §34.15–34.16 Motion system — interaction grammar wire · useCountUp balance·XP·PnL · reduced-motion instant · **동일 PR 필수**(51차 merge) · 선행:da-w3-gate-ia-progressive',
  'da-w6-brand-elevation-bundle':
    '[DA·W6·BUNDLE] §34.18–34.20 Brand elevation — BrandMark aurora · domain empty states · loading signature · **동일 PR 필수**(51차 merge) · 선행:p10-operator-visual-signoff',
  'da-w8-signature-surfaces-bundle':
    '[DA·W8·BUNDLE] §34.21–34.26 Signature surfaces — home·wallet·trade·casino·sports·vip (6 surface 체크리스트) · **동일 PR 필수**(51차 merge) · 선행:p12-gate-marketing',
  'p10-sports-hub-pages':
    '[P10·BUNDLE] Sports hub pages — /sports/prematch · /sports/fixture/$fixtureId · /sports/my-bets · ENGINE:exists · **동일 PR 필수**(51차 merge) · 선행:p10-sports-fiat-hint-wire',
  'p10-sports-slip-advanced-wire':
    '[P10·BUNDLE] Sports slip advanced — cashout(전액) · SGP·system 탭 · stake cap·odds-changed UX · slip 확장만 · **동일 PR 필수**(51차 merge) · 선행:p10-sports-live-surface-wire',
  'p10-sports-rules-and-vip-stub':
    '[P10·BUNDLE] Sports rules+vip stub — /sports/rules · /sports/vip STUB · **동일 PR 필수**(51차 merge) · 선행:p10-sports-layout-dedup-gate',
  'p11-earn-side-surfaces':
    '[P11·BUNDLE] Earn side surfaces — /events · /earn/play · /earn/cashback · /referral/leaderboard STUB · **동일 PR 필수**(51차 merge · Wallet redeem 단독) · 선행:p10-operator-visual-signoff',
  'p12-trust-marketing-hub':
    '[P12·BUNDLE] Trust+marketing hub — /tier · /features · /fees · /security · trust narrative · **동일 PR 필수**(51차 merge) · 선행:p11-gate-side-income',
  'p12-community-support-hub':
    '[P12·BUNDLE] Community+support hub — /announcements · /status STUB · /support/ticket STUB · /support · /support/faq · /feedback · **동일 PR 필수**(51차 merge) · 선행:p12-trust-marketing-hub',
  'p12-legal-pages':
    '[P12·BUNDLE] Legal pages — /legal/affiliate · /legal/cookies · **동일 PR 필수**(51차 merge) · 선행:p12-community-support-hub',
  'p13-soft-launch-bundle':
    '[P13·BUNDLE] Soft launch — ko/en QA·multi-viewport·axe 0 · closed beta CB-01~06 · **동일 PR 필수**(51차 merge) · 선행:p13-ops-prod-preflight',
  'p13-closeout-bundle':
    '[P13·BUNDLE] Launch closeout — legacy class purge · docs sync · CI gate · **동일 PR 필수**(51차 merge) · 선행:da-w7-operator-visual-dae-signoff',
  'ew-e1-decay-wave':
    '[E·WAVE] E1 Tier Decay — ADR + decay RPC/cron · 45일 grace · max 1-tier drop · **동일 PR 필수**(51차 merge) · 선행:ew-e0-adr-approval',
  'ew-e2-missions-wave':
    '[E·WAVE] E2 Missions — ADR + mission catalog CRUD · admin write path · **동일 PR 필수**(51차 merge) · 선행:ew-e1-gate-decay',
  'ew-e3-viral-cms-wave':
    '[E·WAVE] E3 Viral+CMS — ADR + leaderboard RPC + promotions/CMS schema · **동일 PR 필수**(51차 merge) · 선행:ew-e2-gate-missions',
  'ew-e4-tier-option-b-wave':
    '[E·WAVE] E4 Tier Option B — ADR + tier summary RPC + Prime Elite + admin tier write · **동일 PR 필수**(51차 merge) · 선행:ew-e3-gate-cms-promotions',
  'ew-e5-gap-surfaces-wire':
    '[E·WIRE] E5 gap surfaces — /tier/me decay · /referral/leaderboard · /sports/vip live · **동일 PR 필수**(51차 merge) · 선행:ew-e4-gate-tier-option-b',
  'ew-e6-admin-desks-wave':
    '[E·WAVE] E6 admin desks — promotions · cms · tier-benefits · casino · staking · earn-activity · audit export · **동일 PR 필수**(51차 merge) · 선행:ew-e5-gate-gap-surfaces',
  'ew-e7-social-wave':
    '[E·WAVE] E7 Social — ADR + co-mission engine · **동일 PR 필수**(51차 merge) · 선행:ew-e6-gate-admin-desks',
  'ew-e21-trade-parity-wave':
    '[E·WAVE] E21 Trade parity — ADR + hedge · reduce-only · TP/SL amend · spot limit/stop · **동일 PR 필수**(51차 merge) · 선행:ew-e7-gate-engine-wave',
  'ew-e22-sports-parity-wave':
    '[E·WAVE] E22 Sports parity — ADR + partial cashout · odds acceptance · market catalog · **동일 PR 필수**(51차 merge) · 선행:ew-e21-ui-trade-engine-unlocks',
  'ew-e23-casino-live-wave':
    '[E·WAVE] E23 Casino live — ADR + progressive rounds · live crash · PF seed controls · **동일 PR 필수**(51차 merge) · 선행:ew-e22-ui-sports-parity-unlocks',
  'ew-e8-financial-wave':
    '[E·WAVE] E8 Financial — ADR + P2P transfer · API keys · points shop reverse · **동일 PR 필수**(51차 merge) · 선행:ew-e23-ui-casino-live-unlocks',
  'ew-e9-identity-wave':
    '[E·WAVE] E9 Identity+Support — ADR + SIWE · support tickets · analytics · app-install · tier leaderboard · **동일 PR 필수**(51차 merge) · 선행:ew-e8-gate-financial',
  'ew-e10-platform-engine-wave':
    '[E·WAVE] E10 Platform engine — ADR + KRW proof · mission chains · co-bet · ML missions · **동일 PR 필수**(51차 merge) · 선행:ew-e9-gate-identity-support',
  'ew-e10-wallet-settings-ui':
    '[E·UI] E10 wallet+settings — /wallet/transfer · /settings/api-keys · **동일 PR 필수**(51차 merge) · 선행:ew-e10-gate-platform-world-class',
  'ew-e10-trust-support-ui':
    '[E·UI] E10 trust+support — /support/ticket · /status · /tier/leaderboard · **동일 PR 필수**(51차 merge) · 선행:ew-e10-wallet-settings-ui',
  'ew-e10-growth-ui':
    '[E·UI] E10 growth — Kakao share SDK · app-install mission · **동일 PR 필수**(51차 merge) · 선행:ew-e10-trust-support-ui',
};

function redirectContent(content: string): string {
  let out = content;
  const entries = Object.entries(ID_REDIRECT)
    .filter(([a, b]) => a !== b)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [oldId, newId] of entries) {
    out = out.replaceAll(oldId, newId);
  }
  return out;
}

function applyMerges(todos: PlanTodo[]): PlanTodo[] {
  const out: PlanTodo[] = [];

  for (const todo of todos) {
    if (SKIP_IDS.has(todo.id)) continue;

    const bundleId = MERGE_TRIGGERS[todo.id];
    if (bundleId) {
      out.push({
        id: bundleId,
        status: todo.status,
        content: MERGED[bundleId],
      });
      continue;
    }

    if (todo.id === 'p11-page-wallet-redeem') {
      out.push({
        id: todo.id,
        status: todo.status,
        content: redirectContent(todo.content).replace(
          '선행:p11-page-earn-play',
          '선행:p11-earn-side-surfaces',
        ),
      });
      continue;
    }

    if (todo.id === 'p10-sports-parity-contract-and-board') {
      out.push({
        id: todo.id,
        status: todo.status,
        content: redirectContent(todo.content).replace(
          '선행:p10-page-sports-my-bets',
          '선행:p10-sports-hub-pages',
        ),
      });
      continue;
    }

    if (todo.id === 'p10-page-casino') {
      out.push({
        id: todo.id,
        status: todo.status,
        content: redirectContent(todo.content).replace(
          '선행:p10-page-sports-vip',
          '선행:p10-sports-rules-and-vip-stub',
        ),
      });
      continue;
    }

    if (todo.id === 'da-w7-enforcement-strict-tokens') {
      out.push({
        id: todo.id,
        status: todo.status,
        content: redirectContent(todo.content).replace(
          '선행:p13-soft-launch-beta',
          '선행:p13-soft-launch-bundle',
        ),
      });
      continue;
    }

    if (todo.id === 'ew-e4-gate-tier-option-b') {
      out.push({
        id: todo.id,
        status: todo.status,
        content: redirectContent(todo.content).replace(
          '선행:ew-e4-engine-admin-tier-write',
          '선행:ew-e4-tier-option-b-wave',
        ),
      });
      continue;
    }

    if (todo.id === 'ew-e5-gate-gap-surfaces') {
      out.push({
        id: todo.id,
        status: todo.status,
        content: redirectContent(todo.content).replace(
          '선행:ew-e5-page-sports-vip',
          '선행:ew-e5-gap-surfaces-wire',
        ),
      });
      continue;
    }

    if (todo.id === 'ew-e6-gate-admin-desks') {
      out.push({
        id: todo.id,
        status: todo.status,
        content: redirectContent(todo.content).replace(
          '선행:ew-e6-page-admin-audit-export',
          '선행:ew-e6-admin-desks-wave',
        ),
      });
      continue;
    }

    out.push({
      id: todo.id,
      status: todo.status,
      content: redirectContent(todo.content),
    });
  }

  return out;
}

function serializeTodos(todos: PlanTodo[]): string {
  const lines = ['todos:'];
  for (const t of todos) {
    lines.push(`  - id: ${t.id}`);
    lines.push(`    content: "${t.content.replace(/"/g, '\\"')}"`);
    lines.push(`    status: ${t.status}`);
  }
  return lines.join('\n');
}

function replaceIdsInBody(text: string): string {
  let out = text;
  const entries = Object.entries(ID_REDIRECT)
    .filter(([a, b]) => a !== b)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [oldId, newId] of entries) {
    out = out.replaceAll(`\`${oldId}\``, `\`${newId}\``);
    out = out.replaceAll(oldId, newId);
  }
  return out;
}

function patchOverview(header: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  return header
    .replace(/\*\*346 ids\*\*/g, `**${summary.ids} ids**`)
    .replace(/W0–W8 · 28 ids/g, `W0–W8 · 18 ids`)
    .replace(/50차 −13 bundle/g, `51차 −73 bundle`)
    .replace(/\+28 DA W0–W8/g, `+18 DA W0–W8 (51차 merge −10)`);
}

function patchSection206(text: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  let out = text;
  out = out.replace(
    /\*\*총량 \(정본\):\*\* \*\*\d+ ids\*\* = Track A \*\*\d+\*\*[^+]+\+ Track B \*\*\d+\*\*/,
    `**총량 (정본):** **${summary.ids} ids** = Track A **${summary.trackA}** (+18 DA W0–W8 · 51차 merge) + Track B **${summary.trackB}**`,
  );
  out = out.replace(
    /\*\*status 실측 \([^)]+\):\*\* `completed` \*\*\d+\*\* · `pending` \*\*\d+\*\*[^·]*/,
    `**status 실측 (2026-07-09 · 51차 merge sync):** \`completed\` **${summary.completed}** · \`pending\` **${summary.pending}** (+18 da-w*)`,
  );
  out = out.replace(
    /\*\*현재 NEXT:\*\* `[^`]+` \(YAML \*\*#\d+\*\*\)/,
    `**현재 NEXT:** \`${summary.firstPendingId}\` (YAML **#${summary.firstPendingIndex}**)`,
  );
  out = out.replace(/(\| \*\*총량\*\* \| \*\*)\d+(\*\* \| frontmatter)/, `$1${summary.ids}$2`);
  out = out.replace(
    /(\| \*\*Track A \(P0–P13\+PQA\)\*\* \| \*\*)\d+(\*\* \|)/,
    `$1${summary.trackA}$2`,
  );
  out = out.replace(/(\| \*\*Track B \(E0–E23\)\*\* \| \*\*)\d+(\*\* \|)/, `$1${summary.trackB}$2`);
  out = out.replace(
    /(\| \*\*합계 검증\*\* \| \*\*)\d+\+\d+=(\d+)(\*\* \|)/,
    `$1${summary.trackA}+${summary.trackB}=${summary.ids}$3`,
  );
  out = out.replace(/(\| \*\*pending\*\* \| \*\*)\d+(\*\* \|)/, `$1${summary.pending}$2`);
  out = out.replace(/(\| \*\*completed\*\* \| \*\*)\d+(\*\* \|)/, `$1${summary.completed}$2`);
  out = out.replace(/(\| \*\*active\*\* \| \*\*)\d+(\*\* \|)/, `$1${summary.active}$2`);
  out = out.replace(
    /\| \*\*NEXT\*\* \| `[^`]+` \|[^|]+\|/,
    `| **NEXT** | \`${summary.firstPendingId}\` | YAML **#${summary.firstPendingIndex}** · 51차 merge sync |`,
  );
  out = out.replace(
    /\*\*#\d+ = 마지막 completed \(`[^`]+`\)\*\* · \*\*현재 NEXT = `[^`]+`\*\* \(YAML \*\*#\d+\*\*\)/,
    `**#${summary.firstPendingIndex ? summary.firstPendingIndex - 1 : summary.completed} = 마지막 completed (\`pqa-gate-platform-audit\`)** · **현재 NEXT = \`${summary.firstPendingId}\`** (YAML **#${summary.firstPendingIndex}**)`,
  );
  return out;
}

function patchSection2013(text: string): string {
  let out = text;
  // Sports# sub-ladder (51차 bundle ids)
  out = out.replace(
    /\| Sports#1 \| `p10-sports-parity-contract-and-board`[\s\S]*?\| CasinoR#1 \| `p10-casino-replay-and-infra`[\s\S]*?\(50차 merge\) \|/,
    `| Sports#0 | \`p10-sports-hub-pages\` | BUNDLE | \`p10-sports-fiat-hint-wire\` | prematch+fixture+my-bets (51차 merge) |
| Sports#1 | \`p10-sports-parity-contract-and-board\` | BUNDLE | Sports#0 | parity contract + multi-market board |
| Sports#2 | \`p10-sports-live-surface-wire\` | UI | Sports#1 | live page + in-play wire |
| Sports#3 | \`p10-sports-slip-advanced-wire\` | BUNDLE | Sports#2 | cashout+SGP+risk (51차 merge) |
| Sports#4 | \`p10-sports-rules-and-vip-stub\` | BUNDLE | \`p10-sports-layout-dedup-gate\` | rules+vip stub (51차 merge) |
| CasinoR#1 | \`p10-casino-replay-and-infra\` | BUNDLE | \`p10-page-casino\` | §23.2.1 replay contract + casino shell |`,
  );
  // §20.13 execution ladder P10/P11/P12 row ranges (51차 id 축소)
  out = out.replace(
    /\| \*\*180–205\*\* \| `p10-sports-fiat-hint-wire`[\s\S]*?\| P10 \|/,
    `| **180–192** | \`p10-sports-fiat-hint-wire\` … hub·slip·rules bundles · Sports#1–4 · CasinoR#1 · games bundles · \`p10-gate-betting\` · \`p10-operator-visual-signoff\` | P10 |`,
  );
  out = out.replace(
    /\| \*\*207–212\*\* \| `p11-page-\*`[\s\S]*?\| P11 \|/,
    `| **194–196** | \`p11-earn-side-surfaces\` · \`p11-page-wallet-redeem\` · \`p11-gate-side-income\` | P11 |`,
  );
  out = out.replace(
    /\| \*\*213–226\*\* \| `p12-page-\*`[\s\S]*?\| P12 \|/,
    `| **197–200** | \`p12-trust-marketing-hub\` · \`p12-community-support-hub\` · \`p12-legal-pages\` · \`p12-gate-marketing\` | P12 |`,
  );
  out = out.replace(
    /\| \*\*227–242\*\* \| `p13-\*`[\s\S]*?\| P13 \|/,
    `| **201–210** | \`p13-*\` (+ soft-launch·closeout bundles · prod preflight · T1/T2) | P13 |`,
  );
  out = out.replace(
    /\| \*\*243–320\*\* \| `ew-e0-\*`[\s\S]*?\| E0–E23 \|/,
    `| **211–273** | \`ew-e0-*\` … E-wave bundles · \`ew-e10-gate-platform-world-class\` | E0–E23 |`,
  );
  return out;
}

function insertMergeReview51(text: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  const marker = '**병합 검토 (50차 · 2026-07-09):**';
  const entry = `**병합 검토 (51차 · 2026-07-09):** operator — **Composer 2.5 Tier-1 bundle merge** — Track A **−31** (DA W3/W4/W6/W8 · P10 hub/slip/rules/games · P11 earn · P12 trust/community/legal · P13 soft/closeout) + Track B **−42** (E1–E10 waves · E10 UI 3 bundles) · **−73 ids** · **${summary.ids} ids** · pending **${summary.pending}** · NEXT=\`${summary.firstPendingId}\` · §20.1 **BUNDLE/WAVE=동일 PR 필수** · gate/visual 흡수 0 · cross-chapter bundle 0

`;
  if (text.includes('**병합 검토 (51차')) return text;
  return text.replace(marker, entry + marker);
}

function validateDryRun(
  beforeTodos: PlanTodo[],
  merged: PlanTodo[],
  summary: ReturnType<typeof summarizePlanTodos>,
): void {
  const removed = beforeTodos.length - merged.length;
  const errors: string[] = [];
  if (beforeTodos.length !== EXPECTED.beforeIds)
    errors.push(`before=${beforeTodos.length} expected ${EXPECTED.beforeIds}`);
  if (removed !== EXPECTED.removed) errors.push(`removed=${removed} expected ${EXPECTED.removed}`);
  if (summary.ids !== EXPECTED.afterIds) errors.push(`ids=${summary.ids} expected ${EXPECTED.afterIds}`);
  if (summary.pending !== EXPECTED.pending)
    errors.push(`pending=${summary.pending} expected ${EXPECTED.pending}`);
  if (summary.completed !== EXPECTED.completed)
    errors.push(`completed=${summary.completed} expected ${EXPECTED.completed}`);
  if (summary.cancelled !== EXPECTED.cancelled)
    errors.push(`cancelled=${summary.cancelled} expected ${EXPECTED.cancelled}`);
  if (summary.trackA !== EXPECTED.trackA)
    errors.push(`trackA=${summary.trackA} expected ${EXPECTED.trackA}`);
  if (summary.trackB !== EXPECTED.trackB)
    errors.push(`trackB=${summary.trackB} expected ${EXPECTED.trackB}`);
  if (summary.firstPendingId !== EXPECTED.firstPendingId)
    errors.push(`firstPending=${summary.firstPendingId} expected ${EXPECTED.firstPendingId}`);

  const survivingIds = new Set(merged.map((t) => t.id));
  for (const absorbed of SKIP_IDS) {
    if (survivingIds.has(absorbed)) errors.push(`absorbed id still present: ${absorbed}`);
  }

  if (errors.length > 0) {
    console.error(JSON.stringify({ validation: 'FAIL', errors, summary, removed }, null, 2));
    process.exit(1);
  }
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const raw = readFileSync(PLAN_PATH, 'utf8');
  const fmStart = raw.indexOf('---');
  const fmEnd = raw.indexOf('---', fmStart + 3);
  const body = raw.slice(fmEnd + 3);

  const before = parsePlanYamlTodos(PLAN_PATH);
  const merged = applyMerges(before);
  const summary = summarizePlanTodos(merged);

  validateDryRun(before, merged, summary);

  const todosYaml = serializeTodos(merged);
  let headerBase = raw
    .slice(fmStart, fmEnd + 3)
    .replace(/^todos:[\s\S]*?(?=\n---)/m, '')
    .trimEnd();
  if (headerBase.endsWith('---')) {
    headerBase = headerBase.slice(0, -3).trimEnd();
  }
  const patchedHeader = patchOverview(headerBase, summary);
  let newBody = replaceIdsInBody(body);
  newBody = patchSection206(newBody, summary);
  newBody = patchSection2013(newBody);
  newBody = insertMergeReview51(newBody, summary);

  const fullFile = `${patchedHeader}\n${todosYaml}\n---${newBody}`;

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          validation: 'PASS',
          before: before.length,
          after: merged.length,
          removed: before.length - merged.length,
          summary,
          firstPending: merged.find((t) => t.status === 'pending')?.id,
        },
        null,
        2,
      ),
    );
    return;
  }

  writeFileSync(PLAN_PATH, fullFile);
  console.log(
    JSON.stringify(
      { applied: true, validation: 'PASS', removed: before.length - merged.length, summary },
      null,
      2,
    ),
  );
}

main();
