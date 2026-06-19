# P2.0c · PHONARA Paste-Ready Hardening · LOCK v1 · **승인 · EXECUTE GO** (+ micro-amend #16–#19)

> **상위:** [`PHONARA_CURSOR_PASTE_CRUSH_P2_0_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P2_0_LOCK.md) · [`PHONARA_CURSOR_PASTE_CRUSH_P2_0B_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P2_0B_LOCK.md)  
> **선행:** P2.0 GREEN · P2.0b GREEN  
> **목표:** Lovable → PHONARA `paste GO` 시 Cursor **어댑터 재설계 0**  
> **갱신:** 2026-06-16 · operator LOCK v1 검토 · Cursor 승인 + #16–#19

**Mode:** Contract hardening only. Zero visual diff. Zero engine touch (no migration / no RPC). P2.0 + P2.0b FROZEN files keep mtime baseline; only additive edits allowed inside them where the LOCK explicitly calls them out (Stage history accessor, `useAutoBetQueue` derive swap).

**Goal:** Lovable surface drops into PHONARA `apps/web/src/components/games/*` with zero adapter redesign. Contract = PHONARA 정본 `BetResponse` · `ImportedGameSurfaceProps` · `useCasinoRoundPipeline` · `mapGameSurfaceProps`.

---

## Deliverables (13)

| # | Path | Purpose |
|---|------|---------|
| 1 | `docs/PHONARA_PASTE_MANIFEST.md` | COPY/SKIP/ADAPT 4-line memo |
| 2 | `src/games/shared/types.ts` | MERGE PHONARA `BetResponse` + `UiBetView` + `pasteShellConfirm` |
| 3 | `src/games/shared/derive-ui-bet.ts` | NEW · single-truth `deriveUiMultiplier` / `deriveUiWin` |
| 4 | `src/games/shared/adapt-recent-bet.ts` | NEW · `toStripRow` + `crashHistoryMultiplier` |
| 5 | `src/games/shared/adapt-verification.ts` | NEW · `toFairnessUi` |
| 6 | `src/games/crash/index.tsx` | `pasteShellConfirm` branch · **단일 `recentBets` normalize 지점** |
| 7 | `src/games/shared/hooks/useAutoBetQueue.ts` | inline crash derive → `deriveUiWin` |
| 8 | `src/games/crash/Stage.tsx` | history via `crashHistoryMultiplier` only |
| 9 | `src/games/shared/FairnessSheet.tsx` | `toFairnessUi` entry + i18n `t()` only |
| 10 | `src/games/shared/BetHistoryStrip.tsx` | i18n `t()` only (no JSX 한글) |
| 11 | shared P0 audit | BetPanel · BetModeTabs · AutoBetPanel · RGGate* · GameRules* · hooks · feel/celebrate/presence · **`use-mobile` · `useGameShortkeys`** |
| 12 | `src/components/ui/*` audit | sheet · dialog · button etc. resolved |
| 13 | `src/i18n/{ko,en}.ts` | new keys + `// PHONARA_PASTE_KEYS` block |

---

## Contract details

### Types MERGE (#P2.0c-T1)

```ts
export interface BetResponse {
  bet_id: string;
  round_id: string;
  game: GameCode;
  status: 'won' | 'lost' | 'pending' | 'cancelled' | 'voided' | 'parity_hold';
  server_seed_hash: string;
  result: Record<string, unknown>;
  payout: string;
  already_placed: boolean;
}
export type UiBetView = BetResponse & { multiplier?: string };
export type BetResult = UiBetView; // #P2.0c-16 — type alias only, not value re-export

export interface PhonaraRecentBet {
  id: string;
  game: GameCode;
  status: string;
  stake: string;
  payout: string | null;
  currency: Currency;
  created_at: string;
  result?: Record<string, unknown>;
}
export interface RecentBetStripRow {
  id: string;
  game: GameCode;
  currency: Currency;
  stake: string;
  payout: string;
  multiplier: string;
  win: boolean;
  at: number;
}
export interface PhonaraVerificationEvidence {
  server_seed_hash: string;
  server_seed: string;
  result: Record<string, unknown>;
  verification: {
    seedHashMatch: boolean;
    resultMatch: boolean | null;
    floats: number[];
    recomputedResult: unknown;
  };
}
export interface FairnessUiEvidence {
  ok: boolean;
  hmac: string;
  cursor: number;
  serverSeed?: string;
}

// ImportedGameSurfaceProps:
//   bet: UiBetView | null
//   recentBets: RecentBetStripRow[] | PhonaraRecentBet[]  // adapter 입력; leaf는 strip만 (#P2.0c-18)
//   verification: PhonaraVerificationEvidence | FairnessUiEvidence | null
//   pasteShellConfirm?: boolean
```

