# PHONARA 최종 플랜 — North Star (압살 목표)

> **용도:** operator·AI가 “왜 이 슬라이스를 하는가”를 잃지 않게 하는 **최종 목표 정본**.  
> **연결:** [`PHONARA_V2_MASTER_PLAN.md`](PHONARA_V2_MASTER_PLAN.md) (제품·엔진) · [`LOVABLE_ZENITH_ROADMAP.md`](LOVABLE_ZENITH_ROADMAP.md) (UI 실행) · [`CURRENT_STATUS.md`](CURRENT_STATUS.md) (지금 어디).  
> **갱신:** 2026-06-15 · World Crush Bar §4.6 · Phase 12 체감 로드맵

---

## 1. 한 줄 목표

**Stake·Rollbit·Binance·Bybit·국내 앱테크(소형·대형)를 “전부 같은 방식으로” 이기는 게 아니라, Earn+casino+가벼운 trade+돈 안 터지는 운영으로 각자 약한 축에서 압도한다.**

---

## 2. 압살 대상 — 누구와 어디서 싸우나

| 상대 | 그들의 무기 | PHONARA가 이길 전장 | PHONARA가 지금 피할 전장 |
|------|-------------|---------------------|---------------------------|
| **Stake.com** | 카지노 UX·속도·브랜드·크립토 입출 | provably fair 10종 · Earn 퍼널 · 1인 ops 마진 | 글로벌 마케팅 예산·라이선스 포트폴리오 |
| **Rollbit** | 게임+트레이드 한 앱 · FOMO · 밀도 | 게임 10/10 + trade rules + FOMO/Earn (Phase 7–8) | 유동성 깊이·대형 KOL |
| **Binance** | CLOB·유동성·신뢰·앱 완성도 | spot/futures **MVP** · RG·킬스위치 · 감사 가능 원장 | 풀 매칭엔진·글로벌 현물 깊이 |
| **Bybit** | 파생·프로 트레이더 UX | trade density 토큰 · rules Sheet · conservation | 프로 터미널 100% 동등 |
| **국내 소형 앱테크** | 빠른 출시·결제·마케팅 | **엔진·E2E·원장·Admin 자동화** — 돈 터지면 끝인 영역 | 초기 DAU 숫자 경쟁 |
| **국내 중형 앱테크** | 미션·쿠폰·멤버십·푸시 | **6레인 미션 taxonomy** · 일일/주간/성장/바이럴 한 화면 | 오프라인 제휴·대형 결제망 |
| **국내 대형 앱테크** | 채널·자본·브랜드 | 니치(Earn+casino+light trade) · 실행 속도 · 1인 운영 | 전면 마케팅·오프라인 |
| **TikTok Lite / 숏폼 리워드** | 영상 시청·연속 출석·초대 | **짧은 세션 루프(A)** + **바이럴 공유(C)** — 영상 광고 wall **UI 금지** | 자체 광고 네트워크·UGC 플랫폼 |

---

## 3. 승부를 가르는 6개 층 (초등학생 비유)

| 층 | 비유 | PHONARA 지금 |
|----|------|--------------|
| **① 금고** | 돈 계산·원장 | ✅ **ENGINE 100** — Σ=0 · idempotency · SQL/E2E |
| **② 놀이터** | 게임·카지노 화면 | ✅ Lovable **10/10** · Auto 6/6 |
| **③ 껍데기** | 앱 메뉴·탭·티어·Footer/Banner | ✅ Phase 5 macro (tier · faq · **footer-banner** ✅) |
| **④ 설명서** | 도움말·i18n | ✅ 게임 rules 134키 · **trade.rules 14키** |
| **⑤ 불끼기** | Earn·바이럴·FOMO | ✅ Phase 7 i18n **CLOSED** (v34) · macro defer: viral · **tier §E v35** |
| **⑥ 운영실** | Admin·장애·출금 | ✅ 엔진+Admin 설계 · ⏳ prod smoke·ops loop |

