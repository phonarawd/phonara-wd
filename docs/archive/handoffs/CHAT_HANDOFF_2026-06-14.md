# PHONARA 세션 인계문 — 2026-06-14 (새 채팅용 · 지존급)

> **새 Cursor 채팅 첫 메시지:** 이 파일 전체 붙여넣기 **또는** `@docs/CHAT_HANDOFF_2026-06-14.md` 참조 후 아래 §「새 채팅 첫 지시」 복붙.
>
> **정적 인계 베이스:** `docs/LOVABLE_HANDOFF.md` · `docs/LOVABLE_P1_FINAL_PHONARA.md` · `docs/GAMES-INTEGRATION.md`  
> **작업 변경 이력 (무엇을 어떻게 수정했는지):** [`docs/WORK_LOG_2026-06-14.md`](WORK_LOG_2026-06-14.md)
>
> **이 세션 transcript (Cursor):** 이 대화는 레포에 jsonl로 저장됨 — 주제: 10게임 엔진 완료 → 게이트 V → Lovable ZIP-1 플랜 v2 검토.

**레포:** `c:\Users\PC\Desktop\phonara-gb`  
**브랜치:** `main`  
**HEAD:** `2d2547e` — `feat(casino): add four games, integration factory, and smoke E2E`  
**원격:** `origin/main` 대비 **ahead** (push는 사용자 요청 시만)

---

## 0. 절대 원칙 (이 대화에서 여러 번 확정)

| 레이어 | 누가 만든다 | PHONARA Cursor 역할 |
|--------|-------------|---------------------|
| **엔진** — RNG, 정산, 원장, RPC, PF, `game_code` | **PHONARA (완료·보존)** | UI 이식 중 **한 줄도 수정 금지** |
| **UI/UX** — 페이지, 탭, 버튼, 게임 화면, 카탈로그, 모션 | **Lovable 100%** | paste + 어댑터 + i18n + testid · **재디자인 금지** |

- Lovable 컴포넌트: **Supabase/RPC 직접 호출 금지** · `ImportedGameSurfaceProps` + callback만.
- 구 PHONARA 카지노 UI (`routes/casino.tsx` ~690줄, `@phonara/ui` 게임 위젯) → ZIP 이식 후 **삭제 대상**.
- 지금 `components/games/*/imported-*-game.tsx`는 **placeholder** (`PresentationImportPlaceholder`) — Lovable 본문 대기.

---

## 1. 이 세션에서 끝낸 것 (DONE · green)

### 1.1 카지노 엔진 10종 (Phase 0–6 + Final)

| 게임 | TS | SQL migrations | 비고 |
|------|-----|----------------|------|
| 기존 6종 | ✅ | ✅ | crash…hilo |
| `mint_reels` | ✅ | 88–96 파이프라인 | 3×5 slot, `{ lines }` |
| `gold_rush` | ✅ | 동일 | 별 paytable |
| `roulette` | ✅ | 동일 | European PF, multi-leg |
| `blackjack` | ✅ | 동일 | one-shot actions |

- Integration factory: `docs/ADD_GAME_RUNBOOK.md`, `scripts/check-game-registration.ts`, `check:determinism`, RTP harness, `docs/CASINO_SLO.md`
- Lovable 계약 문서 갱신: `LOVABLE_P1_FINAL_PHONARA.md`, `LOVABLE_HANDOFF.md` (10종)
- UI: 4종 **placeholder** + `registry.ts` + `router.ts` 10게임 라우트 등록 완료

### 1.2 로컬 게이트 (2026-06-14 재검증 · green)

```bash
bun run check                    # env/i18n/release/advisors/migrations/games/determinism/deps/typecheck/lint/test/build
supabase db reset                # 97 migrations
PHONARA_SQL_PARITY=1 + vitest tests/integration/casino-sql-parity.test.ts   # 10종 × 1000 seeds
bun run test:sql                 # 41/41 (affiliate 포함)
bun run test:e2e:casino-smoke    # production preview, 10 라우트 bet surface
bun run check:hygiene
bun run e2e:kill                 # 3000/3001/3002 free
```

