# P13 Launch Closeout Bundle Checklist (§20.14.4 · §25.8.1)

> **상태:** Active OPS/DOC canon · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `p13-closeout-bundle` (#236)  
> **선행:** `da-w7-operator-visual-dae-signoff` (#235) agent impl **`[x]`**  
> **후행:** T1 ramp `launch-ramp-t1-feature-gates` (#237) → T2 `launch-scale-t2-triggers` (#238)  
> **코드 계약:** [`p13-closeout-display-contract.ts`](../../apps/web/src/domain/p13-closeout-display-contract.ts)  
> **CI 정본:** [`CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md)  
> **엔진 경계:** migration · `packages/*-engine` **코드 diff 0** (non-waivable)  
> **51차 merge:** `p13-closeout-legacy-class-purge` + `p13-closeout-docs` + `p13-closeout-ci` → **동일 PR**

본 문서는 **공식 실거래 GO** (`p13-closeout-bundle`) 정본이다.  
Soft Launch(#233)·W7 strict(#234)·W7 VISUAL(#235) 이후 Track A 마감 게이트.

---

## 1. 30초 요약

| 항목               | Closeout 의미                                                                 | 판정                |
| ------------------ | ----------------------------------------------------------------------------- | ------------------- |
| Legacy class purge | `text-primary` 등 **0** · theme bridge **0** · `check:design-tokens --strict` | agent gate          |
| Docs sync          | ACTIVE_WORK · CURRENT_STATUS · REBUILD_PLAN · AGENTS · 본 canon               | §82                 |
| CI gate            | quality · sql · e2e · advisors green · VISUAL 6종 · money E2E Σ=0             | **GitHub CI** (G13) |
| 코드 diff 0        | migration / `*-engine` 변경 **0**                                             | PR                  |
| 다음               | T1 feature gates ramp                                                         | Track A             |

---

## 2. 체크리스트 (3섹션 · 51차 흡수)

### 2.1 Legacy class purge (`p13-closeout-legacy-class-purge`)

| #   | 확인                                                                                              | 완료 |
| --- | ------------------------------------------------------------------------------------------------- | ---- |
| L1  | `bun run check:design-tokens -- --strict` exit 0                                                  | [x]  |
| L2  | theme.css에 `--color-primary` / `--color-muted-foreground` **0**                                  | [x]  |
| L3  | product/routes에 `text-primary` · `text-muted-foreground` · `bg-primary` · `border-primary` **0** | [x]  |
| L4  | da-w7 `#234` strict GATE **`[x]`** (선행 purge)                                                   | [x]  |

Canonical: `text-accent` · `text-foreground-muted` · `MoneyDisplay` only (§25.8.1).

### 2.2 Docs sync (`p13-closeout-docs`)

| #   | 확인                                                                                | 완료 |
| --- | ----------------------------------------------------------------------------------- | ---- |
| D1  | `docs/SSOT/ACTIVE_WORK_SSOT.md` — `#236` DONE · NEXT=`launch-ramp-t1-feature-gates` | [x]  |
| D2  | `docs/CURRENT_STATUS.md` §AI Todo Sync 행 `[x]`                                     | [x]  |
| D3  | `docs/PRODUCT/REBUILD_PLAN_v1.md` NEXT 갱신                                         | [x]  |
| D4  | `AGENTS.md` Next 줄 갱신                                                            | [x]  |
| D5  | 본 canon `P13_LAUNCH_CLOSEOUT_BUNDLE.md` 존재                                       | [x]  |

### 2.3 CI gate (`p13-closeout-ci`)

| #   | 확인                                                                     | 완료 |
| --- | ------------------------------------------------------------------------ | ---- |
| C1  | Required CI jobs: **quality · sql · e2e · advisors** (pin · Verified=CI) | [x]  |
| C2  | VISUAL 6종 contracts on disk (P3/P4/P6/P8/P9/P10)                        | [x]  |
| C3  | Money E2E domains: wallet · trade · bet · casino (CI e2e · Σ=0)          | [x]  |
| C4  | Local: `gate:ai-impl` owner vitest green (agent Implemented)             | [x]  |
| C5  | Heavy `check:full` = **CI only** — agent 로컬 실행 **금지** (G13)        | [x]  |

**VISUAL 6종:**

| Todo                          | Domain          |
| ----------------------------- | --------------- |
| `p3-operator-visual-signoff`  | Landing · Auth  |
| `p4-operator-visual-signoff`  | Wallet · Money  |
| `p6-operator-visual-signoff`  | AppShell        |
| `p8-operator-visual-signoff`  | Home · Core     |
| `p9-operator-visual-signoff`  | Trade           |
| `p10-operator-visual-signoff` | Sports · Casino |

---

## 3. Agent Implemented evidence (2026-07-11)

| 산출                 | 경로                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| Display contract     | `apps/web/src/domain/p13-closeout-display-contract.ts`                |
| Contract tests       | `apps/web/src/domain/__tests__/p13-closeout-display-contract.test.ts` |
| Strict tokens (선행) | `da-w7-enforcement-strict-tokens` · `check:design-tokens --strict`    |
| Ops canon            | 본 문서                                                               |

**판정:** Launch Closeout **agent Implemented** (L0~L4 · legacy 0 · docs sync · `gate:ai-impl` **16/16**).  
**Verified/공식 GO:** push 후 CI **quality·sql·e2e·advisors** green + operator 「배포」 시 prod (§30.1).

---

## 4. 명령 치트시트

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb

bun run check:design-tokens -- --strict
bun run gate:ai-impl -- --test apps/web/src/domain/__tests__/p13-closeout-display-contract.test.ts
# push 후 (heavy = CI):
bun run ci:watch
```

---

## 5. 교차 참조

| 문서                                                     | 용도                      |
| -------------------------------------------------------- | ------------------------- |
| [`P13_SOFT_LAUNCH_BUNDLE.md`](P13_SOFT_LAUNCH_BUNDLE.md) | Soft Launch 선행          |
| [`P13_T0A_PROD_PREFLIGHT.md`](P13_T0A_PROD_PREFLIGHT.md) | T0-A · MFA/자본 DEFER     |
| [`CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md)   | G13 · required jobs       |
| Plan §20.14.4 · §25.8.1                                  | 공식 GO · P13 strict 승격 |

---

**Implemented:** display-contract · vitest · docs sync · 본 canon  
**다음:** `ew-e1-decay-wave` (#240) — E0 `#239` **`[x]` DONE** · T2 scale `#238` **`[x]` DONE** · T1 `#237` **`[x]`**
