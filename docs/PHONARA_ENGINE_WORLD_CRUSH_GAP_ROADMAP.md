# PHONARA 엔진 · World Crush 갭 & 로드맵 (operator 정본)

> **목적:** Stake/Rollbit/Binance/Bybit급 **체감** 대비, **엔진 vs UI/Lovable** 경계·추가·다듬기·defer를 잃지 않기 위한 단일 메모.  
> **갱신:** 2026-06-16 · engine dump `engine-dump/20260616-042001/` · Lovable Master Plan v0.2.1 · P2.0c GREEN  
> **연결:** [`PHONARA_WORLD_CLASS_INTEGRATED_ROADMAP.md`](PHONARA_WORLD_CLASS_INTEGRATED_ROADMAP.md) · [`PHONARA_NORTH_STAR_PLAN.md`](PHONARA_NORTH_STAR_PLAN.md) · [`PHONARA_V2_MASTER_PLAN.md`](PHONARA_V2_MASTER_PLAN.md) · [`LOVABLE_ZENITH_INDEX.md`](LOVABLE_ZENITH_INDEX.md) · [`PHONARA_CURSOR_PASTE_CRUSH_P2_0_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P2_0_LOCK.md)

---

## 0. 한 줄 요약

| 질문 | 답 |
|------|-----|
| 엔진이 부족해서 FOMO/UI가 안 터지나? | **아니오** — Lovable·wire·mount 문제 (GAP P0 #1~#3) |
| 엔진에 손댈 구멍이 있나? | **예** — paste **이후** Engine Wave 1~3 (아래 §4) |
| Lovable 진행 중 엔진 수정? | **0-touch** (migration/RPC/hook/domain) |
| GitHub Stake/Rollbit/Binance/Bybit UI repo? | **공식 UI 없음** · clone은 **패턴 참고만** (§7) |

---

## 1. 엔진 스냅샷 (2026-06-16 dump)

### Scorecard G1~G12

| ID | 상태 | 요약 |
|----|------|------|
| G1~G8, G10~G12 | **PASS** | migration 098 · prod Σ=0 · spot p95 buy~34ms/sell~29ms · SQL 41/41 · advisors 0 ERROR |
| G9 | **FAIL** | `check:full` — E2E 10 fail (presentation placeholder vs `data-testid`) · **엔진 결함 아님** |

### 이미 GREEN인 엔진 축

- **원장:** append-only · idempotency · conservation Σ=0 · prod `rpc_run_reconciliation`
- **카지노:** 10게임 PF · `rpc_open_game_round` / `rpc_place_game_bet` / `rpc_reveal_game_round`
- **Earn (일부):** `rpc_claim_daily_reward` · `rpc_complete_mission` · `rpc_spin_roulette` · **098** `rpc_claim_viral_mission` · `rpc_get_viral_mission_status`
- **Wallet:** **097** crypto deposit rails · `rpc_create_crypto_deposit_request` · `rpc_get_crypto_deposit_address`
- **Trade MVP:** `rpc_spot_market_buy/sell` · `rpc_open_futures_position` · `rpc_close_futures_position` · `rpc_stake_phon` / unstake / claim · `rpc_get_candles` · **`rpc_get_synthetic_book` (display-only)**
- **Affiliate (백엔드):** `affiliate_*` schema · tier snapshots · commission aggregates · settlements · cron refresh · **유저-facing read RPC는 미완** (§4 Wave-2)
- **RG / kill switches:** migration 073 등 · G12 PASS

### Lovable P2.0c (paste contract · 엔진 경계)

- **PROJECT_DUMP_P2.0c.v1** GREEN · Crash adapter · `BetResponseStatus` 6-literal · `pasteShellConfirm` · FROZEN md5 6+ui3
- **Crash 정책:** **auto-cashout-only** · 스냅샷 정산 + **replay UI** · manual mid-round cashout = **§STOP** → Engine Wave-1

---

## 2. World Crush 대비 — 무엇이 UI vs 엔진인가

| 체감 (North Star §4.6) | 벤치 | 지금 gap | 담당 |
|------------------------|------|----------|------|
| Earn-first · 6-lane 미션 | TikTok Lite · 토스 | mount/mock · lane read surface | **Lovable §Y** → paste wire → **Wave-3** |
| FOMO feed · ticker · countdown | Rollbit | Home/Casino 밀도 | **Lovable §B/Y · 12-A** (mock OK) |
| Casino hub · PF · jackpot | Stake | `components/casino/` 0 → 12-A | **Lovable 12-A** |
| Crash live · mid-cashout | Stake/Rollbit | replay-only · RPC 없음 | **Engine Wave-1** |
| Trade OB · perps grammar | Binance/Bybit | synthetic book · UI scaffold | **Lovable 12-D** + wire · CLOB **defer** |
| Partner tier · tree · commission | Stake agent | schema O · UI mock | **Engine Wave-2** + Lovable `/partner` wire |
| 신뢰 · SEO · PWA | conversion | head 14 route 등 | **Lovable 12-G** |

---

## 3. 지금 하면 안 되는 것 (Lovable paste track)

- `supabase/migrations/*` · RPC/RLS/GRANT 변경 (**operator 별도 GO 전 0**)
- `packages/{money,trading-engine,game-engine,wallet-ledger}` · `apps/web/src/domain/**` · `features/*/use-*.ts` (presentation wire 제외)
- P2.0c **Crash FROZEN** 6 + ui3 md5 touch · Stage replay math diff
- GitHub casino/exchange **clone repo를 엔진에 merge**
- `rpc_get_synthetic_book`을 real matching으로 슬쩍 업그레이드
- ZIP 발행 (`92-lovable-lock-execute` §ZIP 게이트)

---

## 4. Engine Wave (paste GO **이후** · 우선순위)

### Wave-1 · Crash live + manual cashout (P0 · Stake/Rollbit gap)

**현재 (P2.0 / P2.0c LOCK):**

- 정산: `rpc_place_game_bet` 1회 · `selection.autoCashout` 스냅샷
- `bet.result.crashMultiplier` 도착 **후** UI replay · `onCashout` / `casino-cashout` **disabled = 의도**

**추가 필요 (별도 LOCK · RED-first SQL):**

1. 라운드 상태 machine (waiting → flying → crashed)
2. **`rpc_crash_cashout`** (가칭) — **server-received timestamp** · `crashMultiplier` atomic 비교
3. latency arbitrage · crash 후 cashout · duplicate idempotency **negative paths**
4. (선택) WS / short-poll — **display multiplier** (정산 authority = 서버만)
5. SQL integration: conservation Σ=0 · hash-chain · `ROLLBACK` residue 0

**FAIL =** client `m(t)`로 payout · known `crashAt`으로 client cashout eval · Wave-1 없이 Lovable `onCashout` enable

**정본:** [`PHONARA_CURSOR_PASTE_CRUSH_P2_0_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P2_0_LOCK.md) §STOP