**한 줄:** 금고(①)는 이미 많이 깔림. 지금은 ③④를 채워 **첫인상**을 Stake급으로 올리는 중.

---

## 4. PHONARA만의 싸움법 (Manifest 정본)

```
Earn first  →  Casino  →  Wallet  →  Trade last
```

| 원칙 | 의미 |
|------|------|
| **Earn first** | 들어오자마자 “벌었다” — 밀도 낮음 · 48px+ 터치 |
| **Casino** | 게임 중심 · provably fair · medium density |
| **Trade last** | 거래소 문법은 `/trade`에만 · high density 격리 |
| **1인 99% Admin** | 정상은 자동 · 사람은 예외 큐만 |
| **돈 no-touch UI** | Lovable은 표시만 · 정산/RPC는 PHONARA 엔진 |

---

## 4.5 품질 바 — SEO·미션·표면 (전 슬라이스 mandatory · operator 2026-06-15)

> **목표:** Stake.com · Rollbit · Binance · Bybit **압살급** — 모든 Phase 8–10 슬라이스·미션·SEO에 LOCK 게이트로 강제.

### SEO bar (세계 1위급)

| 축 | Stake/Rollbit | Binance/Bybit | PHONARA LOCK |
|----|---------------|---------------|--------------|
| Meta | 브랜드+혜택 훅 · OG | trust·키워드 | **전 route** `seo.*` title+description · ko=en strict |
| URL | 짧고 기억 | 계층 명확 | flat paste 정합 (`/ledger` `/staking` 등) |
| Copy | FOMO·urgency | 전문·신뢰 | i18n only · JSX `[가-힣]` 0 |
| Head | 소셜 공유 | 다국어 준비 | route `head()` 또는 co-located meta · G1 LOC 규칙 |
| Tech | mobile-first | tabular nums | Phase 10: sitemap/structured data 점검 |

**슬라이스 LOCK footer (복붙):**

```text
SEO bar: Stake/Rollbit conversion meta + Binance/Bybit trust · ko=en · G3 KR=0 · G10 carry NO-TOUCH
```

### Mission bar (Rollbit/Stake 리텐션 · 국내 앱테크)

| 원칙 | 적용 |
|------|------|
| Earn first | 홈/미션 저밀도 · 48px+ · 즉시 보상 피드백 |
| 6레인 taxonomy | daily · growth · viral · season · tier · fomo — `mission.*` 확장 시 next-action copy |
| FOMO | countdown · limited slot · streak · ranking — 표시 mock OK · 엔진 mutation 금지 |
| 바이럴 defer | deeplink · share · `mission.viral.*` — Stake referral tree 체감 |
| tier §E v35 | BonusTier/LimitedDrop **진행·혜택 UI** — 표면만 |
| operator LOCK | **영상/설문 광고 미션 0** · mock/callback only |

**슬라이스 LOCK footer (복붙):**

```text
Mission bar: Earn-first retention · next-action i18n · FOMO allowed · no ad missions · engine NO-TOUCH
```

### World Crush Bar — FOMO·앱테크·베팅·트레이드 전세계 압살 (operator 확정 · Phase 12 mandatory)

> **한 줄:** Stake/Rollbit(베팅·카지노) + Binance/Bybit(trade grammar) + 국내 앱테크(미션·리텐션) **동급 이상 체감**.  
> 「그냥 괜찮음」= **FAIL**. 첫 3초에 urgency · reward · density 중 **최소 1개는 터져야** 함.  
> **Lovable paste 1회 전** Phase 12 전 슬라이스에서 LOCK Footer + §GREEN에 반드시 포함.

#### 체감 축 → Phase 12 슬라이스 (완성 순서)