### 1.3 E2E 전략 (PC 느림 대응 · 확정)

| 검증 | 명령 | 역할 |
|------|------|------|
| **정산·오차·보존** | SQL + parity | 실제 돈 경로 — **Playwright보다 확실** |
| **브라우저 smoke** | `bun run test:e2e:casino-smoke` | preview build + localStorage 세션, 10게임 DOM |
| **무거운 settlement E2E** | `tests/e2e/casino.spec.ts` | 로컬 PC에서 느림/타임아웃 가능 — **필수 게이트 아님** (smoke+SQL로 커버) |

- E2E lifecycle: `scripts/run-e2e.ts`, `e2e-kill`, `global-teardown`, `.cursor/rules/77-e2e-lifecycle.mdc`
- **버그 수정:** `test:e2e:casino-smoke`는 `run-e2e.ts --config ...` (`--` 없이) — 잘못 넣으면 default config → `No tests found`

### 1.4 커밋

- **`2d2547e`** — 86 files: 4게임 엔진+마이그레이션, integration gates, preview smoke, workspace/cursor scripts
- working tree **clean** (커밋 후)

---

## 2. 아직 안 한 것 (TODO · 다음 채팅 작업)

### 2.1 PHONARA Cursor (ZIP 도착 후)

1. Lovable **ZIP-1** paste (`§4` paste map)
2. `routes/casino.tsx` 어댑터 축소 → `<Imported*Game {...props} />`
3. 구 UI 삭제 (`app-shell`, `@phonara/ui` 카지노 위젯 등)
4. i18n: Lovable 키 → `packages/i18n` (**추가만**, 기존 키 변경/삭제 금지)
5. 어댑터에 **money E2E testid** 유지 (`casino-e2e-testids.ts`)
6. `typecheck` / `check:i18n` / `check:release` / `test:e2e:casino-smoke`

### 2.2 Lovable (ZIP-1 · 승인 대기)

**이번 라운드만:** 4종 풀 UI + `/games` 카탈로그 10카드. 기존 6종 **1px freeze**.

상세 스펙: 사용자가 정리한 **「PHONARA 흡수용 최종 UI/UX 패키지 — 10게임 (수정판 v2)」** (채팅에 붙여넣은 문서 — 레포 파일명 없음, Lovable에 전달용).

**ZIP-2 (별도):** e2e spec 폴리시, screenshot, 문서 fine-tune.

### 2.3 원격 (사용자 승인 시)

- Supabase migrations `20260614000088`–`96` remote apply (project `yocjhjsdwoijfdrehzoq` only)

---

## 3. Lovable ZIP-1 v2 플랜 검토 결과 (이 대화)

### 3.1 승인 OK (v1 피드백 반영됨)

- `gameCode` **underscore** (`mint_reels`) · URL만 hyphen (`/casino/mint-reels`)
- Slot selection `{ lines }` only — **turbo UI-only**, RPC selection 미포함
- Roulette `type` union = 엔진 고정 (`dozen1/2/3`, `column1/2/3` …)
- `stakeWeight: number` (UI string 표시 OK)
- testid: `casino-place-bet` (not `casino-submit-bet`) + PHONARA money E2E 세트
- i18n: `casino.game.{code}` (`packages/i18n`에 이미 기본 키 존재)
- preview `casino.*.tsx` → PHONARA paste 시 **drop**
- `router.ts` / `routeTree.gen.ts` Lovable 수동 편집 금지 (PHONARA는 **수동 `router.ts`**, gen 없음)

### 3.2 승인 전 **반드시** Lovable §0에 추가 (RED)

**Roulette `split`의 `value`는 두 칸의 합(sum)이 아님.**

PHONARA 엔진·SQL:

```ts
// value = 인접 두 칸의 **더 낮은 번호**
// 승리: value === pocket OR value + 1 === pocket
// 예: 1|2 split → value: 1  (NOT 3)
```

