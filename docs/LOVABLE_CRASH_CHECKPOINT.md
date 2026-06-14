# Crash 1차 체크포인트 — PHONARA 보정 v3 (Lovable 내부 QA)

> **용도:** Lovable 워크스페이스에서 Crash 품질 검증. **PHONARA Cursor 이식은 최종 단일 ZIP 이후 일괄 진행** — `docs/LOVABLE_P1_FINAL_PHONARA.md` 납품 방식 참고.

방향 + PHONARA 보정 전량 수용. **시각·레이아웃·모션·밀도 1px도 수정 금지** — (a) `CrashGame.tsx` 5파일 순수 분리, (b) Controls testid 5개 + shared 어댑터 testid 제거, (c) 테스트·스펙·문서·체크포인트만 추가. 충돌 시 PHONARA 보정 우선.

---

## 보정 반영 매트릭스

| 항목 | 적용값 |
|---|---|
| 라우트 | `/casino/crash` — 프리뷰용 `src/routes/casino.crash.tsx`는 둠. **PHONARA ZIP에서는 제외** (Cursor `router.ts`만 등록) |
| Playwright config | 루트 기존 `playwright.config.ts` projects 배열에만 추가. 없으면 spec만 둠 |
| baseURL | `http://127.0.0.1:3000` |
| webServer | `tsx scripts/e2e-dev-server.ts web 3000` |
| 스크립트 | `check` 손대지 않음. `test:e2e:games:crash`, `test:e2e:update`, `checkpoint:crash` 3개만 추가 |
| testid | 9개 표준. Lovable은 Controls 5개만 |
| i18n | 신규 키 0. `packages/i18n` 우선, 없으면 현 `src/i18n/{ko,en}.ts` grep |
| 산출물 | `docs/checkpoints/crash/` |
| 픽셀 가드 | PHONARA paste 후 `--update-snapshots` 1회, CI `maxDiffPixelRatio: 0.01`. placeholder 베이스라인 커밋 금지 |
| **Export 이름** | **`ImportedCrashGame` named export 필수** (registry가 `m.ImportedCrashGame` 참조). default export 단독 금지 |
| **Props 타입** | **`ImportedGameSurfaceProps` (제네릭 없음)** — PHONARA paste 시 타입체크 즉시 통과 |

---

## A. 경로 Paste Map

| Lovable | PHONARA |
|---|---|
| `src/games/crash/Stage.tsx` | `apps/web/src/components/games/crash/Stage.tsx` |
| `src/games/crash/HUD.tsx` | `apps/web/src/components/games/crash/HUD.tsx` |
| `src/games/crash/Controls.mobile.tsx` | `apps/web/src/components/games/crash/Controls.mobile.tsx` |
| `src/games/crash/Controls.desktop.tsx` | `apps/web/src/components/games/crash/Controls.desktop.tsx` |
| `src/games/crash/index.tsx` | `apps/web/src/components/games/crash/index.tsx` |
| `src/games/crash/__tests__/*` | `apps/web/src/components/games/crash/__tests__/*` |
| `tests/e2e/games/crash.spec.ts` | `tests/e2e/games/crash.spec.ts` |

`src/routes/casino.crash.tsx`는 **ZIP 제외** (`.lovableignore` 또는 export 매니페스트에 명시).

PHONARA registry:

```ts
crash: () => import('./crash').then((m) => ({ ImportedGame: m.ImportedCrashGame })),
```

---

## B. testid 9개 소유 분리

**Lovable(Controls) 5개:**

| testid | DOM |
|---|---|
| `casino-stake-input` | Controls stake `<input>` |
| `casino-client-seed-input` | Controls/Fairness seed `<input>` |
| `casino-prepare-hash` | Controls prepare CTA |
| `casino-place-bet` | Controls primary CTA |
| `casino-error` | Controls error/disabledReason surface |

**Cursor 어댑터 4개 — Lovable shared에서 제거:** `casino-fairness-verifier`, `casino-bet-confirm`, `casino-bet-confirm-confirm`, `casino-bet-confirm-cancel`.

비표준(`casino-confirm-bet`, `casino-cancel-bet`) 잔존 시 전량 삭제.

정의: `apps/web/src/features/casino/casino-e2e-testids.ts`

---

## C. UI 5파일 분리 (픽셀 동일)

```
src/games/crash/
  Stage.tsx              ← canvas + multiplier 그래프
  HUD.tsx                ← status badge, recent multipliers
  Controls.mobile.tsx    ← BetPanel 모바일 한손
  Controls.desktop.tsx   ← BetPanel 데스크탑 + 단축키
  index.tsx              ← named export ImportedCrashGame, Stage/HUD/Controls 조립 + 미디어쿼리 분기
```

규칙:

- JSX/className/공백 그대로 이동
- `index.tsx`: `export function ImportedCrashGame(props: ImportedGameSurfaceProps) { … }` — **제네릭 없음**. 내부 파일은 좁힌 타입 가능, **외부 노출은 unparameterized**
- `useMockPipeline`/`useCasinoRoundPipeline` 호출 위치 변경 금지
- 분리 전/후 mobile(390×844)·desktop(1280×800) 스크린샷 diff = 0
- 기존 `CrashGame.tsx`는 `index.tsx`로 대체 후 삭제