| 체감 | 사용자가 느껴야 하는 것 | 슬라이스 | North Star 상대 |
|------|-------------------------|----------|-----------------|
| **FOMO 터짐** | live 피드 · 온라인 수 · 한정 슬롯 · countdown · streak · “방금 N명” | **12-C 홈** · **12-B 미션** · Earn/FOMO | Rollbit · 앱테크 |
| **앱테크 압살** | 6레인 미션 full · daily/growth/viral · 48px+ · 짧은 보상 루프 | **12-B** | TikTok Lite · 국내 중형 |
| **베팅·카지노 압살** | 게임별 연출 · PF UX · rules · motion · 60fps 체감 | **12-A** | Stake · Rollbit |
| **트레이드 압살** | order book 밀도 · tabular nums · rules · RG/kill UI | **12-D** | Binance · Bybit (display MVP) |
| **총판·바이럴** | E1 초대 + E2 gated `/partner` · tier · tree · commission | **12-E** | Stake agent portal |
| **앱급 신뢰** | PWA · SEO · install | **11-B/C ✅** | conversion + trust |

#### Lovable 체감 완성도 (paste 전 · operator 기준)

```text
12-E (지금)  ████░░░░░░░░  총판/초대 허브
12-B         ░░░░████████  미션 6레인 + viral  ← 앱테크·FOMO 핵심 ROI
12-C         ░░░░░░██████  홈 첫 3초 live·urgency
12-A         ░░░░░░░░████  게임 World-Class
12-D         ░░░░░░░░░░██  Trade Surface Pro
12-Z         ░░░░░░░░░░░█  PRODUCT FINAL → paste 1회
```

**12-E 단독으로 “전세계 압살” 완성 아님.** 12-Z GREEN = 전 축 한 번에 검증.

#### World Crush Bar — LOCK footer (전 슬라이스 복붙 · FAIL = generic/MVP feel)

```text
World Crush Bar (Phase 12 mandatory):
· 체감: Stake/Rollbit(베팅) + Binance/Bybit(trade grammar) + 국내 앱테크(미션) 동급 이상
· FAIL: flat MVP · “placeholder 느낌” · 첫 3초 urgency/reward/density 전무
· FOMO: live rhythm · countdown · limited slot · streak · social proof rows (mock OK · engine=0)
· Earn: 48px+ touch · low density · instant reward feedback (Earn first)
· Casino (12-A): per-game pass · PF UX · rules Sheet · Stake/Rollbit genre bar
· Trade (12-D): density tokens · order book · tabular nums · rules · RG/kill states (full CLOB = out of scope)
· App-tech (12-B): North Star §10 · 6-lane full · daily/growth/viral/weekly/tier/social
· mission.ad.* / survey / offer wall = FAIL (red-grep)
· engine/Supabase/RPC=0 · payout/commission/fee UI 재계산 = FAIL · mock display props OK
· SEO bar + Mission bar (§4.5) 동시 포함
```

#### 슬라이스별 World Crush 1줄 (LOCK Scope에 필수)

| ID | World Crush 1줄 |
|----|-----------------|
| **12-E** | Stake agent portal: tier badge · depth-2 tree · commission 3-state · share rhythm · `/partner` gated noindex |
| **12-B** | Rollbit season + TikTok Lite loop: mission 6-lane **full rows** · viral lane · FOMO rows |
| **12-C** | Home 첫 3초: live feed · urgency banner · tier §E v35 surface · Stake entry rhythm |
| **12-A** | Stake/Rollbit per-game: motion · PF · rules · brand density · 60fps feel |
| **12-D** | Binance/Bybit display MVP: terminal grammar · book density · rules modal · carry trade i18n only |
| **12-Z** | 전 route catalog · vitest · ZIP · World Crush checklist §6 전항 pass |

---

## 5. 최종까지 로드맵 (압살 관점)

### A. Lovable UI · Phase 12-Z까지 (paste 1회 전)

> **operator 확정 (2026-06-15):** Stake/Rollbit/Binance/Bybit **체감 압살급** UI는 **Lovable Phase 12**에서 마친 뒤 **paste 1회**.  
> **매크로 정본:** [`LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md`](LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md)

