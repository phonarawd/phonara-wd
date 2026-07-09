# Platform Narrative Canon (31차)

> **상태:** `[x] operator 흡수` · Track A canon wired (`p6-doc-platform-canon-sync` 2026-07-05)  
> **Authority:** Plan §3.5 · §28 · [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md) · [`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md) · [`ONBOARDING_JOURNEY_CANON.md`](ONBOARDING_JOURNEY_CANON.md)  
> **구현:** `p3-platform-narrative-i18n` · `[x] p7-tier-benefits-narrative` · `p12-trust-center-narrative`

## 한 줄 positioning (10초)

**PrimeForge = 친구와 함께 쌓는 부업 습관 + PHON 하나의 지갑에서 벌고·거래하고·출금한다.**

| Locale key prefix        | 용도                            |
| ------------------------ | ------------------------------- |
| `platform.positioning.*` | 랜딩 hero · signup subhead      |
| `platform.pillars.*`     | 3축 (Earn · Trade/Bet · Wallet) |
| `platform.trust.*`       | `/security` trust hub           |

**금지:** guaranteed profit · “무료 돈” · false urgency · competitor clone copy

---

## 2. Three pillars (통합 플랫폼 스토리)

```text
Earn (0원 시작)  →  Wallet (PHON 단일)  →  Trade · Sports · Casino (실활동 연동)
```

| Pillar     | 유저 인식               | Canonical routes                        |
| ---------- | ----------------------- | --------------------------------------- |
| **Earn**   | 오늘 할 일 1가지        | `/home` · `/home/missions` · `/staking` |
| **Wallet** | 내 돈의 단일 진실       | `/wallet` · `/ledger`                   |
| **Play**   | 전문 도메인 (tone 분리) | `/trade` · `/sports` · `/casino`        |

**Play 정산 (§13.1.2):** Trade·Sports·Casino·Staking 베팅/거래는 **PHONARA 플랫폼 내부**에서만 정산 — UX는 거래소급(실시간 차트·order book) · 외부 거래소 체결/API 연동 카피 **금지** · USDT+PHON(§13.1.1)

BottomNav 5탭 = **동일 스토리의 5 chapter** (§12.19).

---

## 3. Tier unified narrative (`/tier/benefits`)

**메시지:** 등급은 포인트 장식이 아니라 **미션 한도 · 추천 정산 · (E4 후) 수수료·한도 혜택**의 종합 지표.

| Tier UX element | Copy rule                                  |
| --------------- | ------------------------------------------ |
| Progress        | RPC `rpc_get_earn_hub_status` display only |
| Benefits list   | exists RPC만 · gap = “준비 중” **미노출**  |
| Decay (E1 후)   | eligible-only · 경고 = notification pref   |

i18n: `tier.benefits.narrative.*` · `tier.benefits.row.*`

---

## 4. Trust center narrative (`/security`)

**메시지:** 말이 아니라 **상태·한도·다음 행동**으로 신뢰.

| Block         | Content source                                      |
| ------------- | --------------------------------------------------- |
| Money safety  | Σ=0 · append-only · hash-chain (factual, no hype)   |
| Provably fair | link `/casino/fairness`                             |
| RG · KYC      | link `/account/responsible-gaming` · `/account/kyc` |
| System status | `/status` (E10 live)                                |

i18n: `trust.hub.*` · emoji **0** (Financial tone)

---

## 5. Implementation contract

| File / Todo                                            | Role                            |
| ------------------------------------------------------ | ------------------------------- |
| `domain/platform-narrative-display-contract.ts`        | key prefixes · pillar ids       |
| `domain/operator-trust-pages-display-contract.ts`      | §32.5 FAQ·feedback·legal routes |
| `p12-page-support-faq` … `p12-page-legal-cookies`      | operator trust pages            |
| `p9-first-trade-education` · `p10-first-bet-education` | first-visit modals              |
| `packages/i18n`                                        | ko+en simultaneous              |
| Landing                                                | §28 structure + 본 canon keys   |

---

## 6. FAIL

- Hero에 Trade PnL 과장
- Tier benefits에 client 계산 한도
- Trust page에 unverifiable “100% 안전” claim
