# Lovable Zenith — Phase 12 Product Depth (압살 매크로 · operator 확정)

> **용도:** paste 1회 **전** Lovable에서 Stake/Rollbit/Binance/Bybit **체감 압살급** UI를 끝내는 매크로 정본.  
> **연결:** [`PHONARA_NORTH_STAR_PLAN.md`](PHONARA_NORTH_STAR_PLAN.md) · [`LOVABLE_ZENITH_ROADMAP.md`](LOVABLE_ZENITH_ROADMAP.md) · [`CURRENT_STATUS.md`](CURRENT_STATUS.md)  
> **갱신:** 2026-06-15 · operator 「Lovable에서 전부 완성 후 Cursor paste」 확정

---

## 1. operator 확정 (한 줄)

```text
Lovable = 게임·미션·홈·트레이드·총판·PWA·SEO 전부 세계 1위 **체감**까지 (World Crush Bar §4.6)
→ Phase 12-Z PRODUCT FINAL GREEN + 최종 ZIP 1회
→ PHONARA paste = adapter + 엔진 wire (돈·SW·RPC) · paste 1회만
```

**paste 게이트 변경 (2026-06-15):**

| 이전 | 이후 |
|------|------|
| Phase 10 CLOSE → 11-B/C polish → paste | Phase 10 = **route shell CLOSE** (≠ 제품 완성) |
| 11-C GREEN → paste | **12-Z GREEN → paste** |

**PHONARA Cursor:** Phase 12 진행 중 **`apps/web` · `packages/*` · `supabase/*` 코드 0줄** (handoff/docs bake만).

**ZIP 발행 (2026-06-15 · operator 확정 · non-negotiable):** operator가 **「ZIP 발행」** 등으로 **명시할 때까지** Lovable/Cursor/에이전트는 **ZIP 생성·dry/real·CHANGELOG KB·§GREEN ZIP 필수 주장 금지**. §GREEN = vitest + catalog + gate만으로 valid. paste용 ZIP은 **12-Z FINAL GREEN 후** operator paste GO와 별도. 정본: `.cursor/rules/92-lovable-lock-execute.mdc` §ZIP 게이트.

---

## 2. 압살 대상 vs Lovable 갭 (2026-06-15 실측)

