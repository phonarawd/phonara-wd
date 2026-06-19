# Crush Track · 새 채팅 지존급 인계 (2026-06-15)

> **복붙용:** Lovable workspace 또는 PHONARA Cursor **새 채팅 첫 메시지**에 이 문서 전체 또는 §「에이전트 지시」블록을 붙여넣기.  
> **인덱스:** [`LOVABLE_ZENITH_INDEX.md`](LOVABLE_ZENITH_INDEX.md) §7  
> **Crush 정본:** [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) **v4**

---

## 0. 한 줄 상황

**Lovable canvas**에서 Phase 12 Crush 진행 중. **순서 = P1.5-A→B → P1.7 → P1.8 → P2a**. PHONARA paste **0-touch**.

---

## 1. 두 세계 (절대 혼동 금지)

| 영역 | 위치 | 상태 |
|------|------|------|
| **Lovable workspace** | operator canvas · `src/components` · `src/routes` | Crush P1.x·P2 **여기서 구현** |
| **PHONARA repo** | `c:\Users\PC\Desktop\phonara-gb` | 엔진/Supabase **완료** · presentation paste **대기** · `GameCard`/`LiveWinTicker` 등 **미paste** |

**Paste 게이트:**

```text
12-H/F2/A/G → 12-Z §GREEN → operator 「ZIP 발행」→ paste GO → P0(Splash)
```

Crush P1~P7은 Lovable에서 **선행 가능** (post-paste Cursor 작업으로도 문서화됨). PHONARA repo에 paste 없이 P0 코드 착수 **금지**.

---

## 2. Crush v4 끝판왕 게이트 (매 슬라이스)

### §0-1 코드

- `bg-[#` · `text-white|black` · `bg-white|black` · `oklch(` (globals 외) **0**
- JSX 한글 **0** — i18n만 (mock 닉네임은 `casino-feed.ts` 등 데이터 상수)
- `presentation-import/` · 엔진 · `features/*/use-*.ts` · `supabase/*` **NO-TOUCH**

### §0-6 LOCK (영구)

```text
FAIL = mission.ad.* · rewarded video · offer wall · WatchCard · AdCard · 만보기/센서
PWA: install/manifest OK · SW=0 · core Earn 센서/Health 의존 0
```

### 슬라이스

- 5~9 files/턴 (테스트·i18n 4언어 = logical unit 예외 가능)
- FAIL = 해당 슬라이스만 revert

---

## 3. 완료 ✅ (Lovable Crush · 이 채팅 기준)

| 슬라이스 | 보고 | LOCK |
|----------|------|------|
| **P1** 12-N | Casino 7컴포넌트 + `ImportedCasinoPage` | CRUSH_LOCK P1 |
| **P1.1a/b** | Live hooks + 포스터 CDN | [`P1_1_LOCK`](PHONARA_CURSOR_PASTE_CRUSH_P1_1_LOCK.md) |
| **P1.2** | Tournaments/Leaderboard (목록) | (Lovable 슬라이스) |
| **P1.3** | `GameDetailFrame` · 10 routes · vitest 358/358 | [`P1_3_LOCK`](PHONARA_CURSOR_PASTE_CRUSH_P1_3_LOCK.md) ✅ |
| **P1.4** | ⌘K shell global · alias i18n · vitest +3 | [`P1_4_LOCK`](PHONARA_CURSOR_PASTE_CRUSH_P1_4_LOCK.md) v2 |
| **Route Dedup** | `/games→/casino` · links 0 · sitemap · vitest **366** | [`ROUTE_DEDUP_LOCK`](PHONARA_CURSOR_PASTE_ROUTE_DEDUP_LOCK.md) ✅ |
| **P1.5** (다음) | **A** Auto-Bet 10/10 → **B** Hero/Rail Apex · 60fps | [`P1_5_LOCK`](PHONARA_CURSOR_PASTE_CRUSH_P1_5_LOCK.md) ⏳ |

### Route Dedup as-built

- 6 redirect (`beforeLoad` + `replace:true`) · 첫 paint부터 새 경로
- 3 신규: `casino.history` · `casino.fairness` · `casino.tournaments`
- 7 link `to="/games"` → `/casino` (+ `TradeGamesTeaserCard` · Home Shortcut union)
- sitemap: `/games*` · `/casino/hub` 제거 → `/casino/{history,fairness,tournaments}`
- plinko jsdom canvas flake = **기존** · 변경 무관

