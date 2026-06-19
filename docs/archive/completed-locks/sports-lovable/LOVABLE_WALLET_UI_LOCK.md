# LOVABLE Wallet UI LOCK — L1-10-W `/wallet` v0.3 (3축 PAY + V2 Ledger)

> **상태:** L1-10-W-AMEND · **EXECUTE 0** · operator `L1-10-W-AMEND EXECUTE GO` 대기  
> **갱신:** 2026-06-16 · **F9** tx.method 스키마  
> **큐 ID:** **L1-10-W** (+ **W-PAY** 입금 3축 · **L1-10-W-D** visual)  
> **상위:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.2

---

## Scope (1줄)

`/wallet` hub + `/wallet/deposit` + `/wallet/withdraw` — **코인 주력 → 원화 계좌이체 → 상품권 수동입금** 3축 · cash/bonus/locked · mock SOT · **V2 Ledger** 시각 · vitest · **rpc/supabase/PSP/KYC 실호출 0**.

---

## World Crush bar (Wallet · FAIL = REVISE)

| 체감 | 필수 (첫 3초) |
|------|----------------|
| **코인** | DEFAULT 탭 · QR+주소+네트워크+최소입금+confirming — Binance deposit 스캔 1화면 |
| **원화** | 계좌 복사 1탭 · 입금자명 경고 · F4 preset · 영업일 SLA copy — 토스 clarity |
| **상품권** | PIN+금액 · **pending_review** · 24h 검수 ETA — 저가 입력폼 금지 |
| **허브** | KYC pill → Hero cash(glow) → bonus/locked 2-grid → Deposit/Withdraw CTA → Activity 6 preview (cap 20) |
| **출금** | crypto \| krw 탭만 · cash only · KYC gate · 30s complete |
| **금지** | 3버튼 동일 크기 그리드 · generic shadcn · 라이트모드 · staking hero |

**한 줄:** 글로벌 crypto 1티어(Stake/Binance) + 한국 결제 현실(원화·상품권) — **PHONARA wallet 끝판왕**.

---

## Baseline (L1-10-W Step 8 실측)

| 항목 | 값 |
|------|-----|
| i18n catalog | **1725/1725** (1701 + Δ24) |
| `wallet.*` | **55/55** (31 legacy + 24 · F6) |
| sports/nav | **66/66** NO-TOUCH |
| vitest wallet | 6/6 |
| vitest sports | 9/9 |

---

## 선결 조건 (ZIP 전)

| # | 게이트 |
|---|--------|
| G1–G3 | sports 9b · ZIP Wave-1 · paste Wave-1 ✅ |
| G4 | `L1-10-W EXECUTE GO` ✅ (기능 슬라이스) |
| G5 | **W-PAY AMEND** — 3축 입금·출금 2탭 (본 LOCK §W-PAY) |
| G6 | **L1-10-W-D** — V2 Ledger + hydration 0 (본 LOCK §W-D) |
| G7 | operator **Step 9b W + W-D** manual PASS 각 1줄 |
| ZIP | operator 「ZIP 발행 GO」만 |

---

## W-PAY · 입출금 3축 (우선순위 LOCK)

### 우선순위 (고정)

```text
1) 코인 입출금 (DEFAULT)
2) 한국 원화 · 계좌이체 (bank + vaccount 서브칩)
3) 상품권 · 수동입금 (입금 전용 · withdraw 탭 0)
```

### W-P1 — `/wallet/deposit` (segment: crypto | krw | giftcard)

| 축 | UI 문법 |
|----|---------|
| **crypto** | mount 시 selected · USDT+네트워크 칩 · QR/주소/복사 · min deposit · confirming(n/12) mock · fee/net string |
| **krw** | bank \| vaccount 서브칩 · F4 preset + custom · 입금자명 hint · 영업일 SLA · pending→complete |
| **giftcard** | 종류 chip · PIN 마스킹 · 금액 · `pending_review` · 24h 검수 copy · approve/reject mock |

### W-P2 — `/wallet/withdraw` (segment: crypto | krw only)

| 탭 | UI |
|----|-----|
| crypto | 주소 · 네트워크 · fee/net · cash only |
| krw | 등록 계좌 · KYC gate badge · cash only |
| giftcard | **노출 0** — `wallet.withdraw.giftcardNA` 또는 gate block |

공통: confirm → pending → **30_000ms** → complete (F2).

### W-P3 — `/wallet` hub CTA

- Primary: **코인 입금** (violet filled)
- Secondary: 원화 입금 · 상품권 입금 (outline/chip)
- Tx chip: `tx.method` (`crypto` / `krw` / `giftcard`) · type 6종 유지 (F9)