| 단계 | 내용 | 압살에 기여 |
|------|------|-------------|
| ✅ Engine 100 | money · casino · crypto · viral · **affiliate** | Binance/국내 소형 대비 **신뢰** |
| ✅ Lovable 0–4 | 게임 10 · Auto P1 | Stake/Rollbit **같은 장르** (MVP) |
| ✅ Phase 5 macro | shell · tier · trade rules · footer-banner | **첫 3초·완성도** |
| ✅ **Phase 6–10** | ui · Phase 7–8 32+8 · Admin · verify ZIP | **route shell CLOSE** (≠ 제품 완성) |
| ✅ **Phase 11-B** | SEO·a11y·shell·PWA manifest 기초 · catalog **1059** | 검색·신뢰·접근성 |
| ✅ **Phase 11-C** | PWA Supremacy · catalog **1075** | install·offline·shortcuts · SW=0 |
| ⏳ **Phase 12-A** | Games World-Class Pass | Stake/Rollbit **연출·퀄리티** |
| ✅ **Phase 12-B** | Missions 6-Lane Full | Rollbit/앱테크 **리텐션** (§10 full) |
| ✅ **Phase 12-C** | Home Hub scaffold · v0.3 FOMO defer | **첫 3초·FOMO** (6-teaser ✅) |
| ⏳ **Phase 12-D** | Trade Surface Pro | Binance/Bybit **display grammar** (MVP) |
| ✅ **Phase 12-E** | Partner / **총판 Hub** | affiliate **엔진 UI** (Supabase ✅ · Lovable ✅) |
| ⏳ **Phase 12-Z** | Lovable PRODUCT FINAL | **paste OK** 게이트 |
| ⏳ **PHONARA paste** | ZIP → web + admin · i18n · E2E | **12-Z GREEN 후 1회** |

### B. ZIP 이후 (PHONARA paste · 출시)

- Lovable ZIP → `apps/web` paste · placeholder 제거
- Lovable **admin ZIP** → `apps/admin` paste · **기존 admin 디자인/컴포넌트/시각 전량 교체** (엔진 `domain/`·`hooks/`·RPC adapter만 유지)
- `@phonara/i18n` 동기 (`tier.*` · `trade.rules.*` · `admin.*` 등)
- `check:full` · E2E · prod smoke · rc-smoke

### C. 별도 프로그램 (North Star지만 “지금 슬라이스” 아님)

| 프로그램 | Stake/Binance 대비 | 비고 |
|----------|-------------------|------|
| 유동성·CLOB | Binance/Bybit 풀급 | ENGINE 100 scope **밖** · multi-month |
| 라이선스·KYC 글로벌 | Stake급 신뢰 | operator·법무 |
| 마케팅·채널 | 국내 대형 | 제품 완성 **후** |
| Oracle/perp p95 SLO | Bybit 체감 속도 | 문서화됨 · launch blocker 아님 |

---

## 6. “압살” 체크리스트 (출시 전 자가점검)

### World Crush (Phase 12-Z · Lovable FINAL · operator 2026-06-15)

> **정본:** §4.6 · [`LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md`](LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md) §5

- [x] **12-E** 총판 Hub: tier · tree · commission · `/partner` gated · Stake agent 체감
- [x] **12-B** 미션 6레인 **full** · viral · FOMO rows · `mission.ad.*` 0
- [ ] **12-C** 홈 첫 3초: live · urgency · tier §E v35 — **scaffold ✅ (v0.2.2)** · **full → v0.3**
- [ ] **12-A** 게임 10종 Stake/Rollbit급 연출 pass
- [ ] **12-D** trade Binance/Bybit display grammar · tabular nums
- [ ] **12-Z** catalog · vitest · ZIP · red-grep · World Crush footer 전 슬라이스
- [ ] paste **1회** 후 PHONARA `check:full` + E2E

### SEO (Stake/Rollbit/Binance/Bybit 압살급)