Lovable v2에 `split=sum` 문구가 남아 있으면 **베팅은 되지만 split 판정 틀림** → parity/E2E RED.

**복붙 한 줄:**

```text
Roulette split: value = lower adjacent pocket number (never sum). Wins if pocket === value OR pocket === value+1.
```

### 3.3 YELLOW (Lovable·paste 시 맞추기)

| 항목 | 권장 |
|------|------|
| blackjack default | PHONARA: `{ actions: [{ seat: 0, move: 'stand' }] }` — preview default 동일 권장 |
| roulette default | PHONARA: `{ bets: [{ type: 'red', value: null, stakeWeight: 1 }] }` — `bets: []`는 submit 전 검증 필수 |
| 카탈로그 paste | `presentation-import/pages/games-catalog-page.tsx` + `routes/games.tsx` (not `games.index.tsx` only) |
| `GAMES-INTEGRATION.md` | PHONARA canonical — Lovable ZIP은 **delta/merge**, 전체 overwrite 금지 |
| `PRESENTATION_IMPORT.md` | canonical: `apps/web/PRESENTATION_IMPORT.md` |

---

## 4. PHONARA 흡수 하드 제약 (Lovable §0 — ZIP 필수)

1. **gameCode:** `'mint_reels' | 'gold_rush' | 'roulette' | 'blackjack'` (underscore). `props.gameCode`도 동일.
2. **selection 1:1** (`docs/GAMES-INTEGRATION.md`):
   - slots: `{ lines: number }` — turbo 금지
   - roulette: `{ bets: [{ type, value: number|null, stakeWeight: number }] }` — type union 엔진 고정
   - blackjack: `{ actions: [{ seat, move }] }`
3. **Slot grid:** 3 rows × 5 columns (`PAYLINES_20` 인덱스)
4. **testid (money E2E):** `casino-fairness-verifier`, `casino-stake-input`, `casino-client-seed-input`, `casino-prepare-hash`, `casino-place-bet`, `casino-bet-confirm-confirm`, `casino-bet-confirm-cancel`, `casino-error`
5. **i18n:** `casino.game.*`, `casino.field.*` — `packages/i18n` (**한국어 JSX 금지**)
6. **paste:** `src/games/{slug}/` → `apps/web/src/components/games/{slug}/`
7. **엔진/RPC/정산/payout 계산 0** · `Math.random()` 금지 (mock은 시드 결정적)

---

## 5. 엔진 selection 스냅샷 (단일 소스)

```ts
// mint_reels / gold_rush
{ lines: number }  // 1..20

// roulette
{ bets: Array<{
  type: 'straight'|'split'|'red'|'black'|'even'|'odd'|'low'|'high'
      |'dozen1'|'dozen2'|'dozen3'|'column1'|'column2'|'column3';
  value: number | null;
  stakeWeight: number;
}> }

// blackjack
{ actions: Array<{ seat: number; move: 'hit'|'stand'|'double'|'split'|'insurance' }> }
```

파일: `packages/game-engine/src/games/*.ts`, `apps/web/src/features/casino/game-config.ts`

---

## 6. 라우트 · URL (10게임)

| URL | gameCode |
|-----|----------|
| `/casino/crash` | crash |
| `/casino/dice` | dice |
| `/casino/mines` | mines |
| `/casino/plinko` | plinko |
| `/casino/limbo` | limbo |
| `/casino/hilo` | hilo |
| `/casino/mint-reels` | mint_reels |
| `/casino/gold-rush` | gold_rush |
| `/casino/roulette` | roulette |
| `/casino/blackjack` | blackjack |
| `/games` | 카탈로그 (placeholder) |

`casinoGamePath()` — underscore → hyphen. 등록: `apps/web/src/router.ts` + `routes/casino.tsx`.

---

## 7. 핵심 파일 맵

