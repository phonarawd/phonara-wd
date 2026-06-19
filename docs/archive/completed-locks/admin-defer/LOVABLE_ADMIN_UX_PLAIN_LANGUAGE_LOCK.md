# LOVABLE Admin UX Plain Language LOCK — L1-15-UX-Plain v0.3

> **상태:** **§GREEN ✅** · 2026-06-17 · operator evidence · vitest **525/529** · catalog **2535/2535** · nav+title grep **0** · ZIP defer  
> **큐 ID:** **L1-15-UX-Plain** (Admin 표시 명칭 초보자화 · i18n values only · Lovable 전용)  
> **의존:** Admin wave **P0→J §GREEN** · **hook/page/logic 0-touch**  
> **상위:** [`LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md`](LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md)

---

## Scope (1 line)

Values-only swap in `src/i18n/ko.ts` and `src/i18n/en.ts` for admin nav, hub titles, descriptions, tabs, metrics, actions, command palette. **Keys immutable. No hook/component/SEED/logic touch.**

**Pro terms** (감사 로그 · 예외 큐 · 운영 제어 · 킬스위치 · STR · RTP · RBAC) — **description/subtitle only** · **never** nav label or hub `.title`.

---

## UX 원칙 (고정)

| # | 원칙 | FAIL |
|---|------|------|
| U1 | Nav/제목 = **「무엇을 처리하나」** (동사+대상) | 영문 약어만 단독 노출 (STR, RBAC…) |
| U2 | Pro 용어 = **`*.description` · `*.hint` · `*.subtitle`** only | 제목·nav에 STR/RTP/kill switch 단독 |
| U3 | en = ko와 **같은 난이도** (Plain English) | en만 jargon 유지 |
| U4 | **키 ID 불변** — 값만 교체 | key rename/delete |
| U5 | 데스크 **동작·SEED·storage 0-touch** | hook/컴포넌트 로직 변경 |

---

## Value Table (authoritative — apply 1:1)

### Navigation (`admin.nav.*`) — plain only

| key | **ko** | **en** |
|-----|--------|--------|
| `admin.nav.overview` | 오늘 할 일 | Today |
| `admin.nav.queues` | 처리 대기함 | Pending |
| `admin.nav.users` | 회원 관리 | Members |
| `admin.nav.sports` | 스포츠 관리 | Sports |
| `admin.nav.alerts` | 주의 알림 | Alerts |
| `admin.nav.audit` | 처리 기록 | Activity log |
| `admin.nav.operations` | 서비스 ON/OFF | Service toggles |
| `admin.nav.casino` | 게임 관리 | Games |
| `admin.nav.earn` | 추천·정산 | Partners |
| `admin.nav.cms` | 공지·배너 | Content |
| `admin.nav.settings` | 권한·단축키 | Access |
| `admin.nav.mfa` | 2단계 인증 | 2FA policy |

> Canvas에 키 없으면 **append** · 있으면 **value replace** (rename 0).

### Hub titles (plain) + descriptions (pro term allowed in parens)

| prefix | title ko / en | description ko / en (pro → 부제) |
|--------|---------------|----------------------------------|
| `admin.queues` | 처리 대기함 / Pending | 출금·본인확인·의심 거래·위험 신호 (STR·SLA는 탭 부제) |
| `admin.audit` | 처리 기록 / Activity log | 누가·무엇을·왜 처리했는지 확인 (감사 로그 / audit log) |
| `admin.alerts` | 주의 알림 / Alerts | 지연·오류·한도 초과 |
| `admin.operations` | 서비스 ON/OFF / Service toggles | 기능 켜기/끄기 (킬스위치 / kill switch) |
| `admin.users` | 회원 관리 / Members | 검색·정지·로그인 세션·잔액 확인 (표시 전용) |
| `admin.sports` | 스포츠 관리 / Sports | 미정산·노출·위험 (exception queue / 예외 큐는 **탭 부제 only**) |
| `admin.casino` | 게임 관리 / Games | 켜기/점검·배당 (RTP) 이상 |
| `admin.earn` | 추천·정산 / Partners | 파트너 승인·수수료 지급 단계 |
| `admin.cms` | 공지·배너 / Content | 약관·FAQ·홈 배너 게시 상태 |
| `admin.access` / settings | 권한·단축키 / Access | 역할 (RBAC) · 저장된 검색 · Cmd+K |
| `admin.mfa` | 2단계 인증 정책 / 2FA policy | 등급별 로그인 2단계 요구 여부 |