- [ ] **전 route** `seo.*` title+description (Phase 8 P8-1~4 + Phase 10 sweep)
- [ ] ko=en strict · en non-empty 100% · G6 key-count parity
- [ ] JSX `[가-힣]` 0 · URL PHONARA paste map 정합 (`/ledger` `/staking` flat)
- [ ] Phase 10: sitemap · OG spot-check · help/FAQ trust copy (Stake help · Binance academy 톤)

### Stake / Rollbit급 (카지노·퍼널)

- [ ] 게임 10종 UI · rules · Auto · PF 검증 E2E
- [x] Earn/Home FOMO · mission i18n (Phase 7 v26–v34) · tier macro **§E v35** defer
- [x] 모바일 PWA · safe-area · 60fps 체감 · **`ImportedPWAInstallPage`** (§P8-1 ✅)
- [ ] ko/en i18n 전면 · release cleanliness

### Binance / Bybit급 (trade — MVP 범위)

- [ ] `/trade` density · rules Sheet · RG/킬스위치 UI
- [ ] spot/futures hook pipeline · conservation E2E
- [ ] **표시 OB** 명확 (매칭엔진 아님을 UX로도 분리)

### 국내 앱테크·TikTok Lite급 (Earn·미션)

- [ ] **6레인 미션 taxonomy** UI (`mission.*` i18n) — §10 정본
- [ ] 일일 루프: 출석 · 연속 · 스핀 · 주간 보드 (소형·틱톡라이트 대응)
- [ ] 성장 미션: 첫 게임/입금/KYC/프로필 (중형 온보딩 대응)
- [ ] 바이럴: 공유·초대·스토리 템플릿 (틱톡·대형 대응 — **광고 시청 UI 없음**)
- [ ] 시즌/티어 마일스톤 + FOMO 카운트다운 (대형·Stake 대응)
- [ ] mock 표시 only · 정산은 엔진 RPC (Lovable no-touch)

### 국내 앱테크급 (신뢰·운영)

- [ ] 원장 conservation · reconciliation green
- [ ] Admin 예외 큐 · audit · MFA
- [ ] 입출금·KRW/crypto rails E2E
- [ ] prod no-mutation smoke · runbook

### 공통 “터지면 끝”

- [ ] `check:release` · `check:full` green
- [ ] service role 브라우저 노출 0
- [ ] floating point money 0

---

## 7. 지금 하는 작업이 North Star에서 어디에 해당하나