### 카지노 정본 경로

```text
/casino              → ImportedCasinoPage (P1.x alive)
/casino/<game>       → GameDetailFrame ×10
/casino/history|fairness|tournaments
/games/*             → redirect only
⌘K                   → /casino/<game>
```

---

## 4. 다음 작업 ⏳ (즉시)

### **P1.5 — Auto-Bet + Detail Apex** (Route Dedup 직후 · P2a 전 · **A→B 순서 고정**)

정본: [`PHONARA_CURSOR_PASTE_CRUSH_P1_5_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P1_5_LOCK.md)

**A 마감:** `P1.5-A GREEN · 10/10 AutoBet · settle by round_id · vitest +8`  
**B 마감:** `P1.5-B GREEN · Hero Stage · Sticky Rail · 60fps LOCK · vitest +4`

### **P1.7 — Mobile Apex v2** (P1.5-B 후 · P1.6 흡수)

정본: [`PHONARA_CURSOR_PASTE_CRUSH_P1_7_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P1_7_LOCK.md)

**마감:** `P1.7 GREEN · mobile-crush skin · Crash 1:1 · 9/9 tone · BottomNav hidden · desktop 0`

### **P1.8 — Stake Parity** (P1.7 GREEN 후)

정본: [`PHONARA_CURSOR_PASTE_CRUSH_P1_8_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P1_8_LOCK.md)

SideNav PC 접기 · Lobby Stake-slim · Crash `Stage.tsx` 통합 + mobile 라이브 곡선

**마감:** `P1.8 GREEN · SideNav collapse · Lobby slim · Crash unified · live mobile+PC`

### **P2a — Trade Chart + Market Chrome** (P1.8 GREEN 후 GO)

정본: [`PHONARA_CURSOR_PASTE_CRUSH_P2_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P2_LOCK.md)

| # | 산출물 |
|---|--------|
| 1 | `src/lib/trade-market-mock.ts` |
| 2 | `TradeChartHero.tsx` — `lightweight-charts` v4 **lazy** |
| 3 | `FundingBadge.tsx` · `Change24hBadge.tsx` · `TradeModeSegment.tsx` |
| 4 | `ImportedTradePage.tsx` EDIT (chart+badges) |
| 5 | `trade.tsx` EDIT — crush page · **head Δ=0** |
| 6 | i18n `trade.crush.*` ko/en/ja/zh |

**마감:** `P2a GREEN · trade chart+badges · lightweight-charts lazy`

### **P2b — Depth + Tape + Position** (P2a 후)

`OrderbookDepth` · `MarketTradesTape` · `PositionPanel` · `MobileTradeSheet` · `useTradeMarketTick` · `trade.hub` → `/trade` redirect

**마감:** `P2b GREEN · 12-O complete`

### 12-D 관계

- 현재 `/trade` = 12-D `TradeHub` scaffold
- P2 = **`ImportedTradePage` crush 승격** · `density="trade"` 유지
- engine · `useTrading` · RPC **wire 금지** (display mock only)

---

## 5. 이후 로드맵 (v4)

```text
P0(Splash, paste 후) → P1✅ → P2(12-O) → P3 Earn(12-P) → P4 Wallet(12-Q) → P5 Referral(12-R) → P6 Ranking(12-S) → P7 Polish(12-T)
```

| Phase | 핵심 |
|-------|------|
| P3 | TurboQuest · LuckyBox · QuickCash · CheckIn · Mission · HomeHub — **광고·만보 0** |
| P4 | Crypto(default)+KRW wallet mock · PG 제외 |
| P7 | manifest-only SW=0 · Lighthouse 90+ |

---

## 6. Lovable Phase 12 매크로 (병행 트랙)

| 상태 | 슬라이스 |
|------|----------|
| ✅ | 12-E/B/C/D |
| ⏳ | **12-F2+H-Theme** → **12-A** → **12-G** → **12-Z** |
| 📍 | catalog ~1165 · vitest Crush 후 **366** · ZIP = operator 「ZIP 발행」 전까지 **금지** |