### F9 — tx 스키마 (CRITICAL)

```ts
type WalletTx = {
  type: 'deposit' | 'withdraw' | 'bet' | 'payout' | 'cashout' | 'bonus';
  method?: 'crypto' | 'krw' | 'giftcard'; // deposit/withdraw 전용
  status: 'pending' | 'confirming' | 'pending_review' | 'complete' | 'failed';
  // amount/fee: string only (F5)
};
```

- UI method chip = `tx.method` — **`deposit_crypto` 등 top-level type 금지**
- giftcard 입금만 `status: 'pending_review'`
- withdraw `method ∈ { crypto, krw }` only

**FAIL =** `rg 'deposit_crypto|deposit_krw|deposit_giftcard'` hit

### i18n (W-PAY · append-only · F6)

기존 55키 **rename/delete 0**. 없는 키만 append · Step 6 pre-grep:

```bash
rg '"wallet\.deposit\.method\.crypto"' src/i18n/ko.ts   # hit → skip
```

후보 (미존재 시만):

```text
wallet.deposit.method.crypto / .krw / .giftcard
wallet.deposit.crypto.network / .address / .min / .confirmations
wallet.deposit.krw.bank / .vaccount / .depositorHint
wallet.deposit.giftcard.pin / .reviewPending / .reviewEta
wallet.withdraw.tab.crypto / .tab.krw / .giftcardNA
```

§GREEN: `wallet.*` count = **55 + 실제 Δ** (ko=en 동일).

---

## W-D · V2 Ledger (visual only · i18n Δ0)

### Direction tokens (wallet-scoped · global leak 0)

> **2026-06-17 amend:** violet hex SOT **superseded** by [`LOVABLE_WALLET_TONE_UNIFY_LOCK.md`](LOVABLE_WALLET_TONE_UNIFY_LOCK.md) **L1-10-W-T** — rebind to platform `--background` / `--primary` / `--up` / `--down`.

| 토큰 | 값 (historical W-D · **DO NOT USE**) |
|------|-----|
| BG SOT | ~~`#171221`~~ → `var(--background)` |
| surface | ~~`#1F1830`~~ → `var(--surface)` |
| border | ~~`#2A2140`~~ → `var(--border)` |
| CTA | ~~`#7C3AED`~~ → `var(--primary)` |
| positive tx | ~~`#A78BFA`~~ → `var(--up)` |
| Type | Inter (UI) + JetBrains Mono (잔액/tx/금액 · tabular-nums) |

**FAIL =** `styles.css` global `@theme` / `--background` 변경 → `/sports` 색 회귀 · **FAIL =** W-D violet hex after L1-10-W-T §GREEN

### 구조 (허브)

```text
KYC pill → Hero balance (중앙 · glow halo) → bonus/locked 2-grid
→ Deposit / Withdraw 2-grid CTA → Activity stream (6행 preview · 단일 카드 · cap 20 유지)
```

### Hydration fix (필수 · `useWalletMock.ts`)

- `getServerSnapshot` = SEED 항상
- 클라이언트: hydration 전 SEED → `useEffect` `hydrated` 후 localStorage
- **FAIL =** `/wallet` console hydration mismatch

### AMEND · NEW (4 · W-PAY)

| # | path |
|---|------|
| N15 | `src/components/wallet/DepositCryptoPanel.tsx` |
| N16 | `src/components/wallet/DepositKrwPanel.tsx` |
| N17 | `src/components/wallet/DepositGiftcardPanel.tsx` |
| N18 | `src/components/wallet/WithdrawTabs.tsx` |

### AMEND · EDIT (W-PAY + W-D)

| Step | 파일 | 작업 |
|------|------|------|
| 1 | `DepositMethodList.tsx` | 3 segment · crypto mount selected |
| 2d | `WalletDepositPage.tsx` | segment router → N15–N17 |
| 2e | `WalletWithdrawPage.tsx` + N18 | crypto \| krw · giftcard 0 |
| 3 | `WalletHubPage.tsx` | Primary 코인 CTA · tx `method` chip · preview 6 |
| 3i | `i18n/ko.ts` + `en.ts` | pre-grep append only |
| 4 | `useWalletMock.ts` | hydration + F9 `method` field |
| 5a–5d | `styles.css` + wallet components | V2 Ledger · `--wallet-*` only |
| 6 | `__tests__/Wallet.test.tsx` | 3축 · 2탭 · F9 · hydration SEED |

DELETE 0 · 라우트/head() 0 · `display-wallet.ts` 로직 0.

### D-slice Footer (F 번호 충돌 금지 · 부모 F1–F8 CARRY)