| 작업 | North Star |
|------|------------|
| **5-macro-tier-i18n** ✅ | ③ 껍데기 — Stake/Rollbit **티어·신분** 표시 |
| **5-macro-faq-shortcut** ✅ | ④ 설명서 — Bybit/Binance **리스크·초보 이탈** 방지 |
| **5-macro-footer-banner** ✅ | ③ 껍데기 — Stake/Rollbit **브랜드·긴박감** |
| **6-ds-overlay-errorstate** ✅ | ③ — overlay scrim · error-state i18n · ui/ ko=0 |
| **6-ds-toast-token** SKIP ✅ | ③ — sonner 사전 토큰화 |
| **6-ds-ring-offset** ✅ | ③ — focus ring offset 1-form (5파일/6occ) |
| **6-ds-welcomesheet** ✅ | ③ — Earn funnel welcome.* + common.close |
| **6-ds-cva** SKIP ✅ | ③ — 8 cva semantic-clean · Phase 6 close |
| **Phase 7** ✅ | ⑤ — v26–v34 GREEN · catalog **788** · defer body **CLOSED** |
| **§P8-1** ✅ | ③④ — **GREEN** · trade/wallet/games/support/PWA 8면 · catalog **862** |
| **§P8-2** ✅ | ③⑤ — **GREEN** · funnel/auth/home 8면 · catalog **935** |
| **§P8-3** ✅ | ③④ — **GREEN** · legal/account 8면 · catalog **949** · `/responsible-gaming` |
| **§P8-4** ✅ | ③④ — **GREEN** · games/casino/wallet 8면 · catalog **982** · **Phase 8 32/32** |
| **Phase 10** ✅ | ⑥ — **GREEN** · Lovable **CLOSE** · ZIP **103+51 KB** |
| **Phase 11-B** ✅ | 표시 품질 sweep · catalog **1059** · ZIP **100.7+50.6 KB** |
| **Phase 11-C** ✅ | PWA Supremacy · catalog **1075** · ZIP **101.2+51.2 KB** |
| **Phase 12-A~E** ⏳ | Games · Missions · Home · Trade · **총판 Hub** · [`LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md`](LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md) |
| **Phase 12-Z** ⏳ | Lovable PRODUCT FINAL · **paste 게이트** |
| **PHONARA paste** ⏳ | 12-Z GREEN 후 1회 |
| **§E v35 tier** ⏳ | ③⑤ — tier progression macro defer |
| **7-earn-hub-i18n** ✅ | ⑤ — **§E v26 GREEN** · catalog **574** |
| **7-earn-missions-route** ✅ | ⑤ — **§E v26-micro** · `/earn` + `/earn/missions` · catalog **578** |
| **7-viral-referral-card-i18n** ✅ | ⑤ — **§E v27 GREEN** · catalog **587** · `referral.*` **16** |
| **7-viral defer** ⏳ | `7-viral-referral-route` · `7-viral-mission-expand` |
| **7-fomo-wheel-i18n** ✅ | ⑤ — **§E v28 GREEN** · catalog **584** keys · `fomo.*` **17** |
| **7-fomo-streak-i18n** ✅ | ⑤ — **§E v29 GREEN** · catalog **585** keys · `fomo.*` **18** |
| **7-fomo-leaderboard-i18n** ✅ | ⑤ — **§E v30 GREEN** · catalog **589** keys · `fomo.*` **22** |
| **7-fomo-tier-i18n** ✅ | ⑤ — **§E v31 GREEN** · catalog **592** keys · `fomo.*` **25** · mounted fomo **CLOSED** |
| **7-route-seo-head-i18n** ✅ | ⑤ — **§E v32 GREEN** · head desc · catalog **605** |
| **7-phase7-closeout-i18n** ✅ | ⑤ — **§E v33 MEGA GREEN** · mounted funnel 표면 **CLOSED** |
| **7-phase7-defer-closeout** ✅ | ⑤ — **§E v34 GREEN** · catalog **788** · defer body **CLOSED** |
| **7-tier-progression** ⏳ | ③⑤ — Stake tier · **§E v35** · Phase 8 병행 가능 |

---

## 8. AI·operator에게 매 턴

1. **이 슬라이스가 6층 중 어디를 올리는가?**  
2. **SEO bar + Mission bar 충족하는가?** (§4.5 · Stake/Rollbit/Binance/Bybit 압살급)  
3. **엔진 no-touch 위반 없는가?**  
4. **Stake/Rollbit “느낌” vs Binance “깊이” — Earn/Casino는 전자 · `/trade`/`/wallet`은 후자**  
5. **GREEN 전 다음 Phase 금지**

---

## 9. 문서 인덱스

| 문서 | 역할 |
|------|------|
| **이 파일** | 압살 North Star · “왜” |
| `PHONARA_V2_MASTER_PLAN.md` | 제품·엔진 Phase · Build Log |
| `LOVABLE_ZENITH_ROADMAP.md` | UI 슬라이스 · LOCK · “무엇을” |
| `LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md` | **Phase 12 매크로 · paste 12-Z 게이트** |
| `LOVABLE_ZENITH_NEW_CHAT.md` | 새 채팅 30초 · “지금” |
| `CURRENT_STATUS.md` | 게이트·증거 · “증명” |

---

---

## 10. Earn 미션 아키타입 — 앱테크(소·중·대)·TikTok Lite 압살 정본