### Derive (#P2.0c-T2) — single truth

`src/games/shared/derive-ui-bet.ts`:

- **#P2.0c-17:** `bet.multiplier`가 이미 있으면 **우선 사용** (PHONARA adapter pre-fill). 없을 때만 result/status 재계산.
- crash `deriveUiMultiplier`: `cashedOut` → `String(cashoutMultiplier)` else `"0"`; fallback `payout/stake`.
- crash `deriveUiWin`: `cashedOut === true && Number(cashoutMultiplier) >= 1.01`.
- non-crash: 기존 engine `result.won` / status 규칙 유지.

Call sites: `useAutoBetQueue`, `useMockPipeline` crash branch. **FAIL =** `useAutoBetQueue` 외 파일이 `cashoutMultiplier`/`cashedOut`로 win 판정.

### RecentBets (#P2.0c-T4)

- `toStripRow(row: PhonaraRecentBet): RecentBetStripRow`
- `crashHistoryMultiplier(row: PhonaraRecentBet | RecentBetStripRow): number`
- **#P2.0c-18:** normalize **단일 지점** = `crash/index.tsx` — `Stage`/`HUD`/`BetHistoryStrip` 입력은 **`RecentBetStripRow[]` only**.
- `Stage.tsx`: `result.crashMultiplier` 직접 접근 **0** — `crashHistoryMultiplier` only.

### Verification (#P2.0c-T5)

- `toFairnessUi(v)`: PHONARA shape → `{ ok: seedHashMatch && resultMatch===true, hmac: '—', cursor: 0, serverSeed: server_seed }`; Lovable shape passthrough.
- `FairnessSheet` 진입 시 **항상** `toFairnessUi` 경유.

### Confirm split (#P2.0c-T3)

```tsx
// crash/index.tsx
const shellConfirm = props.pasteShellConfirm === true;
// CrashSurface: {!shellConfirm && <BetConfirmDialog ... />}
```

- Lovable preview route: prop 미전달 → `BetConfirmDialog` + 3 testids 유지.
- PHONARA paste: `pasteShellConfirm: true` → dialog 0 · `CasinoMoneyConfirm` 단일.

### i18n (#P2.0c-T6)

신규 키 ko/en: `casino.history.empty` · `casino.history.title` · `fairness.copy` · `fairness.copied` · `fairness.verify.ok` · `fairness.verify.fail` · `fairness.serverSeed.pending`

파일 하단: `// PHONARA_PASTE_KEYS — packages/i18n merge 대상 (Cursor)`

### Shared/UI audit (#P2.0c-T7 · #P2.0c-19)

`rg "README|placeholder|TODO|FIXME" src/games/shared src/components/ui src/hooks/use-mobile.ts src/hooks/useGameShortkeys.ts --glob "*.{ts,tsx}"` → **0**

---

## LOCK Footer

| # | 내용 |
|---|------|
| #P2.0c-T1 | `BetResponse` 필드명 PHONARA 정본 1:1 |
| #P2.0c-T2 | `derive-ui-bet.ts` 단일 진실 · win 로직 중복 0 |
| #P2.0c-T3 | `pasteShellConfirm:true` → `BetConfirmDialog` 0 |
| #P2.0c-T4 | `crashHistoryMultiplier` · `Stage` direct `result.crashMultiplier` 0 |
| #P2.0c-T5 | `FairnessSheet` → `toFairnessUi` 필수 |
| #P2.0c-T6 | JSX 한글 0 · `PHONARA_PASTE_KEYS` 주석 |
| #P2.0c-T7 | shared/ui/hooks stub 0 |
| #P2.0c-T8 | P2.0 EB·UX-1·§STOP·disabled cashout 회귀 0 |
| #P2.0c-T9 | `docs/PHONARA_PASTE_MANIFEST.md` 산출 |
| #P2.0c-T10 | migration/RPC/Supabase 0 |
| #P2.0c-16 | `export type BetResult = UiBetView` (value re-export 금지) |
| #P2.0c-17 | `deriveUi*` — `bet.multiplier` pre-fill 우선 |
| #P2.0c-18 | `recentBets` normalize = `crash/index.tsx` 단일 |
| #P2.0c-19 | audit에 `use-mobile` · `useGameShortkeys` 포함 |

**FAIL =** #P2.0c-T1~T10 또는 #16~#19 hit · P2.0 replay/cashout 회귀 · derive 중복 · shell+inline confirm 동시 · Stage `result.crashMultiplier` 직접 접근 · i18n JSX 한글 · stub 잔존 · manifest 없음