| 용도 | 경로 |
|------|------|
| 이식 가이드 | `apps/web/PRESENTATION_IMPORT.md` |
| 엔진 계약 | `docs/GAMES-INTEGRATION.md` |
| P1 스펙 | `docs/LOVABLE_P1_FINAL_PHONARA.md` |
| ADD_GAME | `docs/ADD_GAME_RUNBOOK.md` |
| 게임 props | `apps/web/src/components/games/shared/types.ts` |
| E2E testid | `apps/web/src/features/casino/casino-e2e-testids.ts` |
| Preview smoke | `tests/e2e/casino-preview-smoke.spec.ts`, `playwright.casino-smoke.config.ts` |
| Heavy casino E2E | `tests/e2e/casino.spec.ts` |
| E2E lifecycle | `scripts/run-e2e.ts`, `scripts/lib/e2e-lifecycle.ts` |
| 마이그레이션 | `supabase/migrations/20260614000088`–`96` |

---

## 8. Cursor 규칙 (이식 작업 시)

- `95-presentation-import-absorption` — Lovable 시각 1:1, 엔진 no-touch
- `77-e2e-lifecycle` — `bun run test:e2e` / `test:e2e:casino-smoke` only, raw `playwright test` 금지
- `75-workspace-hygiene` — E2E 후 `bun run clean`, `check:hygiene`
- Supabase project lock: `yocjhjsdwoijfdrehzoq` only

---

## 9. 새 채팅 첫 지시 (복붙용)

```text
@docs/CHAT_HANDOFF_2026-06-14.md @docs/LOVABLE_HANDOFF.md @docs/GAMES-INTEGRATION.md 기준으로 이어서 진행해줘.

확정 원칙:
- 엔진(10종 game_code, RPC, 정산, packages/*, supabase/*) 무수정.
- 모든 UI/UX는 Lovable ZIP-1 paste (4종 풀 UI + 카탈로그 10카드). 6종 freeze.

현재 상태:
- HEAD 2d2547e, check + db reset + SQL 41/41 + parity + test:e2e:casino-smoke green.
- 4종 게임 UI는 placeholder만 — Lovable ZIP-1 대기.

다음 작업 (우선순위):
1) Lovable v2 플랜 §0에 roulette split value (lower adjacent, not sum) 반영 확인 후 ZIP-1 착수/수신
2) ZIP 도착 시 §4 paste map + casino.tsx 어댑터 축소 + i18n + test:e2e:casino-smoke
3) (선택) remote migration 88–96 apply

Lovable v2 플랜 본문은 이전 채팅에 있음 — split 인코딩만 RED 수정 후 승인.
```

---

## 10. 이 세션 대화 타임라인 (맥락 복원)

1. **끊긴 작업 복구** — 16 todo 카지노 엔진 + 「전부 V」게이트
2. **게이트 green** — check, db reset, parity, SQL 41, migration lock OK
3. **E2E 느림** → **preview smoke** 도입 (`test:e2e:casino-smoke`)
4. **E2E lifecycle** 규칙·스크립트 정리
5. **커밋** `2d2547e`
6. **Lovable 10게임 UI 플랜 v1** 검토 → 계약 충돌 지적 (turbo, roulette, testid, i18n)
7. **원칙 재확인** — 엔진 보존 + Lovable 100% UI
8. **Lovable 플랜 v2** 검토 → 대부분 승인, **roulette split value**만 RED 잔족

---

## 11. 하지 말 것 (재확인)

- ❌ UI 이식 중 엔진/마이그레이션/RPC 수정 (별도 승인 작업)
- ❌ Lovable 비주얼 restyle·@phonara/ui로 다시 그리기
- ❌ raw `playwright test` (Windows orphan 프로세스)
- ❌ `casino-submit-bet` testid
- ❌ slot selection에 `turbo`
- ❌ roulette `street/corner/line/dozen/column` type
- ❌ roulette split `value` = sum

---

*마지막 갱신: 2026-06-14 · HEAD `2d2547e` · 작성: Cursor 세션 인계*