> **operator 확정 LOCK (2026-06-15):** **영상 광고 미션 · 설문 광고 미션 UI/엔진 슬라이스 모두 넣지 않음.**  
> 금지 키: `mission.ad.*` · `mission.survey.*` · `earn.watchAd` · offer wall · CPA · rewarded video. **예외 없음.**

> **Lovable:** `MissionChecklist` · `/earn` = **6레인 전부 i18n 키로 노출** (mock 진행률·상태).  
> **PHONARA 엔진:** 아래 “엔진 매핑” 열 — Lovable은 **표시만**, payout 재계산 금지.

### 10-A. 6레인 taxonomy (UI must cover all)

| 레인 | i18n prefix | 이기는 상대 | 대표 미션 (UI 행) | 엔진 매핑 (paste 후) |
|------|-------------|-------------|-------------------|----------------------|
| **A 일일** | `mission.daily.*` | 소형 앱테크 · **TikTok Lite** | 출석 체크 · 오늘의 스핀 · 연속 N일 | `daily_claim` · `roulette_spins` · `user_streaks` |
| **B 성장** | `mission.growth.*` | 중형 앱테크 | 프로필 완료 · 첫 게임 · 첫 입금 · KYC | `mission_code`: `complete_profile` · `first_game` · `first_deposit` · `kyc_verified` |
| **C 바이럴** | `mission.viral.*` | TikTok · 대형 | 링크 공유 · 친구 초대 · 스토리 템플릿 · 7일 streak 공유 | `viral_mission_code` 5종 · `referrals` |
| **D 주간/시즌** | `mission.weekly.*` · `mission.event.*` | 중형·대형 · Rollbit | 주간 미션 팩 · 한정 이벤트 · 시즌 목표 | UI mock + FOMO (Phase 7 fomo) · Admin config later |
| **E 티어** | `mission.tier.*` | Stake · 대형 | 티어 달성 · 30일 streak · VIP 게이트 | `streak_30_days` · `tier.*` + `7-tier-progression` |
| **F 커뮤니티** | `mission.social.*` | 중형 · affiliate | 콘텐츠 인증 · 제휴 포스트 (월 1회) | `affiliate_content_post` · quota RPC |

**TikTok Lite 압살 공식:** A(짧은 루프) + C(공유·초대) + D(FOMO) — **“영상 30개 보기” UI는 만들지 않는다.** 대신 공유·초대·출석·스핀이 같은 dopamine slot을 채운다.

### 10-B. `MissionChecklist` UI 규칙 (Lovable)

1. **탭 또는 섹션 6개** — daily · growth · viral · weekly · tier · social (키는 `mission.tab.*`).
2. **행 필드:** `id` · `titleKey` · `descKey` · `rewardDisplay` (string mock) · `progress` · `status`: `available` \| `claimed` \| `locked` \| `comingSoon`.
3. **CORE 4 슬라이스:** A+B 레인 **완전 i18n** + C~F **최소 1행 preview** (`comingSoon` 또는 `locked`) — taxonomy 빈칸 없음.
4. **viral/referral 카드** → `7-viral-referral` · **wallet card** → `7-earn-wallet-card-i18n` micro.
5. **금지 카테고리:** ad watch · survey · offer wall — checklist에 **행 자체를 두지 않음**.

### 10-C. 엔진 기존 코드 (paste 시 wire · 지금 Lovable no-touch)

**retention `mission_code`:** `complete_profile` · `first_trade` · `first_game` · `first_deposit` · `kyc_verified` · `invite_3_friends` · `streak_7_days` · `streak_30_days`

**viral `viral_mission_code`:** `share_referral_link` · `share_story_template` · `invite_friend_signup` · `affiliate_content_post` · `viral_streak_share`

**기타 retention:** daily_claim · roulette_spin · welcome_bonus · referral_bonus

---

*PHONARA North Star · 2026-06-15 · Phase 12 Product Depth · paste = 12-Z 후 1회*