---

## D. Vitest

기존 `CrashGame.contract.test.tsx` 7/7 유지. 추가:

- `Stage.test.tsx` — props-only render smoke
- `HUD.test.tsx` — `bet`/`commitment` 상태 텍스트
- `Controls.test.tsx` — testid 5개 + `onPrepareRound`/`onOpenBetConfirm`/`onSubmitBet`
- `prefers-reduced-motion` smoke — `matchMedia` mock, 렌더만

게임 JSX/CSS 변경 0.

---

## E. Playwright E2E (`tests/e2e/games/crash.spec.ts`)

Lovable에 `casino-e2e-testids` 없음 → **로컬 상수** 9개 이름 1:1. PHONARA paste 후 Cursor가 모듈 import로 치환.

```ts
const TESTIDS = [
  'casino-stake-input','casino-client-seed-input','casino-prepare-hash',
  'casino-place-bet','casino-error','casino-fairness-verifier',
  'casino-bet-confirm','casino-bet-confirm-confirm','casino-bet-confirm-cancel',
] as const;

test.describe('crash surface', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/casino/crash'); });
  for (const id of TESTIDS) {
    test(`testid ${id} attached`, async ({ page }) => {
      await expect(page.getByTestId(id)).toBeAttached();
    });
  }
});
```

- 머니 RPC 호출 0
- 베이스라인 캡처는 PHONARA paste 후 별도 턴
- `tests/e2e/casino.spec.ts` money/PF E2E **삭제·수정 금지**

---

## F. 체크포인트 스크립트 (`scripts/checkpoint-crash.mjs`)

`bun run checkpoint:crash` → `docs/checkpoints/crash/`:

| 파일 | 생성 |
|---|---|
| `screens/crash-mobile.png` · `crash-desktop.png` | Playwright raw 캡처 |
| `vitest.log` | `vitest run src/games/crash` tee |
| `e2e.log` | `playwright test tests/e2e/games/crash.spec.ts` tee |
| `i18n-crash-keys.txt` | `packages/i18n` 우선 → 없으면 `src/i18n` grep |
| `bundle-size.txt` | `game-crash` chunk gzip |
| `wiring.md` | 9 testid ↔ 8 콜백 + Mermaid |

stdout 마지막에 6항목 체크리스트.

---

## G. `wiring.md` 매핑

```
casino-stake-input          → onStakeChange
casino-client-seed-input    → onClientSeedChange
casino-prepare-hash         → onPrepareRound
casino-place-bet            → commitment ? onOpenBetConfirm : onPrepareRound
casino-error                → (read-only)
casino-fairness-verifier    → (adapter trigger)
casino-bet-confirm          → (adapter dialog root)
casino-bet-confirm-confirm  → onSubmitBet
casino-bet-confirm-cancel   → onCancelBetConfirm
```

`onCurrencyChange`/`onSelectionChange` — currency 토글·autoCashout → `onSelectionChange`. Mermaid: prepare → commitment → open-confirm → submit-bet.

---

## H. 6항목 제출 매핑

| # | 항목 | 파일 |
|---|---|---|
| 1 | Stage/HUD/Controls 스크린 | `docs/checkpoints/crash/screens/` |
| 2 | 콜백 와이어링 | `docs/checkpoints/crash/wiring.md` |
| 3 | vitest + e2e 로그 | `vitest.log`, `e2e.log` |
| 4 | testid 9 DOM | `e2e.log` + `screens/` |
| 5 | i18n Crash 키 | `i18n-crash-keys.txt` |
| 6 | `game-crash` gzip | `bundle-size.txt` |

---

## I. 안 하는 것

- Crash JSX/CSS/모션/spacing 변경
- 엔진/RPC/`use-casino-round.ts`/hooks/domain 수정
- 신규 i18n 키 추가
- money/PF E2E 변경
- `bun run check` 변경
- 비표준 testid 재도입
- `src/routes/casino.crash.tsx`를 ZIP에 포함
- 나머지 5종 — 최종 단일 ZIP에 포함 (Crash만 선행 이식하지 않음)

---

## J. 실행 순서

1. `CrashGame.tsx` → 5파일 분리. `export function ImportedCrashGame(props: ImportedGameSurfaceProps)`
2. Controls testid 5개, shared에서 어댑터 testid 4개 제거
3. vitest 4개 추가 → green
4. `tests/e2e/games/crash.spec.ts` (로컬 TESTIDS)
5. `checkpoint-crash.mjs` + package.json 3 스크립트
6. `wiring.md` + 프리뷰 라우트 + ZIP 제외 매니페스트
7. mobile/desktop 프리뷰 스크린샷 (Cursor 베이스라인 교차 확인용)

스크린샷 베이스라인 커밋은 **PHONARA paste 후** 별도 턴.

---

## Cursor paste 후 (참고)

1. `apps/web/src/components/games/crash/*` 일괄 paste
2. `registry.ts`가 `ImportedCrashGame` named export 인식 확인
3. E2E import → `casino-e2e-testids.ts`
4. `injectBrowserSession` + `/casino/crash`
5. `--update-snapshots` 1회
6. 최종 ZIP 일괄 이식 시 §14 구 UI 삭제 · `bun run check` · money E2E
