import { writeFileSync } from 'node:fs';

const doc = `# LOVABLE Wallet UI LOCK — L1-10-W \`/wallet\` Deposit / Withdraw mock v0.1

> **상태:** PLAN DRAFT · **EXECUTE 0** · operator GO 대기  
> **갱신:** 2026-06-16  
> **큐 ID:** **L1-10-W** (historical L1-10 carry와 **별개** — post-paste Wave-2 Lovable slice)  
> **상위:** [\`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md\`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.2 · [\`LOVABLE_OPERATOR_PROMPT_DISPATCH.md\`](LOVABLE_OPERATOR_PROMPT_DISPATCH.md)

---

## Scope (1줄)

\`/wallet\` hub + \`/wallet/deposit\` + \`/wallet/withdraw\` — cash/bonus/locked 분리 · mock tx list · deposit/withdraw flows (mock SOT only) · \`wallet.*\` i18n append · vitest · **rpc/supabase/PSP/KYC API 0**.

---

## 선결 조건 (EXECUTE GO 게이트)

| # | 게이트 | FAIL |
|---|--------|------|
| G1 | L1-09-S Step 9b manual **PASS 한 줄** | sports manual 미완 |
| G2 | operator 「Lovable 100% — sports 포함」+ 「ZIP 발행 GO」 | ZIP 전 착수 |
| G3 | PHONARA Wave-1 paste §GREEN 회귀 | paste 전 wallet EXECUTE |
| G4 | operator 「**L1-10-W EXECUTE GO**」 | Plan만으로 GO 주장 금지 |

**위 4건 전 EXECUTE 0** · 본 문서는 dispatch 조립용 LOCK 정본.

---

## Lovable 큐 (paste 전·후)

\`\`\`text
Step 9b PASS (sports) → Lovable 100% sports → ZIP Wave-1 → PHONARA paste Wave-1
→ §GREEN 회귀 → operator L1-10-W EXECUTE GO
→ W EXECUTE → Step 9 §GREEN → Step 9b W manual
→ Lovable 100% wallet → ZIP Wave-2
\`\`\`

---

## Slice bar (W1 / W2 / W3)

### W1 — Wallet hub (\`/wallet\`)

| 산출 | 설명 |
|------|------|
| \`WalletBalanceCard.tsx\` | cash / bonus / locked 분리 (mock SOT) |
| \`WalletTxList.tsx\` | 최근 20건 — deposit / withdraw / bet / payout / cashout / bonus |
| formatter | \`display-odds-multiply.ts\` 스타일 string only — \`Number()\`/\`parseFloat\` **0** |
| empty/error | \`common.empty.*\` / \`common.error.*\` 재사용 |

### W2 — Deposit mock (\`/wallet/deposit\`)

| 산출 | 설명 |
|------|------|
| \`DepositMethodList.tsx\` | bank / virtual account / crypto (mock · provider 0) |
| \`DepositAmountForm.tsx\` | preset 10k/50k/100k/500k + custom |
| \`DepositConfirmSheet.tsx\` | \`displayDepositPreview()\` mock fee/net |
| submit | mock pending tx push only |

### W3 — Withdraw mock (\`/wallet/withdraw\`)

| 산출 | 설명 |
|------|------|
| \`WithdrawForm.tsx\` | 출금 가능 = cash only (bonus/locked 제외) |
| \`WithdrawConfirmSheet.tsx\` | KYC gate badge (mock \`kyc.status\`) |
| gate block | \`gate.kyc.title\` / \`gate.withdrawal.title\` — canvas에 없으면 **append 1회** (common/gate rename 0) |
| submit | mock pending → **30s** timer → mock complete |

---

## Files (13 NEW + 2 edit)

### NEW (13)

| # | path |
|---|------|
| N1 | \`src/routes/wallet.tsx\` (layout · Outlet) |
| N2 | \`src/routes/wallet.index.tsx\` (W1 hub) |
| N3 | \`src/routes/wallet.deposit.tsx\` (W2) |
| N4 | \`src/routes/wallet.withdraw.tsx\` (W3) |
| N5 | \`src/components/wallet/WalletBalanceCard.tsx\` |
| N6 | \`src/components/wallet/WalletTxList.tsx\` |
| N7 | \`src/components/wallet/DepositMethodList.tsx\` |
| N8 | \`src/components/wallet/DepositAmountForm.tsx\` |
| N9 | \`src/components/wallet/DepositConfirmSheet.tsx\` |
| N10 | \`src/components/wallet/WithdrawForm.tsx\` |
| N11 | \`src/components/wallet/WithdrawConfirmSheet.tsx\` |
| N12 | \`src/hooks/useWalletMock.ts\` (localStorage SOT · TTL 0) |
| N13 | \`src/components/wallet/__tests__/Wallet.test.tsx\` |

**optional N14:** \`src/components/wallet/display-wallet.ts\` — \`displayDepositPreview\` · amount format (string/BigInt pattern)

### EDIT (2 · 최소)

| # | path | 변경 |
|---|------|------|
| E1 | \`src/components/BottomNav.tsx\` | wallet tab 활성 (\`nav.wallet\` 키 확인 후) |
| E2 | \`src/i18n/ko.ts\` / \`en.ts\` | \`wallet.*\` append only |

**NO-TOUCH:** \`src/routes/__root.tsx\` · sports routes · L1-08-V2/V3/L1-09-S files

---

## i18n 정책

- 신규 namespace: \`wallet.*\` **append only**
- \`common.*\` / \`gate.*\` / \`nav.*\` 기존 키 **재사용 우선** · rename/delete **0**
- ko +N → en +N · 정렬 후 diff empty
- grep: \`^  "\` 2-space 표준 (baseline **1701** + Δ)

---

## NO-TOUCH (LOCK)

| 항목 | FAIL |
|------|------|
| L1-08-V2 / V3 / L1-09-S | any diff |
| \`mocks/*.json\` | 신규/변경 0 — wallet SOT = \`useWalletMock.ts\` only |
| \`rpc_*\` / supabase / PSP / 실제 KYC | any commit |
| payout / odds 연산 | 변경 0 |
| sports routes head() | 기존 항목 diff 0 |
| \`decimal.js\` / \`@phonara/money\` | 0 |
| \`Number()\` / \`parseFloat\` 산술 | 0 |
| JSX 한글 literal | 0 — \`t()\` only |
| BottomNav / AppShell / TopBar layout | V2 sports layout 회귀 0 |

---

## EXECUTE steps

| Step | 작업 |
|------|------|
| 0 | Plan ACK — 본 LOCK · G1–G4 확인 |
| 1 | routes \`wallet.*\` + layout Outlet |
| 2 | W1 hub — BalanceCard + TxList + useWalletMock seed |
| 3 | W2 deposit flow — method → amount → confirm → pending tx |
| 4 | W3 withdraw — gate badge + cash-only + 30s complete timer |
| 5 | BottomNav wallet tab wire |
| 6 | i18n \`wallet.*\` ko=en parity |
| 7 | vitest \`Wallet.test.tsx\` |
| 8 | §GREEN self-check full block (아래) |
| 9 | operator Step 9b W manual checklist |

---

## §GREEN self-check (Step 8 · full block)

\`\`\`bash
grep -c '^  "' src/i18n/ko.ts    # 1701 + Δ — 실측 N 기록
grep -c '^  "' src/i18n/en.ts    # ko와 동일 Δ
rg -c '"wallet\\.' src/i18n/ko.ts src/i18n/en.ts   # 양국 동일 count
rg -c '"sports\\.|"nav\\.sports"' src/i18n/ko.ts src/i18n/en.ts   # 66 each NO-TOUCH
rg -n 'parseFloat|Number\\(' src/components/wallet src/hooks/useWalletMock.ts   # 0
rg -n '@phonara/money|decimal\\.js' src/components/wallet src/hooks/useWalletMock.ts   # 0
rg -n 'supabase|rpc_' src/components/wallet src/hooks/useWalletMock.ts   # 0
vitest run wallet   # all pass
\`\`\`

---

## Step 9b W (operator manual)

- \`/wallet\` hub: cash/bonus/locked · tx list 20건
- \`/wallet/deposit\`: preset chips → confirm → mock pending
- \`/wallet/withdraw\`: KYC badge · cash only · 30s mock complete
- BottomNav wallet tab · sports V2 layout 회귀 0
- sports L1-09-S 동작 동일 (row/fixture/slip/my-bets)

**PASS template:**

\`\`\`text
L1-10-W Step 9b manual PASS — wallet hub 3-balance · deposit pending · withdraw KYC gate · 30s complete · sports 회귀 0.
\`\`\`

---

## FAIL 조건 (요약)

- i18n ko/en delta 불일치 · sports/common/gate 키 변경/삭제
- mocks JSON 신규 · rpc/supabase/PSP/KYC 실제 wire
- float 산술 · PHONARA money 패키지 · sports 회귀 · layout diff

---

## LOCK Footer

| # | 항목 |
|---|------|
| F1 | mock SOT = \`useWalletMock.ts\` localStorage only |
| F2 | withdraw complete delay = **30_000ms** fixed |
| F3 | tx list cap = **20** rows |
| F4 | deposit presets = **10000, 50000, 100000, 500000** (string amounts) |
| F5 | \`displayDepositPreview(amount, method)\` returns \`{ fee, net }\` strings — no float |

---

## paste adapter memo (Cursor · L2 Wave-2)

- Lovable: wallet UI ZIP only · mock TTL 삭제는 paste wire 후
- Cursor: wallet deposit/withdraw hooks wire · \`packages/i18n\` wallet.* merge
- Admin deposit queues: L2-A scope — 본 슬라이스 밖

---

## Defer

- 실제 wallet RPC wire → paste + Engine
- KYC live API → L1-14 E / Engine
- Admin approval UI → L2-A

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | operator Plan DRAFT → LOCK 정본 등록 |

---

*Lovable canvas only · G1–G4 전 EXECUTE 0*
`;

writeFileSync('docs/LOVABLE_WALLET_UI_LOCK.md', doc);
console.log('ok', doc.length);