---

### Wave-2 · Partner / 총판 read RPC (P0 · 12-E mock 제거)

**있음 (백엔드):** `affiliate_relationships` · tier snapshots · commission aggregates · settlements · `rpc_register_affiliate_relationship` · cron `rpc_refresh_*` · admin approval

**없음 (클라이언트 read):** Lovable 12-E `/partner` = **mock gate** · tier/tree/commission **display RPC**

**추가 후보 (display-first · money mutation 최소):**

| RPC (가칭) | UI |
|------------|-----|
| `rpc_get_partner_dashboard` | tier badge · MTD commission · 3-state |
| `rpc_get_affiliate_tree` | depth-2 tree |
| `rpc_get_affiliate_commissions` | pending / approved / paid rows |

**Gate:** RLS · `_is_admin` / partner role · rate limit · idempotency on any claim path

**정본:** [`LOVABLE_ZENITH_PHASE12_E_LOCK.md`](LOVABLE_ZENITH_PHASE12_E_LOCK.md)

---

### Wave-3 · Earn 6-lane status surface (P1 · paste wire)

**있음:** `rpc_complete_mission` · daily · roulette · viral 098

**gap:** Lovable 6-lane (`daily` · `growth` · `viral` · `season` · `tier` · `fomo`) **단일 status read** — mock 제거용