| 축 | Stake/Rollbit | Binance/Bybit | Lovable 지금 | Phase 12 슬라이스 |
|----|---------------|---------------|--------------|-------------------|
| **카지노/게임** | 연출·속도·브랜드 | — | 10종 MVP · Pixi polish **DEFER** | **12-A** |
| **Earn/미션** | FOMO·6레인 리텐션 | — | A+B 풀 · C~F **preview** | **12-B** |
| **홈** | 첫 3초·live·urgency | — | ImportedHome **밀도 defer** | **12-C** |
| **Trade** | — | 고밀도 터미널 grammar | MVP 표시용 · trade/* KR carry | **12-D** |
| **총판/affiliate** | referral tree·티어·수수료 | — | **엔진 ✅ (Supabase)** · **UI ❌** | **12-E** |
| **PWA/SEO** | install·신뢰 | 앱급 manifest | **11-B ✅ · 11-C ✅** | — |
| **돈/정산/SW** | — | 원장·매칭 | PHONARA 엔진 | **paste 후** (Lovable 금지) |

**총판(affiliate) 엔진 (PHONARA · paste 전 read-only 참고):**

- `affiliate_relationships` · `affiliate_tier_snapshots` · `affiliate_tier_configs`
- `rpc_register_affiliate_relationship` · `rpc_run_affiliate_settlements` · tier refresh/snapshot
- Admin: `affiliate_commission_approval` 큐
- UI: `/referral` **placeholder** · `ReferralDashboardCard`(일반 referral만) · **총판 허브 0**

---

## 3. Phase 12 매크로 순서 (LOCK → GO → EXECUTE → §GREEN)

```text
Phase 11-C   PWA Supremacy              ⏳ EXECUTE (인프라 · /install · SW=0)
Phase 12-F   Home FOMO Density           /home +3 FOMO slot · home.fomo.*
Phase 12-F.2 Home Bento + Games carry     HeroBar · Bento 6 · /games secondary
Phase 12-H-Theme Aurora Ember             OKLCH dark fixed · styles.css only
Phase 12-H-Admin (defer) Admin Affiliate  구 PRODUCT_PLAN Admin 슬롯
Phase 12-Z   Lovable PRODUCT FINAL      verify-only · catalog · vitest · ZIP 2종 · §GREEN
→ PHONARA paste 1회 → **P0~P7 Cursor Crush** ([`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md)) → check:full + E2E
```

**operator 권장 우선순위 (ROI):**

1. ~~**12-E**~~ ✅ GREEN (2026-06-15)
2. ~~**12-B**~~ ✅ GREEN (2026-06-15 · EXECUTE v2.2 · A1)
3. ~~**12-C**~~ ✅ GREEN scaffold (2026-06-15 · v0.2.2 · catalog **1143**)
4. ~~**12-D**~~ ✅ GREEN (2026-06-15 · scaffold + v0.1.1 · catalog **1165** · sitemap **43**)
5. **12-H-Theme + 12-F.2** — **EXECUTE GO §A→§B** · catalog **1227→1233**
6. **12-A → 12-G** — 끝판왕 chain carry
7. **12-Z** — FINAL

각 슬라이스: **LOCK v0.1 DRAFT → operator 검토 → FINAL GO → EXECUTE → §GREEN** (11-B/11-C와 동일 워크플로).

---

## 4. 슬라이스별 Scope 스케치 (LOCK 초안 전 · 정본은 슬라이스 LOCK에서 확정)

### Phase 11-C · PWA Supremacy (✅ GREEN · 2026-06-15)

- catalog **1059→1075** · `pwa.*` +16 · route +0 (`/install` head 갱신)
- ZIP user **~101.2 KB** · admin **~51.2 KB** · handoff **v65 baked**
- **NEXT:** Phase **12-A~E** → **12-Z**

### Phase 11-C · LOCK reference (archive)

### Phase 12-A · Games World-Class Pass

- **Bar:** Stake/Rollbit 동 genre 연출 · 60fps 체감 · rules Sheet · PF UX
- **Scope:** `src/games/**` · Pixi 2.5/nebula · 게임별 visual/motion pass
- **NO-TOUCH:** settlement math · engine packages
- **defer 흡수:** Pixi 2.5 DEFER · casino.hilo/limbo carry (해당 슬라이스에서 i18n만 분리 가능)

### Phase 12-B · Missions 6-Lane Full — ✅ GREEN (2026-06-15 · EXECUTE v2.2 · A1)

- **정본:** [`LOVABLE_ZENITH_PHASE12_B_LOCK.md`](LOVABLE_ZENITH_PHASE12_B_LOCK.md) **§GREEN**
- **실측:** catalog **1099→~1127** · C~F full rows · Checklist contract Δ=0 · 12-E Δ=0 · Hero+Footer mount
- **Bar:** Rollbit/TikTok Lite · 6-lane C~F full · `MissionProgressHero` · WorldCrushBar 부재
- **ZIP:** operator 신호 시 (12-E baseline 104323 B 유지 가능)

### Phase 12-C · Home Hub scaffold — ✅ GREEN (2026-06-15 · EXECUTE v0.2.2 FINAL)

- **정본:** [`LOVABLE_ZENITH_PHASE12_C_LOCK.md`](LOVABLE_ZENITH_PHASE12_C_LOCK.md) **§GREEN**
- **실측:** catalog **1121→1143** (Δ +22) · H1~H6 + Footer #19 · vitest **356/356** · sitemap **42** · JSON-LD **8**
- **defer:** FOMO / tier §E v35 / live feed → **12-C v0.3** (North Star §6 [ ] 12-C full)

### Phase 12-C · Home Hub Supremacy (archive · v0.3 scope)

- **Bar:** Earn first · 첫 3초 FOMO · Stake live feed rhythm
- **Scope:** `ImportedHomePage` · mounted fomo · tier progression **§E v35**
- **defer 흡수:** Dashboard macro (필요 시 홈에 통합 vs 별 route — LOCK에서 확정)

### Phase 12-D · Trade Surface Pro — ✅ GREEN (2026-06-15)

- **정본:** [`LOVABLE_ZENITH_PHASE12_D_LOCK.md`](LOVABLE_ZENITH_PHASE12_D_LOCK.md) · v0.1.1 route split = 본 LOCK §12~§13
- **실측:** catalog **1143→1165** (Δ +22) · scaffold **8** + `trade.hub.tsx` · `/trade`=ImportedTradePage · `/trade/hub`=TradeHub · sitemap **43** · JSON-LD **8** · vitest **356/356**
- **defer:** FOMO/tier/depth/sub-route → **12-D v0.2** · engine wire → **12-Z**

### Phase 12-E · Partner / 총판 Hub — ✅ GREEN (2026-06-15)

- **정본:** [`LOVABLE_ZENITH_PHASE12_E_LOCK.md`](LOVABLE_ZENITH_PHASE12_E_LOCK.md) FINAL v3 · **§GREEN**
- **실측:** catalog **1099** · ZIP user **104323 B** · admin **53109 B** · sitemap **42** · JSON-LD **7→8**
- **Scope:** E1 `/referral` carry · E2 `/partner` gated · `referral.partner.*` +24 · ReferralTree reuse

### Phase 12-H-Admin · Admin Affiliate Ops (선택 · defer OK)

- Admin 8/8 유지 vs 제휴 큐 전용 visual — operator GO 시만
- 기본: **12-E user hub만** · Admin은 기존 queues + paste 후 확장

### Phase 12-Z · Lovable PRODUCT FINAL

- **verify-only** (Phase 10 패턴) · catalog KO=EN · vitest 356/356 · G1–G12+G+
- user/admin ZIP dry+real · KB 기록
- **§GREEN template:** “Lovable PRODUCT FINAL · paste OK”
- **paste 1회 트리거**

---

## 5. 공통 LOCK Footer (Phase 12 전 슬라이스)

**정본:** North Star **§4.6 World Crush Bar** · 아래 블록을 **모든 12-* LOCK**에 그대로 포함.

```text
World Crush Bar (Phase 12 mandatory · FAIL = generic/MVP feel):
· 체감: Stake/Rollbit(베팅) + Binance/Bybit(trade grammar) + 국내 앱테크(미션) 동급 이상
· 첫 3초 urgency OR reward OR density 중 1개 이상 필수
· FOMO: live · countdown · limited slot · streak · social proof (mock OK · engine=0)
· Earn 48px+ · mission.ad.* / survey / offer wall = FAIL
· engine/Supabase/RPC/rpc_* = 0 · UI payout/commission/fee 재계산 = FAIL
· money = string/display props only · float 금지
· i18n only · JSX [가-힣] = 0 · KO=EN strict
· SW 등록 = 0 (11-C까지) · vite-plugin-pwa 미설치
· SEO bar + Mission bar (North Star §4.5) 동시 포함
· operator GO 없이 EXECUTE 금지
· PHONARA paste = 12-Z 후 1회만
· 슬라이스별 1줄: North Star §4.6 표 참조
```

### 5.1 체감 완성 로드맵 (operator · paste 전)

```text
목표: FOMO 터짐 + 한국 앱테크 압살 + 베팅·트레이드 전세계급 체감 = Phase 12-Z까지 Lovable에서 완성

12-E ⏳  총판/초대 (Stake agent)     ← 현재 EXECUTE
12-B     미션 6레인 full (앱테크·FOMO ROI 1순위)
12-C     홈 Hub (첫 3초 live·urgency)
12-A     게임 World-Class (Stake/Rollbit)
12-D     Trade Pro (Binance/Bybit display)
12-Z     FINAL verify → paste 1회
```

**operator 권장 순서 (ROI):** 12-E → **12-B → 12-C** (FOMO·앱테크) → 12-A → 12-D → 12-Z

---

## 6. PHONARA paste 후 (12-Z 이후 · Lovable 범위 밖)

| 항목 | 담당 |
|------|------|
| ZIP → `apps/web` + `apps/admin` | PHONARA paste 슬라이스 |
| `@phonara/i18n` merge | paste |
| affiliate/viral/mission **RPC wire** | hooks · domain (표시만 · 엔진 정본) |
| `sw.ts` · vite-plugin-pwa · offline cache | PHONARA adapter |
| og:image 절대 URL · icon rename · PwaShell merge | paste adapter memo (v61/v64 baked) |
| `check:full` · E2E · conservation | PHONARA gates |

---

## 7. Phase 10 defer → Phase 12 흡수 매핑

| 기존 defer | 흡수 슬라이스 |
|------------|---------------|
| Pixi 2.5 · 게임 연출 | 12-A |
| 7-viral-referral-route · mission.viral | 12-B · 12-E |
| tier §E v35 | 12-C |
| 13 carry KR (trade/* 등) | 12-D (+ 12-A casino.hilo/limbo) |
| 4.5-i18n · scrim/toast/shortkey | 12-B/12-C micro 또는 12-Z 전 micro |
| `/referral` placeholder · affiliate UI 0 | **12-E** |
| Dashboard defer | 12-C LOCK에서 결정 |
| MFA 2-route split | paste adapter (PHONARA) |
| full Binance CLOB | **별도 프로그램** (North Star §5-C) |

---

## 8. 문서 인덱스

| 문서 | 역할 |
|------|------|
| **[`LOVABLE_ZENITH_INDEX.md`](LOVABLE_ZENITH_INDEX.md)** | **단일 진입점** · LOCK/EXECUTE 목록 |
| **[`archive/lovable-zenith-reference/`](archive/lovable-zenith-reference/README.md)** | **상세 본문 아카이브** (paste/Cursor 참고) |
| **이 파일** | Phase 12 매크로 · paste 게이트 12-Z |
| `LOVABLE_ZENITH_NEW_CHAT.md` | Lovable 채팅 인계 (짧은 handoff) |
| `LOVABLE_ZENITH_ROADMAP.md` | §GREEN 이력 |
| `PHONARA_NORTH_STAR_PLAN.md` | 압살 “왜” · §10 미션 taxonomy |
| `PHONARA_CURSOR_PASTE_CRUSH_LOCK.md` | **paste GO 후 v4** P0~P7 · §0-6 LOCK |

---

*LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN · v2 · 2026-06-15 · World Crush Bar §5 baked · paste = 12-Z 후 1회*
