# 플랫폼 감사 C — Surface controls / dead control / domain boundary / i18n parity

> **일자:** 2026-07-08 · **범위:** Section C (읽기 전용) · **선행:** `pqa-audit-b-rpc-contract` `[x]`  
> **판정 태그:** `PASS` / `FAIL` / `P1` / `P2` / `P3` / `UNVERIFIED` (`30-audit-discipline`)

---

## 실행 요약

| 항목                                              | 정적 스캔 (repo)                     | 최종 판정                        |
| ------------------------------------------------- | ------------------------------------ | -------------------------------- |
| Route 파일 (`createFileRoute`)                    | **66**                               | **PASS** (Plan 65+1 layout·실측) |
| Surface page (`*-page.tsx`)                       | **54**                               | **PASS** (Plan 54 일치)          |
| `check:phase-r-guards --strict` (import)          | **0** violation                      | **PASS** §12.19                  |
| Route↔surface-domain-boundary                     | **65/66** mapped · **1** neutral gap | **P3** (`/r/$code`)              |
| Dead control P2 (empty handler·`disabled={true}`) | **0**                                | **PASS**                         |
| Soon stub / permanent disabled (문서화)           | **6** rows                           | **P3** (defer 명시)              |
| Casino `/games/*` 12 slug routes                  | **0/12** mounted                     | **P3** (P10 infra)               |
| `check:i18n` (Korean JSX)                         | **green**                            | **PASS**                         |
| Presentation ko/en parity                         | **4006 / 4006** · gap **0**          | **PASS**                         |
| Surface `t('key')` ↔ shipped catalog              | **0** missing                        | **PASS**                         |
| English attr literal (check:i18n 미검)            | **0** (54 page scan)                 | **PASS**                         |

**재현 스크립트:**

```powershell
bun run tsx scripts/audit/audit-c-surface-controls.ts
bun run check:i18n
```

**산출 JSON:** `scripts/audit/last-c-surface-controls-report.json`

---

## 1. Route 인벤토리 (66)

스캐너: `scripts/audit/audit-c-surface-controls.ts` — `apps/web/src/routes/**/*.tsx` · `createFileRoute('…')` 전수.

| 도메인                     | route 수 (대표) | boundary SOT                                                        |
| -------------------------- | --------------- | ------------------------------------------------------------------- |
| earn                       | 12              | `/home` · `/referral` · `/tier` · `/share/earnings` · `/onboarding` |
| wallet                     | 14              | `/wallet` · `/ledger` · `/rewards`                                  |
| trade                      | 6               | `/trade` · `/staking`                                               |
| sports                     | 7               | `/sports`                                                           |
| casino                     | 1               | `/casino` (hub stub only)                                           |
| account                    | 5               | `/account` · `/settings` · `/notifications`                         |
| auth/landing/legal/neutral | 21              | `resolveDomainForRoute` landing · legal · auth · neutral            |

**Layout-only (Outlet · surface import 없음):** `/wallet` · `/wallet/deposit` · `/wallet/withdraw` · `/trade` · `/sports` · `/onboarding` — **PASS** (shell nesting 정상).

**미등록 route (P3):**