**방향:** 기존 RPC **additive** 확장 또는 thin `rpc_get_mission_status` — **광고/만보/offer wall 키 0** (North Star §10)

---

### Wave-6 · VIP tier schema/RPC (L3-06 · operator GO · L1-13b scope 밖)

**트리거:** operator **「VIP tier Engine GO」** 1줄 (standing autonomy **자동 허용 아님**)

**범위 (Cursor · L2 paste GREEN 후 권장):**

- VIP ladder enum/table · user XP/등급 progress · read RPC (가칭 `rpc_get_vip_tier_status`)
- perk/cashback **표시용 snapshot** — money mutation touch 시 conservation + SQL test + advisor
- **`profiles.kyc_tier`(본인인증) ≠ VIP casino tier** — 컬럼/RPC 혼동 금지

**L1-13b와 관계:**

| 경로 | 순서 |
|------|------|
| **기본** | L1-13b `/tier` **목업 안내표** → GATE/paste → (원하면) L3-06 wire |
| **엔진 우선** | L3-06 GO → schema/RPC 먼저 → UI 숫자는 RPC SOT · L1-13b는 wire-only 또는 재Plan |

**정본 큐:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.1 · §3.3 L3-06

---

### P1 · 다듬기 (기능 추가 아님)

| 항목 | 내용 |
|------|------|
| P2.0c adapter clone | dice/limbo/hilo/… — `derive-ui-bet` · `adapt-*` · `pasteShellConfirm` |
| BetResponse contract | 6-literal · `'settled'` 금지 — Lovable/PHONARA SOT |
| G9 E2E | paste + `data-testid` wire — [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) |
| Synthetic book | UI/i18n에 **display-only** 명시 — Binance CLOB 착각 방지 |

---

### P2 · defer (Binance 본체급)

- Real CLOB · order matching · 유동성 깊이
- Global crash room (전 유저 동일 라운드) + anti-cheat
- Live win / jackpot **실 aggregated feed** (선택 read view)
- Observability SDK (`docs/OBSERVABILITY_PRIVACY.md` defer)

---

## 5. operator 실행 순서 (2026-06-16 고정)

```text
[지금]     Lovable: §A/B GREEN → §Y GO → 12-A → 12-G → 12-Z
[paste GO] Cursor P0~P7 Crush + adapter + E2E wire → G9 GREEN
[Wave-1]   Crash live cashout LOCK → migration → SQL RED-first → advisor
[Wave-2]   Partner read RPC → /partner mock 제거
[Wave-3]   Earn 6-lane status read → Home/Earn mock 제거
[defer]    CLOB · global crash WS · observability
[Wave-S]   토토/스포츠북 — **엔진=Cursor · UI/UX=Lovable** · Planning P0~P8 ✅
           정본: [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md)
           ├ P1 [`LEGAL_GATE`](PHONARA_SPORTSBOOK_LEGAL_GATE.md) · [`VENDOR_DECISION`](PHONARA_SPORTSBOOK_VENDOR_DECISION.md)
           ├ S1~S5 LOCK DRAFT: [`S1`](PHONARA_ENGINE_WAVE_S1_SPORTSBOOK_LOCK.md) [`S2`](PHONARA_ENGINE_WAVE_S2_ODDS_INGEST_LOCK.md) [`S3`](PHONARA_ENGINE_WAVE_S3_PLACE_BET_LOCK.md) [`S4`](PHONARA_ENGINE_WAVE_S4_SETTLE_LOCK.md) [`S5`](PHONARA_ENGINE_WAVE_S5_INPLAY_LOCK.md)
           ├ UI [`LOVABLE_SPORTSBOOK_UI_LOCK.md`](LOVABLE_SPORTSBOOK_UI_LOCK.md) · E2E [`PHONARA_SPORTSBOOK_E2E_MATRIX.md`](PHONARA_SPORTSBOOK_E2E_MATRIX.md)
           └ Tier/엔진: [`PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md`](PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md)
```