---

## §STOP / Non-goals

- `onCashout` prop 0 · `casino-cashout` disabled · `data-cta-mode="auto"` 유지
- 수동 cashout RPC 0 · live-round WS 0
- Stage replay/animation diff 0 (history accessor만)
- Lovable preview `BetConfirmDialog` + 3 testids 유지
- migration / Supabase / RPC 0

---

## EXECUTE 0→12

| Step | 작업 |
|------|------|
| 0 | P2.0/P2.0b crash 8파일 mtime baseline (report only) |
| 1 | `derive-ui-bet.ts` · `adapt-recent-bet.ts` · `adapt-verification.ts` |
| 2 | `types.ts` MERGE (#16 alias) |
| 3 | `useAutoBetQueue` · `useMockPipeline` crash → `deriveUi*` |
| 4 | `Stage` · `BetHistoryStrip` i18n + history accessor |
| 5 | `FairnessSheet` → `toFairnessUi` |
| 6 | `crash/index.tsx` shellConfirm + **recentBets normalize 단일** |
| 7 | shared/ui/hooks audit (#19) |
| 8 | i18n 7 keys + `PHONARA_PASTE_KEYS` |
| 9 | `docs/PHONARA_PASTE_MANIFEST.md` |
| 10 | vitest: P2.0 19 + P2.0b 12 + derive · toStripRow · shellConfirm 3 |
| 11 | §GREEN full block (아래) |
| 12 | §GREEN template 회신 · ZIP defer |

---

## paste adapter memo (manifest §4 verbatim)

1. `mapGameSurfaceProps`: `pasteShellConfirm: true` · `bet: { ...placed, multiplier: deriveUiMultiplier(placed, gameCode) }`
2. `loadRecentBets`: `select`에 `result_payload` · map `result` · surface 전 `toStripRow` (index에서 이미 normalize면 pass-through)
3. `verification` → `toFairnessUi` before FairnessSheet · `CasinoE2EFairnessAnchor` 제거 (testid 단일)
4. `VITE_LOVABLE_CASINO_SURFACE=true`

---

## §GREEN self-check (EXECUTE 11 — full block)

```bash
# T1
rg "bet_id|already_placed|parity_hold" src/games/shared/types.ts

# T2 + T17
rg "deriveUiMultiplier|deriveUiWin" src/games/shared/derive-ui-bet.ts
rg "multiplier" src/games/shared/derive-ui-bet.ts | rg "pre-fill|already"
rg "cashoutMultiplier|cashedOut" src/games/shared/hooks/useAutoBetQueue.ts
# 기대: useAutoBetQueue 내부 inline win 판정 0 (deriveUiWin만)

# T3
rg "pasteShellConfirm|shellConfirm" src/games/crash/index.tsx

# T4 + T18
rg "toStripRow|crashHistoryMultiplier" src/games/shared/adapt-recent-bet.ts
rg "result\.crashMultiplier" src/games/crash/Stage.tsx
# 기대: 0

# T5
rg "toFairnessUi" src/games/shared/adapt-verification.ts src/games/shared/FairnessSheet.tsx

# T6
rg "[\uac00-\ud7af]{2,}" src/games/crash src/games/shared --glob "*.tsx" | rg -v "t\\(|//"
# 기대: JSX 하드코딩 한글 0

# T7 + T19
rg "README|placeholder|TODO|FIXME" src/games/shared src/components/ui src/hooks/use-mobile.ts src/hooks/useGameShortkeys.ts --glob "*.{ts,tsx}"
# 기대: 0

# T8
rg 'data-cta-mode="auto"' src/games/crash/Controls.shared.tsx
rg "casino-cashout" src/games/crash/Controls.shared.tsx

# T9
test -f docs/PHONARA_PASTE_MANIFEST.md

# tests
bun run test -- src/games/shared src/games/crash
```

---

## §GREEN template

```text
P2.0c §GREEN
- derive-ui-bet + adapt-* 3파일
- types MERGE · #16 BetResult alias · pasteShellConfirm
- index recentBets normalize 단일 (#18)
- shared/ui/hooks stub 0 (#19)
- manifest: docs/PHONARA_PASTE_MANIFEST.md (N lines)
- vitest: PASS (crash N · shared M · +3 P2.0c)
- P2.0/P2.0b 회귀: 0
- ZIP: defer
FAIL = (없음 | #P2.0c-Tn | #16-#19)
```

---

## Defer

- 수동 cashout · `onCashout` · live round
- PHONARA repo paste (operator paste GO)
- ZIP (`operator 「ZIP 발행」` 전 0)