| # | 항목 |
|---|------|
| D1 | i18n Δ0 (55=55) — W-D 단독 |
| D2 | `--wallet-*` scoped only |
| D3 | tx cap **20** · 허브 preview **6** (`slice` only) |
| D4 | W-PAY 3축 탭/로직 0 regression |
| D5 | hydration console error 0 |

---

## LOCK Footer (L1-10-W · CARRY)

| # | 항목 |
|---|------|
| F1 | mock SOT = `useWalletMock.ts` localStorage only |
| F2 | withdraw complete = **30_000ms** |
| F3 | tx list cap = **20** |
| F4 | krw presets = `"10000"` `"50000"` `"100000"` `"500000"` (string) |
| F5 | `displayDepositPreview(amount, method)` → `{ fee, net }` strings · no float |
| F6 | 기존 wallet.* rename/delete 0 |
| F7 | Imported*Page 삭제 0 · route component 교체만 |
| F8 | wallet route `head()` 유지 · layout `<Outlet />` |
| F9 | tx **type 6종 hold** · 3축 = `method` 필드 only · top-level `deposit_*` 금지 |

---

## NO-TOUCH

- L1-08-V2/V3 · L1-09-S · `mocks/*.json`
- `rpc_*` / supabase / PSP / KYC 실호출
- `Number()` / `parseFloat` 산술 · `@phonara/money`
- sports 66/66 · sports layout · BottomNav sports diff 0
- JSX 한글 literal 0

---

## EXECUTE 순서 (L1-10-W-AMEND · single shot)

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · F9 · G1–G4 ✅ |
| 1–2 | W-PAY: N15–N18 + segment deposit · withdraw 2탭 |
| 3 | hub CTA · i18n pre-grep |
| 4 | hydration + F9 `method` |
| 5 | W-D V2 Ledger + `--wallet-*` |
| 6 | vitest wallet ≥6/6 · sports 9/9 |
| 7 | §GREEN + operator 360/1280 수동 (Playwright 자동 주장 0) |
| 8 | operator Step 9b PASS 1줄 |

---

## §GREEN self-check (full block)

```bash
rg 'deposit_crypto|deposit_krw|deposit_giftcard' src/hooks/useWalletMock.ts src/components/wallet
rg -n '#171221|#7C3AED' src/styles.css
grep -c '^  "' src/i18n/ko.ts
grep -c '^  "' src/i18n/en.ts
rg -c '"wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"sports\.|"nav\.sports"' src/i18n/ko.ts src/i18n/en.ts
diff <(rg -o '^\s+"[^"]+":' src/i18n/ko.ts|sort) <(rg -o '^\s+"[^"]+":' src/i18n/en.ts|sort)
rg -n 'parseFloat|Number\(' src/components/wallet src/hooks/useWalletMock.ts
rg -n '@phonara/money|decimal\.js' src/components/wallet src/hooks/useWalletMock.ts
rg -n 'supabase|rpc_' src/components/wallet src/hooks/useWalletMock.ts
rg -n '[가-힣]' src/components/wallet
bunx vitest run src/components/wallet/__tests__/
bunx vitest run sports
```

수동: `/wallet` hydration 0 · deposit 첫 탭=crypto hero · giftcard=review pending · withdraw=crypto|krw · 360/1280 overflow 0 · `/sports` 회귀 0.

---

## Step 9b (operator manual)

**W-PAY:**

- deposit: crypto default · krw 복사/SLA · giftcard review pending
- withdraw: crypto|krw only · KYC · 30s complete

**W-D:**

- V2 ledger hero+glow · 6행 activity preview · violet CTA · hydration 0

**PASS template:**

```text
L1-10-W Step 9b manual PASS — crypto/krw/giftcard 3축 · giftcard review · withdraw crypto+krw · V2 ledger · hydration 0 · sports 회귀 0.
```

---

## FAIL (요약)

- 3버튼 동일 그리드 · crypto non-default · giftcard on withdraw
- i18n ko≠en · sports 66 변경 · tx cap≠20
- global styles leak · hydration error · float/rpc
- ZIP without operator GO · 9b 미PASS

---

## paste adapter memo (L2 Wave-2)

- Cursor: wallet UI ZIP · `packages/i18n` wallet.* merge · hooks wire defer Engine
- mock TTL / real RPC = paste 후

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | v0.1 LOCK 초판 |
| 2026-06-16 | v0.3 — W-PAY 3축 · W-D V2 Ledger · baseline 1725/55 · World Crush bar |
| 2026-06-16 | v0.3.1 — F9 tx.method · N15–N18 · AMEND EXECUTE plan 정본 |

---

*Lovable canvas only · ZIP = operator explicit GO*