### Tab / queue / metric (plain titles)

| 패턴 | ko | en |
|------|-----|-----|
| Withdraw | 출금 승인 대기 | Withdrawals |
| KYC | 본인 확인 대기 | ID verification |
| STR | 의심 거래 검토 | Suspicious activity |
| Risk/RG | 위험·자기한도 | Limits & risk |
| Kill switch | 기능 켜기/끄기 | Turn feature on/off |
| Cron | 자동 작업 상태 | Automated jobs |
| Queue lag | 대기 줄 길이 | Queue wait |
| Error budget | 오류 한도 | Error budget |
| RTP | 게임 배당 점검 | Payout check |
| Catalog | 게임 목록 | Game list |
| Agents | 파트너 목록 | Partners |
| Settlements | 수수료 지급 | Commissions |
| Pages | 페이지 | Pages |
| Promos | 배너·프로모 | Promos |
| RBAC | 역할 | Roles |
| Saved filters | 저장된 검색 | Saved searches |
| Audit trail | 처리 사유 기록 | Reason log |
| MOCK | 연습 모드 | Practice mode |

### Command palette (`admin.command.*`)

| 패턴 | ko | en |
|------|-----|-----|
| placeholder | 메뉴 검색… | Search menus… |
| group routes | 이동 | Go to |
| footer hint | Esc 닫기 · ↑↓ 선택 | Esc close · ↑↓ navigate |

---

## Baseline (J §GREEN 후 · EXECUTE 전)

| 항목 | 값 |
|------|-----|
| vitest full | **525/529** · 4 NO-TOUCH |
| admin scope | **≥123** |
| Admin wave | **P0→J §GREEN** |
| i18n | ko=en DIFF=0 유지 |

---

## 파일표

| ID | path | action |
|----|------|--------|
| UX1 | `src/i18n/ko.ts` | EDIT values (nav → hubs → tabs → metrics → actions → command) |
| UX2 | `src/i18n/en.ts` | EDIT values (same order, Plain English) |
| UX3 | `src/components/admin/access/__tests__/AdminAccess.test.tsx` | EDIT only if literal-title assert breaks → `t(key)` |
| UX4 | other `src/components/admin/**/__tests__/*` | same conditional fix |

**No new files · No deletes · No key renames · NEW hook/component 0**

---

## Tests

| # | assert |
|---|--------|
| T1 | nav + `.title` refined grep **0 hits** (description/subtitle pro terms **allowed**) |
| T2 | `admin.nav.queues` value = **처리 대기함** (ko) |
| T3 | ko=en key set **동일** (DIFF=0) |
| T4 | vitest **525/529 carry** (4 NO-TOUCH) |
| T5 | admin JSX `[가-힣]` **0** (catalog only) |

---

## NO-TOUCH

B~J hook impl · desk SEED · localStorage · user routes · FROZEN games · rpc · ZIP

**FAIL =** pro term in nav/`.title` · key rename/delete · hook/logic change

---

## LOCK Footer UX1–UX6

| # | 고정 |
|---|------|
| UX1 | keys immutable · values only |
| UX2 | nav + title plain · description 표 1:1 |
| UX3 | pro jargon → description/subtitle only |
| UX4 | vitest full ≥525/529 carry |
| UX5 | ko=en DIFF=0 |
| UX6 | §GREEN grep = **nav + `.title` scope only** |

