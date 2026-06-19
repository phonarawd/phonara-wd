# PHONARA · Lovable ZIP 수신 · paste 준비 (operator)

> **갱신:** 2026-06-18  
> **목적:** Lovable canvas UI/UX 완료 후 **코드베이스 ZIP**을 PHONARA repo로 가져오기 **전·후** 체크리스트  
> **정본 경로:** [`apps/web/PRESENTATION_IMPORT.md`](../apps/web/PRESENTATION_IMPORT.md) · [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §2 L2

---

## 0. 한 줄

Lovable에서 ZIP 다운로드 → **`.lovable-intake/` 검증** → operator **「PHONARA paste GO Wave-N」** → Cursor가 presentation만 흡수 · **엔진 0-touch**.

---

## 1. 게이트 (순서 고정)

| # | 조건 | operator 신호 |
|---|------|----------------|
| G1 | Lovable canvas vitest/i18n §GREEN (현재 carry: **658/658** · i18n **2712/2712**) | (완료 확인) |
| G2 | Lovable에서 demo/테스트 라벨 제거 | Lovable 쪽 최종 sweep |
| G3 | ZIP export | Lovable **Download codebase** |
| G4 | PHONARA intake PASS | `bun run lovable:intake` |
| G5 | paste 본 실행 | **`PHONARA paste GO Wave-1`** (또는 Wave-2 Admin 등) |

**금지:** intake PASS만으로 paste 시작 · Engine/Supabase/hooks 수정 · operator GO 없이 `apps/web` 대량 교체.

---

## 2. Lovable에서 ZIP 받기 (export 전 체크)

- [ ] 사용자 노출 **Test / Debug / TODO / Lorem** 문구 0 (release gate)
- [ ] **Lovable Cloud / Supabase / OAuth / 결제** 백엔드 연결 **0** (presentation only)
- [ ] `console.log` 등 디버그 출력 정리 (또는 DEV 게이트)
- [ ] 게임 12종 + shell + home/casino/sports 등 **scope 내 surface** 빌드 green
- [ ] i18n `ko.ts` / `en.ts` **DIFF=0** (Lovable canvas 기준)

Export 후 ZIP 파일명에 날짜 권장: `phonara-lovable-YYYY-MM-DD.zip`

---

## 3. PHONARA repo — ZIP 넣고 검증

### 3.1 디렉터리

```text
.lovable-intake/
  incoming/     ← ZIP drop (커밋 안 함)
  staging/      ← unzip 결과 (커밋 안 함)
  last-intake-report.json
```

### 3.2 명령

```bash
bun run lovable:intake -- --zip .lovable-intake/incoming/phonara-lovable-2026-06-18.zip

bun run lovable:intake -- --plan

bun run lovable:intake -- --clean
```

### 3.3 intake PASS 기준

| 항목 | PASS |
|------|------|
| `src/` 발견 | `components/` 또는 `i18n/` 존재 |
| secrets | `SUPABASE_SERVICE_ROLE` · `service_role` · `sk_live_` **0 hit** |
| games | `crash` … `momentum` 등 Lovable `src/games/*` 목록 출력 |
| i18n | ko/en 키 수 리포트 (paste 시 `packages/i18n` merge) |

release-scan WARN(TODO/console)은 **paste 전 Lovable 재-export** 권장 — FAIL은 secrets만.

---

## 4. paste 구역 (Wave-1 요약)

| Lovable (`src/`) | PHONARA |
|------------------|---------|
| `components/ui/*` | `apps/web/src/components/ui/` |
| `components/shell/*` | `apps/web/src/components/shell/` |
| `components/{earn,trade,fomo,welcome,sports}/*` | 동명 `components/` |
| `games/<game>/*` | `apps/web/src/components/games/<game>/` (**ADAPT** · mock pipeline 제거) |
| `routes/*.tsx` (page UI) | `apps/web/src/presentation-import/pages/*` |
| `i18n/{ko,en}.ts` | `packages/i18n` **merge** (키만 · JSX inline 0) |
| global CSS/tokens | `apps/web/src/styles/presentation-import-tokens.css` |

### 절대 paste 금지 (SKIP)

- `supabase/**` · `packages/**` (money/game-engine/wallet-ledger)
- `hooks/**` (except `use-toast` shim) · `contexts/**` · `features/*/use-*.ts`
- `src/games/preview/useMockPipeline.ts`
- `.lovable/**` · `dist-phonara-package.zip`

**엔진 경계:** Lovable UI는 **display props / callbacks**만 · `useCasinoRoundPipeline` · `useWallet` 등은 **route adapter**에 유지.

---

## 5. paste Wave 순서 (L2 큐)

정본: `PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` §3.2

| Wave | scope | operator GO |
|------|--------|-------------|
| **Wave-1** | shell · pages · games UI · i18n merge · tokens | `PHONARA paste GO Wave-1` |
| Wave-2 | wallet UI (L1-10-W) | paste Wave-1 §GREEN 후 |
| Wave-Admin-1 | `apps/admin` sports desk UI | Admin Lovable §GREEN 후 |
| 이후 | adapters · E2E G9 · check:full | Wave별 §GREEN |

---

## 6. paste 후 게이트 (Wave 마감)

```bash
bun run typecheck
bun --filter @phonara/web build
bun run check:i18n
bun run check:release
bun run test:e2e:casino-smoke
bun run check:hygiene
```

전 Wave 완료: `bun run check:full`

---

## 7. operator → Cursor paste GO 템플릿

ZIP intake **PASS** 확인 후 채팅에 붙여넣기:

```text
PHONARA paste GO Wave-1
ZIP: .lovable-intake/incoming/phonara-lovable-2026-06-18.zip (intake PASS)
Engine NO-TOUCH · ADAPT mock pipeline · i18n merge only
```

---

## 8. FAQ

**Q. Lovable ZIP = PHONARA `dist-phonara-package.zip`?**  
A. **아님.** Lovable export ZIP은 **canvas → PHONARA paste**용. PHONARA repo에서 ZIP **발행**은 operator 「ZIP 발행 GO」 별도.

**Q. intake만 하면 paste 끝?**  
A. **아님.** intake는 extract + 검증 + plan. 실제 COPY/ADAPT는 **paste GO** 후 Cursor Wave.

**Q. 게임 placeholder (`imported-*-game.tsx`)는?**  
A. Wave-1에서 Lovable `src/games/*`로 **교체** · registry/route adapter는 유지 · engine hook wiring 변경 **금지**.

---

## 9. 관련 문서

- `apps/web/PRESENTATION_IMPORT.md` — paste map · adapter pattern
- `PHONARA_CURSOR_PASTE_CRUSH_LOCK.md` — Crush P0–P7
- `PHONARA_CURSOR_PASTE_CRUSH_P2_0_PASTE_MAP.md` — 게임 allowlist
- `PHONARA_NEW_CHAT_HANDOFF_GAMES_POLISH_2026-06-18.md` — L1-GP baseline
