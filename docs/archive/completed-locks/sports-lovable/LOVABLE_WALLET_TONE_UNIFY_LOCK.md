# LOVABLE Wallet · Tone Unify LOCK — L1-10-W-T v0.1 EXECUTE

> **상태:** **✅ §GREEN** · operator report 2026-06-17 · vitest **580/580 carry** · violet hex **0** · ZIP defer  
> **큐 ID:** **L1-10-W-T** (Wallet tone · Stake-grade Navy + Mint · Lovable canvas)  
> **부모:** [`LOVABLE_WALLET_UI_LOCK.md`](LOVABLE_WALLET_UI_LOCK.md) W-D **amend** — 기능 0 · `--wallet-*` rebind only  
> **의존:** L1-10-W wallet routes/components exist · vitest **580/580** carry · platform SOT tokens in `:root`

---

## Scope (1줄)

`[data-wallet="v2"]` scoped **8 CSS variables**만 플랫폼 SOT(`--background` · `--primary` · `--up`/`--down`)에 **재바인딩** — 보라 hex 제거 · Stake-grade **딥 네이비 + 단일 민트 CTA** · wallet JSX/라우트/로직 **0-touch**.

---

## 문제 (operator)

지갑 스코프 `[data-wallet="v2"]`만 보라(`#171221` bg / `#7C3AED` CTA / `#A78BFA` pos)로 떠 있어 Home/Casino/Trade(딥 네이비 + 민트)와 **톤 불일치** → 눈 피로 + 브랜드 일관성 깨짐.

---

## 원칙

| # | 원칙 |
|---|------|
| P1 | **기능 0 변경** — 코인 입금(주력) · 원화 계좌이체 · 상품권 · 출금 라우트·로직·테스트 그대로 |
| P2 | **토큰만 교체** — `src/styles.css` `[data-wallet="v2"]` 블록 **한 곳** · 컴포넌트 className **0** |
| P3 | **Stake 위계** — 본문 무채 네이비 · **단일 민트 CTA** = 유일 채도 · 상승/하락 = 글로벌 `--up`/`--down` |

---

## 변경 — `src/styles.css` (한 블록만 · ~L217–227)

**Before (제거 대상):** wallet-scoped violet hex / oklch — `#171221` · `#1F1830` · `#2A2140` · `#7C3AED` · `#A78BFA`

**After:**

```css
[data-wallet="v2"] {
  --wallet-bg:        var(--background);      /* 딥 네이비 */
  --wallet-surface:   var(--surface);         /* 카드 */
  --wallet-border:    var(--border);          /* 보더 */
  --wallet-cta:       var(--primary);         /* 민트 그린 — 유일 액센트 */
  --wallet-cta-fg:    var(--primary-foreground);
  --wallet-pos:       var(--up);              /* 상승/입금 = 민트 */
  --wallet-neg:       var(--down);            /* 하락/출금 = 레드 */
  --wallet-fg:        var(--foreground);
  --wallet-fg-dim:    var(--muted-foreground);
}
```

**FAIL =** `:root` / `@theme` / global `--background` 변경 · `[data-wallet="v2"]` 밖 wallet hex leak

---

## NO-TOUCH

| 영역 | |
|------|--|
| Components | `WalletHubPage` · `WalletBalanceCard` · `DepositMethodList` · `DepositCryptoPanel` · `DepositKrwPanel` · `DepositGiftcardPanel` · `WithdrawForm` · `WithdrawTabs` · `WalletTxList` — JSX · className · tests |
| Routes | `wallet.tsx` · `wallet.index.tsx` · `wallet.deposit.tsx` · `wallet.withdraw.tsx` |
| Flows | 코인 입금 · 원화 계좌이체 · 상품권 · 출금 — 검증 · i18n |
| Other scopes | `[data-skin="mobile-crush"]` · earn density · 글로벌 `:root` |
| Platform | L1-17 TradeModeShell · L1-18 FOMO · Crash FROZEN · packages/* · rpc/supabase |

---

## World Crush bar

| # | 필수 | FAIL |
|---|------|------|
| WT1 | `/wallet` hub · deposit · withdraw **동일 네이비+민트** as Home/Casino/Trade | violet OOTB 잔존 |
| WT2 | CTA **1 accent** (mint) · pos/neg semantic | multi purple accent |
| WT3 | wallet vitest + full **580/580 carry** | regression |
| WT4 | i18n DIFF=**0** | catalog drift |

---

## Tests

| # | assert |
|---|--------|
| T1 | vitest **580/580 carry** (wallet tests 색 단언 없음 — carry) |
| T2 | `rg "#7C3AED|#A78BFA|#171221|#1F1830|#2A2140" src` → **0 hit** (wallet block 제거 후) |
| T3 | `[data-wallet="v2"]` still exists · `--wallet-cta: var(--primary)` hit |
| T4 | i18n ko=en DIFF=**0** |

---

## LOCK Footer WT-F1 ~ WT-F4

| # | 고정 |
|---|------|
| F1 | **CSS 1 block only** · 9 `--wallet-*` → platform SOT vars |
| F2 | wallet component/route **0 file edit** |
| F3 | violet wallet hex **0** in `src/` |
| F4 | vitest **580/580 carry** · DIFF=0 |

---

## EXECUTE Steps 0→4

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline 580/580 |
| 1 | `styles.css` `[data-wallet="v2"]` rebind (위 블록) |
| 2 | vitest wallet + full |
| 3 | §GREEN rg block |
| 4 | **9b-WT manual** — `/wallet` · deposit · withdraw preview |

---

## §GREEN full block

```bash
bunx vitest run src/components/wallet/
bunx vitest run

python3 -c "import re;ko=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/ko.ts').read()));en=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/en.ts').read()));print(len(ko^en))"

rg -n '#7C3AED|#A78BFA|#171221|#1F1830|#2A2140' src/
rg -n '\[data-wallet="v2"\]' src/styles.css
rg -n '--wallet-cta:\s*var\(--primary\)' src/styles.css
```

**§GREEN template:**

```text
L1-10-W-T §GREEN — wallet tone navy+mint SOT rebind · violet hex 0 · vitest N/N carry · DIFF=0 · 9b-WT PASS · ZIP defer.
```

---

## 9b-WT manual (operator 60초)

1. `/wallet` — 네이비 배경 · **민트 CTA** · 카드 보더 = Home/Casino feel
2. `/wallet/deposit` — crypto/krw/giftcard segment · **보라 잔존 0**
3. `/wallet/withdraw` — 동일 톤
4. en mode Korean 0

**FAIL =** purple hub OOTB · global `:root` color shift · sports/home regression

---

## paste adapter memo (L2)

- `[data-wallet="v2"]` block → `apps/web/src/styles/presentation-import-tokens.css` or theme merge post-paste
- `--wallet-*` names preserved — component CSS unchanged

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 PLAN — Stake-grade navy+mint · W-D violet supersede · CSS-only |
| 2026-06-17 | **§GREEN** — SOT rebind · 기능·라우트·테스트 0 · violet hex 0 · 580/580 carry |

---

*Lovable canvas only · parallel G-ZIP · parent L1-10-W*