| route      | file                                | 판정                                                                                                 |
| ---------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/r/$code` | `apps/web/src/routes/r/$code.tsx:3` | **P3** — viral redirect · `surface-domain-boundary`에 prefix 없음 · 의도된 neutral (등록 defer 허용) |

---

## 2. Surface page 인벤토리 (54)

`product/surfaces/**/*-page.tsx` (tests 제외) **54** — Plan 실측과 **1:1**.

| folder                                                             | pages                 | domain  | route wired     |
| ------------------------------------------------------------------ | --------------------- | ------- | --------------- |
| home · referral · tier · share · onboarding                        | 9                     | earn    | **yes**         |
| wallet · rewards                                                   | 10                    | wallet  | **yes**         |
| trade · staking                                                    | 6                     | trade   | **yes**         |
| sports                                                             | 1                     | sports  | **yes**         |
| account · settings · notifications                                 | 11                    | account | **yes**         |
| login · signup · auth · landing · legal · install · verify · reset | 17                    | neutral | **yes**         |
| shell                                                              | 1 (`domain-hub-page`) | neutral | casino hub only |

**Orphan surface folder:** **0** · **Unwired page:** **0**

---

## 3. §12.19 도메인 격리 · route↔boundary

`collectPhaseRGuardViolations()` (`scripts/check-phase-r-guards.ts`) 재사용 — **0건**.

| 검사                                          | 결과  | 근거                                      |
| --------------------------------------------- | ----- | ----------------------------------------- |
| Cross-domain surface import                   | **0** | JSON `phaseRGuards: []`                   |
| Cross-domain feature import                   | **0** | 동일                                      |
| Route domain ≠ imported surface folder        | **0** | JSON `domainBoundary.boundaryFails: []`   |
| Forbidden embed / subnav in surface           | **0** | 동일                                      |
| Orphan `product/surfaces/*` folder            | **0** | `resolveDomainForSurfaceFolder` 전부 등록 |
| Parallel duplicate `-page.tsx` (cross-domain) | **0** | 동일                                      |

**관찰 (PASS):** `/casino` → `surfaces/shell/domain-hub-page` — route domain `casino` · folder `shell`(neutral) · **허용** (sparse hub · casino chapter chrome만).

---

## 4. Dead control · soon stub · permanent disabled 목록

Plan §33.3 #5 후보 **확정** + 정적 CTA/폼 스캔.

### 4.1 P3 — 문서화된 defer / stub (수정 큐: `pqa-fix-dead-controls` 또는 P10)

| #   | id                           | severity | evidence                                                     | note                                             |
| --- | ---------------------------- | -------- | ------------------------------------------------------------ | ------------------------------------------------ |
| 1   | `casino-route-hub-stub`      | P3       | `apps/web/src/routes/casino.tsx:6` → `DomainHubPage`         | title-only hub · game lobby 미착수               |
| 2   | `casino-round-hook-orphan`   | P3       | `apps/web/src/features/casino/use-casino-round.ts:38`        | RPC hook 존재 · game surface 0                   |
| 3   | `casino-game-routes-missing` | P3       | `surface-domain-boundary.ts:33–46` · **12/12** slug          | `/games/{slug}` route 파일 **0**                 |
| 4   | `settings-api-keys-stub`     | P3       | `api-keys-settings-page.tsx:27`                              | ENGINE:gap STUB · hub `built_hidden`             |
| 5   | `api-keys-create-disabled`   | P3       | `api-keys-settings-page.tsx:142` `disabled={!canManageKeys}` | `canManageTradingApiKeys()` 항상 false           |
| 6   | `sports-vip-coming-soon`     | P3       | `sports-page.tsx:79–86` `SportsVipStubPanel`                 | `t('sports.system.coming_soon')` · `/sports/vip` |

### 4.2 UNVERIFIED — heuristic (P2 아님)

| id                  | file:line                        | evidence                                                                | note                                                   |
| ------------------- | -------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| `button-no-handler` | `api-keys-settings-page.tsx:134` | `data-testid="settings-api-keys-create"` · opening tag에 `onClick` 없음 | **의도적** permanent disabled stub · dead control 아님 |

### 4.3 P2 dead control (런타임 무효 CTA)

| 검사                            | 결과                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `onClick={() => {}}`            | **0**                                                                                                              |
| `href="#"`                      | **0**                                                                                                              |
| `disabled={true}` literal       | **0**                                                                                                              |
| P8/P9 `*_DEAD_CONTROL_TEST_IDS` | vitest signoff (`p8-core-visual-signoff` · `p9-trade-visual-signoff`) — **별도 gate green** · C 정적 스캔 **PASS** |

### 4.4 built_hidden 계약 (표시 0 = dead control 아님)

Display contract상 UI **미노출** 확인 (정적 grep · **PASS**):

- Trade hedge toggle · reduce-only · spot limit (flag off) — `trade-order-states-display-contract.ts`
- Sports combo/SGP/system/cashout tabs — `sports-cashout-combo-display-contract.ts` · `sports/` surface grep **0**

---

## 5. i18n · ko/en parity (check:i18n 미검 영역 포함)

| 검사                                          | 결과                        | 근거                                            |
| --------------------------------------------- | --------------------------- | ----------------------------------------------- |
| `bun run check:i18n`                          | **PASS**                    | Korean JSX outside catalog **0**                |
| Surface 54 page Korean literal                | **0**                       | JSON `i18n.koreanJsx: []`                       |
| `presentation-ko.ts` ↔ `presentation-en.ts`   | **4006 / 4006** · gap **0** | JSON `presentationKoWithoutEn: 0`               |
| Surface literal `t('key')` missing catalog    | **0**                       | shipped catalog union **6368** keys             |
| English JSX attribute literal (`title=` etc.) | **0**                       | 54 page scan · check:i18n **미검** 영역도 **0** |

**관찰 (PASS · technical token):** `USDT` / `PHON` currency label — `staking-hub-page.tsx:224` · `sports-bet-slip-panel.tsx:129` · i18n key 아님 · §13.1.1 dual-currency 표기.

**check:i18n 미커버 (정책):** non-Korean JSX · English attribute literals — 본 C 스캔 **0건** · 지속 gate는 `check:i18n` + surface `t()` only.

---

## 6. UNVERIFIED

| 항목                                      | 이유                                                 |
| ----------------------------------------- | ---------------------------------------------------- |
| 런타임 dead control (axe · E2E click)     | G13 — CI/operator gate 위임                          |
| Dynamic `t(\`key.${var}\`)` key existence | 정적 literal-only 검증 · template key **UNVERIFIED** |
| `/r/$code` redirect target surface        | redirect-only · UI control 없음                      |

---

## 7. D 착수 게이트

- [x] C dead control / stub 목록 + JSON 산출 + 재현 스크립트
- [x] B 선행 (`PLATFORM_AUDIT_B_RPC_CONTRACT_2026-07-08.md`)
- [x] 66 route · 54 surface · §12.19 **0** violation
- [x] i18n Korean + presentation parity **PASS**

**`pqa-audit-d-config-state` 착수 가능** — app_config↔게이트·advisor read-only.

---

## 교차 참조

- Plan: `phase_r_super-app_8bdf2c10` §33.2 #C
- 선행: `docs/audit/PLATFORM_AUDIT_B_RPC_CONTRACT_2026-07-08.md`
- 스크립트: `scripts/audit/audit-c-surface-controls.ts`
- JSON: `scripts/audit/last-c-surface-controls-report.json`
- 수정 큐: `pqa-fix-dead-controls` · P10 casino infra · **`pqa-audit-report` `[x]`** · NEXT `pqa-fix-error-mapping`