---

## 6. Lovable / paste 체크 (엔진 touch 없이)

**분업:** UI/UX = **Lovable** · 엔진(migration/RPC/ingest/hook) = **Cursor** · [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) §0.1

**진행판 정본 (2026-06-16):** [`PHONARA_LOVABLE_P2_GAMES_HANDOFF.md`](PHONARA_LOVABLE_P2_GAMES_HANDOFF.md) · [`LOVABLE_ZENITH_INDEX.md`](LOVABLE_ZENITH_INDEX.md)

| 완료/진행 | 항목 |
|-----------|------|
| GREEN | P2.0c Crash paste contract |
| GREEN | P2-Games Controls **10/10** · §A Theme 12-H v0.1 · §B Bento · §Y FOMO · 12-A · 12-G (부분) |
| GREEN | canvas catalog **1454/1454** ko=en |
| next | **12-D v0.2** Trade depth (L1-03 §GREEN) |
| ZIP/paste | operator **100% + 명시 GO** 전까지 **0** |
| paste 후 | mapGameSurfaceProps ADAPT · types MERGE · testid · E2E G9 |

---

## 7. 경쟁사 UI 공개 소스 (참고만 · 엔jin merge 금지)

**4사 공식 UI GitHub: 없음** (API/connector/docs만)

| 용도 | Repo / 리소스 |
|------|----------------|
| Stake 게임 UX | [tanh1c/stake-originals-clone](https://github.com/tanh1c/stake-originals-clone) |
| Stake shell | [dscnsec/Stake-frontend-clone](https://github.com/dscnsec/Stake-frontend-clone) |
| Rollbit 인접 | Rollbit **이름 clone 없음** · BC.Game 스타일 [hades255/reflow-bc-game-next-frontend](https://github.com/hades255/reflow-bc-game-next-frontend) |
| Binance IA/Trade | [cokepoppy/my-binance](https://github.com/cokepoppy/my-binance) · [tbt-paper-terminal](https://github.com/TheNewMikeMusic/tbt-paper-terminal) |
| Binance DESIGN.md | [shadcn.io/design/binance](https://www.shadcn.io/design/binance) |
| Bybit UI 패턴 | [brlocky/trading-app-bybit](https://github.com/brlocky/trading-app-bybit) |
| Order book | [jose-donato/crypto-orderbook](https://github.com/jose-donato/crypto-orderbook) · TradingView [lightweight-charts](https://github.com/tradingview/lightweight-charts) |
| Crash FE 참고 | [0xalberto/solana-crash-game](https://github.com/0xalberto/solana-crash-game) · [samott/crash](https://github.com/samott/crash) |

**규칙:** 스크린샷·패턴·정보 구조만 Lovable LOCK에 반영. clone 코드 **paste/엔진 merge 금지**.

---

## 8. Wave-1 착수 전 self-check (복붙)

```bash
# paste 전 — Engine Wave 금지
git diff --stat supabase/ packages/money packages/trading-engine packages/game-engine wallet-ledger

# dump baseline (주기적)
bun run dump:engine
# ultimate: bun run dump:engine:ultimate

# G9 (paste 후)
bun run check:full
```

---

## 9. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | 초판 — dump 20260616-042001 · World Crush 갭 · Wave 1~3 · Lovable 경계 · OSS 참고 목록 |

---

*operator 정본 · engine work는 본 문서 Wave 번호 + 별도 migration LOCK GO 후만*