현행 EXECUTE: [`LOVABLE_ZENITH_PHASE12_F2_EXECUTE_PASTE.md`](LOVABLE_ZENITH_PHASE12_F2_EXECUTE_PASTE.md)

---

## 7. PHONARA 엔진 (읽기 전용 · 건드리지 말 것)

- Supabase `yocjhjsdwoijfdrehzoq` only
- Migration through `20260615000098` (crypto 097 · viral 098)
- `apps/web/src/routes/casino.tsx` — engine+fairness 혼재 (paste 시 정리)
- `apps/web/src/games/**` — engine 정본
- Rules: `.cursor/rules/90-ui-ux` · `95-presentation-import` · `20-supabase-safety`

---

## 8. 문서 맵 (Crush 전용)

| 문서 | 용도 |
|------|------|
| [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) | v4 P0→P7 |
| [`PHONARA_CURSOR_PASTE_CRUSH_P1_1_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P1_1_LOCK.md) | P1.1 Alive |
| [`PHONARA_CURSOR_PASTE_CRUSH_P1_3_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P1_3_LOCK.md) | P1.3 Detail ✅ |
| [`PHONARA_CURSOR_PASTE_CRUSH_P1_4_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P1_4_LOCK.md) | P1.4 ⌘K v2 |
| [`PHONARA_CURSOR_PASTE_ROUTE_DEDUP_LOCK.md`](PHONARA_CURSOR_PASTE_ROUTE_DEDUP_LOCK.md) | Dedup ✅ |
| [`PHONARA_CURSOR_PASTE_CRUSH_P1_5_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P1_5_LOCK.md) | **P1.5 다음** |
| [`PHONARA_CURSOR_PASTE_CRUSH_P2_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P2_LOCK.md) | **P2 · P1.5 후** |
| [`PHONARA_NORTH_STAR_PLAN.md`](PHONARA_NORTH_STAR_PLAN.md) | §10 ad LOCK |
| [`apps/web/PRESENTATION_IMPORT.md`](../apps/web/PRESENTATION_IMPORT.md) | paste 경로 map |

---

## 9. §GREEN red-grep (복붙)

```bash
rg -i "WatchCard|AdCard|mission\.ad|rewarded|offerwall" src/components src/hooks src/data && exit 1 || true
rg "[가-힣]" src/components src/routes --glob '!**/*.test.*' --glob '!**/i18n/*' && exit 1 || true
rg "bg-\[#|text-white|text-black|oklch\(" src/components --glob '!**/lovable-globals.css' && exit 1 || true
rg 'to="/games"' src --glob '!**/*.test.*' && exit 1 || true
bunx vitest run
```

---

## 10. 에이전트 지시 (새 채팅에 이 블록만 붙여도 됨)

```text
PHONARA Crush track 인계 (2026-06-15).

워크스페이스: Lovable canvas (Crush 구현). PHONARA repo paste 전 — supabase/engine/features NO-TOUCH.

완료: P1~P1.4 · Route Dedup GREEN (vitest 366 · /casino 단일 정본 · /games redirect).

다음: P2a EXECUTE — docs/PHONARA_CURSOR_PASTE_CRUSH_P2_LOCK.md 정본 따름.
- trade-market-mock.ts · TradeChartHero (lightweight-charts lazy) · Funding/Change24h/ModeSegment
- ImportedTradePage crush · trade.tsx head Δ=0 · mock only · useTrading NO-TOUCH
- v4 §0 + §10 LOCK · 슬라이스 마감 시 1줄 보고

P2a GREEN 후 P2b. operator 「P2a EXECUTE」 없이도 standing autonomy로 진행 OK (Lovable).

참고: LOVABLE_ZENITH_CRUSH_HANDOFF.md · LOVABLE_ZENITH_INDEX.md §7
```

---

## 11. Defer / 하지 말 것

- Sticky Quick-Bet HUD (BottomNav 충돌)
- `src/games/**` 리팩터 (Route Dedup에서도 NO-TOUCH)
- `CasinoHub.tsx` 삭제 (dead code · cleanup 슬라이스)
- PHONARA repo paste 없이 P0 Splash
- Supabase migration without explicit task
- WatchCard · AdCard · 만보기 · rewarded video

---

*Crush handoff v1 · 2026-06-15 · Route Dedup GREEN 직후*