---

## EXECUTE Steps 0→6

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline |
| 1 | UX1 ko values |
| 2 | UX2 en values |
| 3 | UX3/UX4 conditional fix (key-based asserts) |
| 4 | vitest admin + wallet + sports + full |
| 5 | §GREEN self-check (refined greps) |
| 6 | 9b-UX 60s manual |

---

## §GREEN full block (refined — nav/title scope only)

```bash
bunx vitest run src/components/admin/
bunx vitest run wallet
bunx vitest run sports

diff <(rg -o '^\s+"[^"]+":' src/i18n/ko.ts|sort) <(rg -o '^\s+"[^"]+":' src/i18n/en.ts|sort)

# nav + .title scope only (description/subtitle pro terms are intentional)
rg -nE '"admin\.nav\.[^"]+":\s*"(감사 로그|예외 큐|운영 제어|킬스위치)"' src/i18n/ko.ts
rg -nE '"admin\.[a-z]+\.title":\s*"(감사 로그|예외 큐|운영 제어|킬스위치)"' src/i18n/ko.ts
rg -nE '"admin\.nav\.[^"]+":\s*"(Audit log|Exception queue|Operations control|Kill switch)"' src/i18n/en.ts
rg -nE '"admin\.[a-z]+\.title":\s*"(Audit log|Exception queue|Operations control|Kill switch)"' src/i18n/en.ts

rg -n '[가-힣]' src/components/admin/ --glob '!**/i18n/**'
```

**PASS:** vitest **525/529 carry** · ko=en DIFF=0 · **nav+title grep = 0** · description hits allowed · admin JSX Hangul = 0.

## §GREEN evidence (2026-06-17 · operator)

| # | assert | result |
|---|--------|--------|
| E1 | vitest full | **525/529** ✓ (4 baseline NO-TOUCH carry) |
| E2 | ko=en keys | **2535/2535** DIFF=0 ✓ |
| E3 | nav+title pro-term grep ko+en | **0 hits** ✓ |
| E4 | admin JSX `[가-힣]` | **6 hits pre-existing carry** — 본 슬라이스 신규 0 · defer L1-19 or paste hygiene |
| E5 | 9b-UX manual | operator PASS (implicit) |
| E6 | B~J hook/logic | 회귀 0 (values-only) |

**§GREEN template (closed):**

```text
L1-15-UX-Plain §GREEN — plain i18n · keys immutable · ko=en 2535/2535 DIFF=0 · vitest 525/529 carry · nav+title grep 0 · 9b-UX PASS · B~J logic 0 · admin JSX Hangul 6 pre-existing carry · ZIP defer.
```

**Next HEAD:** **L1-16** Home IA ([`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md)) — **ZIP = operator explicit GO only** (G-WC1~3 선행)

---

## 9b-UX manual (operator 60s)

1. 사이드바: **오늘 할 일 → 처리 대기함 → 주의 알림 → 처리 기록**
2. **처리 대기함** 탭: 출금 / 본인 확인 / 의심 거래 / 위험 — 이름만으로 구분
3. **서비스 ON/OFF**: description에 킬스위치 부제 확인
4. en 모드: Korean 0 · plain titles

---

## PHONARA repo 경계

| 영역 | UX-Plain |
|------|----------|
| Lovable canvas `src/i18n/*.ts` | **EXECUTE 대상** |
| PHONARA `packages/i18n` · `apps/admin` | **paste/ZIP 전 0-touch** |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 DRAFT |
| 2026-06-17 | v0.2 EXECUTE GO |
| 2026-06-17 | **v0.3** — §GREEN grep nav+`.title` refined |
| 2026-06-17 | **§GREEN** — vitest 525/529 · catalog 2535/2535 · nav+title grep 0 · JSX Hangul 6 pre-existing carry |

---

*Lovable canvas only · PHONARA paste 전 · ZIP = operator explicit GO*
