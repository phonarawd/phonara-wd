# PHONARA 프로젝트 DNA 그라운드 트루스 감사

> **감사일:** 2026-07-15 · **모드:** READ-ONLY (파일 수정·테스트 실행 없음)  
> **Branch:** `phase-r/world-class-presentation-2026-07-15` · **HEAD:** `06450b6e`  
> **방법론:** 9개 read-only 병렬 서브에이전트 역공학 조사 + 직접 검증(스크립트 카운트 재확인 · `git status` 재확인 · RPC 카운트 재확인). 파일 수정·테스트 실행·마이그레이션 적용 **0건**.  
> **인용 규칙:** 모든 판정은 실제 파일 경로(가능하면 file:line) 근거. 확인 불가 항목은 추측하지 않고 명시적으로 **미확인(NOT VERIFIED)** 표기.  
> **범위:** operator 요청 "PHONARA PROJECT DNA DISCOVERY AUDIT" Phase 0(그라운드 트루스) ~ Phase 10(기술적 건강도) 전 영역.  
> **선행 감사와의 관계:** 본 문서는 `docs/audit/SYSTEM_AUDIT_2026-07-13/`, `docs/audit/ZERO_ASSUMPTION_FULL_AUDIT_2026-07-13.md`, `docs/audit/visual-ux-2026-07-11/`, `docs/audit/MASTER_INVENTORY_AUDIT_2026-07-13.md`를 **1차 근거로 재활용**하고, 코드 직접 확인으로 재검증한 뒤 통합한 결과다. 기존 audit을 대체하지 않으며, 각 절에서 상충/노후화 지점을 명시한다.

## 목차

0. 감사 방법론 및 도구 한계
1. 종합 요약
2. 제품 DNA
3. 제품 철학 (검증된 것만)
4. 제품/엔지니어링 규칙
5. 문서 인벤토리
6. 기술 스택
7. 아키텍처
8. 디자인 시스템
9. 컴포넌트 시스템
10. UX 실태 (현재 사용자 흐름)
11. UI 실태 (현재 시각 언어)
12. 내비게이션
13. 정보 구조 (IA)
14. 반응형 전략
15. 모션 전략
16. 접근성
17. 기술적 건강도
18. 기존 제약사항 (Non-negotiable)
19. 미확인 / Not Verified
20. 종합 그라운드 트루스

---

## 0. 감사 방법론 및 도구 한계

- **읽기 전용 원칙 (rule `30-audit-discipline.mdc` 준수):** 분석 단계 전체에서 파일 수정·테스트 작성·실행·마이그레이션 적용을 하지 않았다. 근거 없는 판정은 PASS/FAIL 대신 `미확인`으로 표기했다.
- **9개 병렬 서브에이전트 조사 영역:** ① SSOT/상태 문서 정합성 재구성, ② 문서 인벤토리(SSOT·PRODUCT·OPERATIONS·audit), ③ 엔지니어링/아키텍처 스택, ④ 디자인 시스템, ⑤ 컴포넌트·정보구조, ⑥ 엔진/머니/지갑/DB, ⑦ UX 흐름 실태, ⑧ UI/모션/접근성 실태, ⑨ 기술적 건강도 및 규칙 집행 검증.
- **직접 재검증한 항목:** `package.json` 스크립트 개수(서브에이전트가 100으로 보고 → 직접 grep으로 **232개**로 정정), `rpc_*` 함수 중복 제거 카운트(직접 정규식 카운트 **257개**), `.cursor/perf/` 와 `.gitignore` 상충 여부(현재 `git status`로는 재현되지 않음 — 최초 스냅샷 이후 정리된 것으로 판단), 브랜치/HEAD(`.git/HEAD`·`git log` 직접 확인).
- **도구 아티팩트 주의:** 이 Windows 워크스페이스의 Glob/Grep 도구는 동일 파일을 `/` 구분자판과 `\` 구분자판으로 **중복 보고**하는 경우가 있다(대량 결과일 때). 서브에이전트 보고 중 "raw count"라고 명시된 수치는 이 아티팩트로 부풀려져 있을 수 있으므로, 본 문서는 가능한 경우 "탈중복 확인" 수치를 우선 채택했다.
- **선행 감사 활용:** `docs/audit/SYSTEM_AUDIT_2026-07-13/`(7-Pillar), `docs/audit/ZERO_ASSUMPTION_FULL_AUDIT_2026-07-13.md`, `docs/audit/visual-ux-2026-07-11/`, `docs/audit/MASTER_INVENTORY_AUDIT_2026-07-13.md`, `docs/audit/PLATFORM_AUDIT_REFERENCE.md`, `docs/audit/KNIP_DEADCODE_REPORT.md`, `docs/audit/RPC_USAGE_MATRIX.md`, `docs/audit/PER_PAGE_UI_MATRIX.md`, `docs/audit/REPO_TREE_APPENDIX.txt`를 1차 근거로 읽고, 최소 3개 이상의 핵심 주장을 코드 직접 대조로 재검증했다(§8, §11, §17 참조).

---

## 1. 종합 요약

PHONARA는 초기 단계 프로젝트가 아니라 **성숙하고, 스스로를 반복적으로 감사해 온, 출시 직전 단계의 크립토 인접 "앱테크" 슈퍼앱**이다. 엔진(Postgres/RPC/원장/게임/거래/스포츠북)은 2026-07-03부터 **`FULLY CLOSED`** 상태로 선언되어 있다(`docs/ENGINE_APEX_CLOSEOUT.md`). 이전 UI 계층은 의도적으로 전량 삭제되었고("v5 Demolition", `docs/PRODUCT/ADR/000-v5-demolition-first.md`), 이후 새 프레젠테이션 아키텍처(`apps/web/src/product/*`)가 상당 부분 재구축되어 92개 등록 라우트, 27개 도메인 폴더에 걸친 약 191개 surface 파일, 410개 파일의 "display contract" 계층, 그리고 12종 카지노 게임 **전부**의 실제 구현(placeholder 아님, 4일 전 감사의 판정은 이미 낡음)을 보유하고 있다.

플랫폼은 현재 정식 **Release Freeze**(`docs/OPERATIONS/PLATFORM_RELEASE_FREEZE.md`) 상태이며, 7-Pillar 감사(`docs/audit/SYSTEM_AUDIT_2026-07-13/`)는 Repository 96, Database 85, Frontend 86, Backend 89, Security 84, Performance 63, Release Readiness 38/100으로 채점했다. 추적 중인 38개 보안/플랫폼 결함 중 36개가 `VERIFIED_FIXED`이며, 남은 2건은 **코드가 아니라 operator/결제에 의해 막혀 있다**(Supabase Pro+ 결제, 그리고 24시간 소크·3-Owner 서명·DR 훈련 같은 순전히 일정/서명 절차 — 문서상 실행된 증거가 없다). 기록된 판정: **Soft Launch = 조건부 GO · Closed Beta = NO-GO(근접) · Public Launch = NO-GO** — 결함 때문이 아니라 프로세스/operator 액션 때문이다.

지금, 워킹트리에는 오늘(2026-07-15) 진행 중인 카지노 UX 정비 작업이 실시간으로 반영되어 있다(Hilo/Crash/Limbo/Mines/Dice 방금 수정, Deepshaft가 다음 차례) — 이는 바로 지금 이 "DNA discovery audit" 같은 자기 재감사를 반복하는 리포지토리의 습관을 보여주는 사례이며, 실제로 07-08·07-11·07-13에 기록된 이전 감사들을 이번 보고서가 맹목적으로 재도출하지 않고 1차 근거로 읽고 교차검증했다.

엔지니어링 규율은 이 단계 프로젝트로서는 이례적으로 엄격하다: Decimal-only 금액, DB 레벨로 강제되는 append-only 원장, 코드로 강제되는 도메인 격리, 위험한 에이전트 행동을 실제로 차단하는(문서상으로만이 아니라) hook/permission 계층, 그리고 거의 0에 가까운 전형적 기술부채 마커(TODO/FIXME/HACK 0건, 앱 소스 콘솔문 0건, `.only()` 테스트 잔재 0건). 이번 감사의 가장 중요한 발견은 코드 결함이 아니라 **문서 신선도 문제**다: 저장소 안에 "현재 상태"를 서술하는 3개 문서(`.cursorrules`, `AGENTS.md`, 07-13 감사 자신의 executive scorecard)가 각각 다른, 더 오래된 시점을 서술하고 있으며, 가장 최신인 감사조차 하루 뒤의 자기 하위 문서와 상충한다.

---

## 2. 제품 DNA

**이름:** PHONARA. **유형:** 12종 provably-fair 카지노, 스포츠북, 현물/선물 거래, 스테이킹, earn/미션/리퍼럴 레이어를 하나의 Supabase 기반 아이덴티티와 **3-통화 지갑(PHON/USDT/KRW)** 아래 통합한, 실거래 인접 "앱테크" 슈퍼앱.

**자체 설명** (`README.md` 루트): *"PHONARA는 카지노(12종 provably-fair 게임)·스포츠북·현물/선물 거래·스테이킹·리퍼럴 리워드를 하나의 지갑(USDT/PHON 듀얼 통화)으로 묶은 실시간 앱테크·거래 플랫폼이다"* — **주의:** README 문구 자체가 "듀얼 통화"라고 쓰고 있으나 스키마는 이를 반박한다(아래 참조). 이는 코드보다 문서가 뒤처지는 사례가 README 수준에서도 존재함을 보여주는 근거다.

**비전 퍼널** (`docs/SSOT/PLATFORM_NARRATIVE_CANON.md`, `docs/SSOT/HOME_UX_CANON.md`, 실제 5-tab `BottomNav`로 독립 검증): **Earn → Wallet → Trading(Spot/Futures/Staking) → Sports → Casino**, Deposit·VIP/Tier·일일 습관(출석·스트릭·미션)은 별도 탭이 아니라 연결 조직으로 존재. 코드 근거: `apps/web/src/product/shell/bottom-nav.tsx`는 정확히 5개 탭(Earn→`/home`, Wallet→`/wallet`, Trade→`/trade`, Sports→`/sports`, Casino→`/casino`)을 렌더링하고, `apps/web/src/domain/earn-home-display-contract.ts`의 `EARN_HOME_ENTRY_CARDS`는 Earn 허브를 missions/events/wallet/sports/trade로의 navigate-only 카드로만 연결한다.

**"앱테크" 자기 포지셔닝:** 코드베이스는 Earn 쪽 미니게임(`/earn/play`, 무료 일일 룰렛)과 실제 Casino(`/games/roulette`)를 인라인 disclaimer i18n 키(`earn.play.casinoNotice`)로 명시적으로 구분한다 — "리워드 메커닉"과 "도박"의 경계를 마케팅이 아니라 제품 내부 카피에서 스스로 긋고 있다.

**아이덴티티 모델(검증됨):** 1개의 Supabase `auth.users` 행이 2개의 연쇄 트리거를 통해 정확히 1개의 `profiles` 행과 1개의 `wallets` 행을 자동 생성한다.

```sql
-- supabase/migrations/20260609000001_phase1_auth_wallet_ledger.sql:202-230
CREATE OR REPLACE FUNCTION create_wallet_for_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_create_wallet
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_wallet_for_profile();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

`profiles`/`wallets`에 대한 수동 INSERT 경로는 어디에도 없다 — 테스트에서조차 금지되어 있다(`supabase/AGENTS.md`).

**지갑 모델(검증됨·정정됨):** 사용자당 1개의 `wallets` 행, **3개 통화 × (available, locked) = 6개 잔액 컬럼**, 부동소수점이 아닌 정규식 제약 `TEXT`로 저장. 스키마 주석은 잔액이 "`wallet_ledger`의 DERIVED view이며 직접 mutate 금지"라고 명시하지만, 물리적으로는 row lock 하에 in-place UPDATE된다. `packages/shared-types/src/database.types.ts`가 enum을 확정: `currency: "PHON" | "USDT" | "KRW"`. 크립토 온체인 레일은 USDT 단일 자산, TRC20/ERC20 2개 체인. KRW 은행이체는 **의도적으로 수동**("Hybrid L3" — `docs/SSOT/WALLET_UX_CANON.md`는 "자동 입금 감지" 카피를 명시적으로 금지).

**비즈니스 로직 우선순위(ADR·Engine-Gap 문서로 검증됨):** 제품은 "Track A"(UI 재구축)와 병렬 "Track B"(엔진 패리티 웨이브 E0–E10, E21–E23)를 모두 완료했다고 자평한다 — tier decay, mission catalog, viral/CMS, tier Option B, 소셜/금융 연동(PHON P2P 전송, 거래 API 키, 상품권 역환전), 아이덴티티/지원(SIWE 로그인, 지원 티켓, 분석), 플랫폼 엔진(KRW 입금증 업로드, 미션 체인, co-bet), 그리고 트레이드/스포츠/카지노 "패리티" 웨이브(헤지/reduce-only 포지션, 부분 캐시아웃, 라이브/progressive 카지노 라운드). 모두 `docs/SSOT/ACTIVE_WORK_SSOT.md`에 `[x] DONE`으로 기록.

**기존 유저 저니/퍼널(코드로 검증, §10에서 상세):** Auth → (onboarding 미완료 체크) → `/onboarding` 3단계 인트로 → `/onboarding/missions`(D0 미션: 웰컴보너스, 프로필완성, 공유) → `/home`(Earn 허브, 5단 progressive-disclosure) → missions/events/wallet/sports/trade로의 navigate-only 이동. Onboarding 완료 여부는 **`localStorage`에만 기록**되며 DB 플래그가 아니다.

---

## 3. 제품 철학 (검증된 것만)

아래 표의 모든 항목은 canon/ADR/rule 파일에 명시적으로 진술되어 있고, 가능한 경우 코드로 대조 검증했다.

| 원칙 | 근거 문서 | 코드 강제 여부 |
| --- | --- | --- |
| **UI는 금액을 재계산하지 않는다.** 페이오프·PnL·오즈·수수료·강제청산·정산은 RPC/SQL 전용이며 UI는 값을 표시만 한다. | `docs/SSOT/ENGINE_BOUNDARY.md` | `packages/game-engine/src/lib/quantize.ts`의 `quantize6()`는 JS `number`가 들어오면 런타임에 throw; `trading-engine`/`sportsbook-engine` 패키지는 "preview/validation only"라는 doc-comment를 명시적으로 보유. |
| **금액은 Decimal, float 금지; 원장은 append-only.** | `docs/SSOT/MONEY_CONSERVATION_FORMULA.md`, ADR-0006(`wallet-sigma-rule`) | `wallet_ledger` 테이블에 `UPDATE`/`DELETE`에 대한 `CREATE RULE ... DO INSTEAD NOTHING`이 문자 그대로 존재 — 앱 컨벤션이 아니라 DB 강제. |
| **보존 불변식: 통화별 Σ=0, 범위 한정.** | `docs/SSOT/MONEY_CONSERVATION_FORMULA.md`: `GRAND_TOTAL(c) = Σ wallets(available+locked) + Σ system_accounts.balance`, 불변식은 `c ∈ {PHON, USDT}`에만 적용 — **KRW, 미결제 선물 PnL, 미체결 주문, 미정산 스테이킹은 정산 전까지 명시적으로 제외.** | `supabase/tests/`의 142개 SQL 통합 테스트 중 다수가 `*_conservation_test.sql`. |
| **정직하고 fail-closed한 표현.** 가짜 소셜 프루프·거짓 긴급성/마감·확정 수익 주장 금지; 미공급 rail은 감추는 것이 아니라 숨겨야(hide) 한다. | `docs/SSOT/COPYWRITING_CANON.md`, rule `90-ui-ux-presentation.mdc` | 2026-07-13 감사 자체 강점 목록: "합성 사회적 증거 제거(C-01) · status live 연결(C-02) · 미공급 rail 숨김(H-03/H-05/H-11)"이 **이미 remediate된 finding**으로 인용됨. |
| **도메인 격리 — 5탭, 크로스도메인 embed 없음.** | `docs/SSOT/DESIGN_PRINCIPLES.md`, rule `97-phase-r-surface-domain-guard.mdc` | `apps/web/src/product/shell/surface-domain-boundary.ts`가 6개 도메인 + 금지 크로스도메인 import/모바일레이아웃 정규식을 하드코딩; `scripts/check-phase-r-guards.ts`가 직접 소비. |
| **Admin = 1인 운영, ~99% 자동화, 예외큐 우선.** | `docs/SSOT/ADMIN_UX_CANON.md`, rule `50-admin-automation.mdc` | `apps/admin/src/domain/admin-rbac.ts`: 6개 역할, fail-closed 기본값 `viewer`, grant 0건인 최초 admin은 `owner`로 부트스트랩. |
| **초보자 우선 / 평이한 언어 계층화.** | `docs/SSOT/ADMIN_BEGINNER_LANGUAGE_CANON.md`, `docs/SSOT/TRADE_BEGINNER_LANGUAGE_CANON.md` | 밀집도 높은 거래소 데스크와 분리된 별도 설명 UI 계층(`TradeHowItWorksPanel`)으로 실제 존재 확인. |
| **i18n-first; 한국어가 기본이지만 카탈로그 밖 하드코딩 금지; ko/en 동시 지원; zh/ja는 향후 카탈로그 전용.** | `docs/SSOT/I18N_FIRST.md`, `docs/SSOT/GLOBAL_EXPANSION.md` | `scripts/check-i18n-coverage.ts`가 허용목록 밖 한글 리터럴(`[ㄱ-ㅎㅏ-ㅣ가-힣]`)을 정규식으로 스캔. |
| **"Digital Aurora" 브랜드 DNA** — 5개 명명된 비주얼 문법, elevation 래더, 3단계 모션 티어. | ADR-009, `docs/SSOT/PRODUCT_EXPERIENCE_CANON.md` | `apps/web/src/product/tokens/domain-card-personalities.css`가 정확히 6개 명명된 카드 personality를 구현; `brand-elevation.css`가 aurora/Quad-Stream 비주얼 시스템 구현. |
| **톤 매트릭스: 금융 surface = 이모지 0; 일반 = 가벼운 이모지; 카지노 = 최소 흥분.** | `docs/SSOT/PRODUCT_PRINCIPLES.md`, `docs/SSOT/COPYWRITING_CANON.md` | 이번 패스에서 surface별 전수 재검증은 하지 않음 — **미확인**(부분 샘플과는 일치). |
| **법적 신중함이 부수적이 아니라 1급 제약.** | `docs/LEGAL_BASIS.md`: PHON은 현재 가정 하에서 "가상자산"이 아니라는 법률 검토 의견이 기록되어 있으며, 5개의 명시적 재검토 트리거(외부 상장, P2P 전송, 직접 교환, 출금경로 변경, 신규 적립경로 구조)가 존재. | E8(금융 연동: PHON P2P 전송)은 코드 레벨에서는 완료 표기되어 있으나 ADR-018에 따라 "별도 법률 재검토"가 배포 전 명시적으로 gate되어 있음. |
| **퍼널 톤은 도메인마다 달라진다: Earn/Home = 저밀도 + 리워드 피드백; Trade = 고밀도 + 거래소 문법, Trade에만 격리.** | rule `90-ui-ux-presentation.mdc` §Funnel tone | UI 감사에서 직접 확인: Earn Home은 5단 progressive-disclosure 레이아웃, Trade 데스크는 밀집된 3-column 거래소풍 그리드 — 실제로 도메인별 정보밀도가 다르다(우연한 불일치가 아니라 설계). |

---

## 4. 제품/엔지니어링 규칙

저장소의 프로세스/엔지니어링 규칙은 `.cursor/rules/` 아래 **37개 `.mdc` 파일**로 형식화되어 있으며, 숫자 접두사로 계층화되어 있다(00 = 핵심/현재 SSOT 포인터, 10–30 = 품질/머니/DB 규칙, 40 = 테스트, 50 = admin, 60–61 = i18n/로케일 위생, 70 = 자율성 계약, 75–89 = 성능/위생/저사양/게이트 금지 규칙, 90–99 = UI/UX·CI·마감 규칙). 이는 단순 서술이 아니라, 가장 안전-critical한 규칙들은 실제 집행 계층이 뒷받침한다.

- **`.cursor/hooks.json`**이 7개 hook 이벤트(`sessionStart`, `stop`, `beforeShellExecution` ×4, `beforeMCPExecution`, `afterShellExecution`, `beforeReadFile`, `subagentStart`)를 선언하며, 각각 실제 TypeScript hook 스크립트로 위임한다.
- **6개 hook 스크립트** 전부 읽고 stub이 아님을 확인: `agent-heavy-gate-deny.ts`(에이전트가 자율적으로 `test:e2e*`/`test:sql`/`check:full`/`supabase db reset`을 실행하는 것을 차단), `e2e-raw-deny.ts`(raw Playwright/수동 dev server 기동 차단), `prod-apply-deny.ts`(raw `supabase db push`/MCP `apply_migration`/다른 프로젝트 호출 차단), `main-push-deny.ts`(`main`/`master`로의 `git push` 차단), `secrets-read-deny.ts`(`.env*`/`.pem`/`.key` 읽기 차단), `subagent-guard.ts`(다른 heavy 프로세스 실행 중 heavy subagent 기동 차단).
- **`.cursor/permissions.json`**(`approvalMode: "unrestricted"`)이 hook 로직을 미러링하는 자연어 정책 allow/block 목록으로 2차 집행 계층을 추가한다.
- **6개 skill**: `.cursor/skills/` 아래 `ci-push-fix-loop`, `gate-ladder`, `local-test-autopilot`, `session-cleanup`, `session-hygiene`, `supabase-apply`.
- **12개 이상의 게이트 스크립트**(`check-release.ts`, `check-ui-architecture.ts`, `check-workspace-hygiene.ts`, `check-ai-reference-legacy.ts`, `check-i18n-coverage.ts`, `check-phase-r-guards.ts`, `check-money-formula-citations.ts`, `check-rpc-type-hygiene.ts`, `check/guard-coverage.ts`, `run-ai-impl-gate.ts`, `closeout-plan-todo.ts`, `ci-watch.ts`, `push-pending-remote-migrations.ts`)를 각각 열어 이름/문서가 주장하는 대로 동작함을 확인.

**발견된 집행 격차 2건 (문서상 규칙 > 실제 게이트):**

1. `check:design-tokens`(raw hex/rgb/legacy-shadcn 클래스 탐지)는 GitHub CI 필수 job에도, 루트 `bun run check` 체인에도 **포함되지 않으며**, `gate:phase-r` 경유로만 도달 가능하다 — 그런데 rule은 에이전트에게 이를 자율 실행하지 말라고 지시한다. `check:ui-architecture`, `check:phase-r-guards --strict`, `check:primitive-ratchet --strict`(구조/중복/ratchet 게이트 3종)는 필수 마감 경로 `gate:ai-impl`에 실제로 연결되어 있음; 순수 raw-hex/legacy-class 게이트는 실무적으로 advisory에 불과하다.
2. `check-release.ts`의 TODO/FIXME/HACK/XXX 마커 정규식은 **대소문자 구분**(`\b(TODO|FIXME|HACK|XXX)\b`, `i` 플래그 없음)이다 — 소문자 `todo` 주석(이 코드베이스에 실제로 흔한 패턴, §17 참조)은 release readiness 게이트를 통과해버린다.

**추가로 발견된 작은 불일치:** `prod-apply-deny.ts`의 거부 메시지 텍스트는 "env bypass 없음"이라 말하지만, 코드 자체는 패턴 평가 전에 `PHONARA_ALLOW_PROD_DB_PUSH=1`을 확인해 "allowed"를 반환한다 — bypass는 실재하며(rule 자체도 legacy escape hatch임을 다른 곳에서 인정), 메시지 문구만 오해를 유발한다.

실제로 코드에 의해 강제되는 non-negotiable 제약사항 전체 목록은 §18에서 다룬다.

---

## 5. 문서 인벤토리

저장소는 `docs/` 아래 **550개 이상**의 마크다운/yaml 파일을 보유한 이례적으로 큰 문서 집합을 갖고 있으며, 5개 계층으로 조직되어 있다.

| 계층 | 위치 | 개수(검증됨) | 역할 |
| --- | --- | --- | --- |
| **정본(SSOT)** | `docs/SSOT/*.md` | 31개 | 도메인별 UX 법 + 크로스컷팅 canon(머니 공식, 엔진 경계, 디자인 원칙, i18n, CI 게이트 정본, deprecated-doc denylist). |
| **제품 계획 + ADR** | `docs/PRODUCT/*.md`, `docs/PRODUCT/ADR/*.md`, `docs/ADR/*.md` | 10 + 23 + 6 = 39개 | 재구축 계획, demolition 계획, 디자인 헌장, 랜딩 스펙, 총 29개 아키텍처 결정 기록. |
| **Operations** | `docs/OPERATIONS/**` | md 약 77개 + yaml 8개 + 증거 서브폴더 약 89개 ≈ **170개 이상** | 런북, release-freeze/SLO/RACI/KPI 거버넌스, 그리고 3개의 독립된 증거 트레일(Platform Audit R0–R12, Platform Integrity Remediation, Trade Desk Zero-Defect). |
| **Audit** | `docs/audit/**` | 약 33개 파일/폴더 | 4개의 구분된 감사 세대: 2026-07-08(A–E 심각도 파이프라인), 2026-07-11(visual/UX/responsive/design-system), 2026-07-13(7-Pillar 시스템 감사 + Zero-Assumption 전체 감사 + Master Inventory), 그리고 상시 매트릭스(RPC 사용, per-page UI 상태, repo tree, Knip dead-code). |
| **루트/operator** | `docs/*.md`, `setup/*.md`, `docs/rebuild/*.md` | 약 15 + 2 + 3개 | 런북, threat model, 법적 근거, quality gates, 환경 설정, 카지노 SLO, operator 수동 작업 체크리스트. |

**교차 문서 핵심 발견:**

- **깨진 참조가 최소 4개 문서에 걸쳐 전파되고 있다.** `docs/rebuild/LOWSPEC_RULES.md`가 `docs/SSOT/CI_GATE_AUTHORITY.md`, `docs/SSOT/OPERATOR_GATES.md`, `docs/OPERATIONS/PRE_LAUNCH_CHECKLIST_BEGINNER.md`, 그리고 **`docs/DOCS_INDEX.md` 자신(115번째 줄)**에서 이름으로 인용되지만, 실제로 `docs/rebuild/` 폴더에는 존재하지 않는다(해당 폴더에는 `E2E-LOWSPEC-RUNBOOK.md`, `PHASE-D-GATE-RUNBOOK.md`, `PHASE-R-GATE-RUNBOOK.md` 3개만 존재). `DOCS_INDEX.md` 120번째 줄은 "`rebuild/NEXT_STEP.md`·`RELEASE_ROADMAP.md`는 2026-07-04 삭제된 문서"라고 명시하지만 `LOWSPEC_RULES.md`는 "삭제됨" 목록에도 없다 — 애초에 만들어지지 않았거나 삭제 기록 없이 사라진, 순수한 참조 오류다.
- **`docs/SSOT/DEPRECATED_DOC_DENYLIST.md`**는 실제로 집행되는 blocklist다(`scripts/check-ai-reference-legacy.ts`가 두 `AGENTS.md` 파일을 포함한 12개 "gate root" 파일을 스캔) — 삭제된 v2 UI 재구축 실행 문서(`UI_REBUILD_WAVE.md`, `NEXT_STEP.md`, `MASTER_TODO.md`, `AI_REFERENCE_PRIORITY.md`, `UIUX_FULL_REBUILD_EXECUTION.md`)의 부활을 막는다.
- **명시적 조정 문서 없이 겹치는 2개의 launch-readiness 프로그램이 존재한다:** "Platform Perfect Launch"(2026-07-08~07-14, `PLATFORM_AUDIT_*`)와 "Trade Desk Zero-Defect QA"(`TRADE_DESK_*`)가 각각 실질적으로 동일한 Trade surface에 대해 독자적인 release-gate 성격의 sign-off 산출물을 만든다.
- **가장 최근 dead-code 리포트에서 구체적인 거짓 주장이 발견되었다:** `docs/audit/KNIP_DEADCODE_REPORT.md`는 `apps/admin/src/contracts/controller-view-freeze.ts`가 삭제되었다고 서술하지만, 직접 파일시스템 확인 결과 **파일이 여전히 존재한다**(참조 0건으로 실제 dead인 것은 맞으나, 삭제되었다는 서술 자체가 오류).
- **마이그레이션/테이블/SQL-테스트 카운트는 같은 24시간 감사 창 안에서도 계속 바뀐다** — `docs/ENGINE_APEX_CLOSEOUT.md`(마감 스냅샷 191개) → 211개(2026-07-09) → 239개(`MASTER_INVENTORY_AUDIT_2026-07-13.md`) → 244개(`02_DATABASE.md`, 같은 날) → **본 감사 직접 확인 248개**(2026-07-15). 저장소는 이 drift를 숨기지 않고 문서에 그대로 남겨두는 편이다.
- **오래된 감사 사이클도 삭제되지 않고 추적 가능하게 남아 있으며**, 2026-07-08 A–E 파이프라인의 가장 중대한 finding(`supabase_realtime` publication에서 테이블 10개 누락)은 2026-07-11의 "narrowing" 변경과 완전히 재구성되지 않는다 — 여러 trade/wallet 테이블의 현재 실제 publication 멤버십은 정적 문서만으로는 **미확인**이다.

---

## 6. 기술 스택

| 계층 | 기술 | 검증된 세부사항 |
| --- | --- | --- |
| **모노레포/패키지 매니저** | Bun workspaces | `apps/*`, `packages/*`; 패키지 9개, 앱 2개; TS project references(`tsc -b`); 루트 `package.json` 스크립트 **232개**(직접 grep 카운트로 검증 — 서브에이전트 최초 보고치 100은 오류). |
| **프론트엔드 프레임워크** | React 19.2.7 + Vite 8.0.16 + TypeScript 6.0.3 | 두 앱 모두 동일 버전. |
| **라우팅** | TanStack Router(파일 기반, `autoCodeSplitting: true`) | 92개 등록 라우트 ID(`apps/web/src/routeTree.gen.ts`, 자동생성). |
| **데이터/캐시** | TanStack Query 5.101.0 | 단일 `QueryClient` 싱글턴(`staleTime: 10s`, `gcTime: 5min`, `retry: 1`); 지배적 상태 계층, 약 150개 파일에서 사용. |
| **클라이언트 상태** | Zustand 5(web만, store 3개: notifications, realtime 상태, casino fiat-rate 세션) + 순수 React Context ×2(auth, PWA install prompt) | Redux·Jotai는 어디에도 없음. |
| **스타일링** | Tailwind CSS 4.3.1, CSS-first(`@theme inline`) | `tailwind.config.*` 파일이 저장소 전체에 **0개**. |
| **UI 프리미티브** | Radix UI(web만, 9개 패키지) + `class-variance-authority` | Admin은 Radix/cva 사용 **0건** — 앱별로 완전히 분리된 프리미티브 스택. |
| **카지노 렌더링** | Pixi.js 8 | 12개 게임 캔버스 전부가 하나의 공유 `use-pixi-stage.ts` 훅을 사용. |
| **트레이딩 차트** | lightweight-charts 5 | Trade 도메인 전용; 전용 wrapper 파일 9개. |
| **폼/토스트** | react-hook-form, sonner | — |
| **Admin 테이블** | `@tanstack/react-table`(admin만) | Web에는 테이블 의존성 자체가 없음. |
| **버전 drift 발견** | `zod` `^4.4.3`(web) vs `3.25.67`(admin) | 동일 라이브러리, 다른 major 버전이 모노레포 내 공존. |
| **백엔드** | Supabase self-hosted(Postgres 17 + PostgREST + GoTrue + Storage + Realtime + Edge Functions) | 단일 프로젝트 lock `yocjhjsdwoijfdrehzoq`. |
| **인증** | Supabase Auth: 이메일/비밀번호 + TOTP MFA + Passkey/WebAuthn(enabled) + 커스텀 SIWE edge function(함수 자신의 헤더 주석에 **"아직 live 아님"**이라고 명시) | `VITE_*` 환경변수에 서비스롤 키가 새는 것을 막는 하드 가드가 빌드체크 레벨과 런타임 JWT 디코드 레벨 이중으로 존재. |
| **스토리지** | 버킷 1개: `kyc-documents`(private, 5MB 제한, JPEG/PNG/WEBP) | — |
| **Edge functions** | Deno 함수 12개 | `price-feed`, `crypto-chain-watcher`, `derive-crypto-address`, `crypto-withdraw-broadcast`, `crypto-sign`, `usdt-krw-feed`, `notification-dispatch`, `ops-notify`, `pg-bank-webhook`, `siwe-auth`, `product-analytics`, `market-data-proxy`. |
| **데이터베이스** | 마이그레이션 248개, **테이블 138개**(`DROP TABLE` 이력 0건 — 스키마는 오직 성장만 함), 뷰 4개, **`rpc_*` 함수 약 256–257개**(탈중복), RLS 정책 약 285개(누적), `SECURITY DEFINER` 선언 약 758개(누적), **SQL 통합 테스트 142개**. | 이번 세션에서 직접 재검증(RPC 정규식 카운트: 257). |
| **백그라운드 작업** | `pg_cron` + `pg_net`: **21개 스케줄 작업**(대부분 매분: 강제청산, 가격 피드, 체인 워처, 알림; 매시간 funding; 매일 reconciliation/tier-decay/affiliate snapshot) + GitHub Actions cron(`sports-odds-ingest.yml`, 5분 간격, dry-run 기본값) | — |
| **CI/CD** | GitHub 워크플로우 3개: `ci.yml`(job 5개: `quality`/`sql`/`e2e`/`advisors` 필수, `e2e-browser-matrix` advisory), `sports-odds-ingest.yml`, `actions-hygiene.yml` | rule이 주장하는 CI job 매트릭스와 정확히 일치. |
| **배포** | Cloudflare Pages(`wrangler.toml` ×2) | `phonara-web`, `phonara-admin` 프로젝트. |
| **API 접근 패턴** | 단일 타입 `callRpc()` wrapper(`apps/web/src/lib/rpc.ts`), 타입은 생성된 `Database['public']['Functions']`에서 도출, 11개의 안정적 에러코드가 i18n에 매핑 | 약 50개 이상 파일에서 사용; **100% 전용은 아님** — 양쪽 앱에서 약 12개 파일이 direct `supabase.rpc()`/`supabase.from()` 조회를 사용. |

---

## 7. 아키텍처

**최상위 레이아웃:**

```text
apps/web/src/     contexts · contracts(empty) · data(5) · domain(410) · features(17 도메인, 약 290)
                  hooks(17) · lib(39) · product/{i18n,layout,primitives,routing,shell,surfaces,theme,tokens}
                  routes(92 라우트 ID) · routeTree.gen.ts(자동생성) · stores(2) · workers(4)
apps/admin/src/   contexts · contracts(2) · domain(38) · hooks(7+admin/44) · lib(10)
                  product/{bridge,i18n,layout,primitives[1개 파일],surfaces[63]} · routes(33)
packages/         9개 workspace 패키지(money, wallet-ledger, shared-types, i18n, game-engine,
                  trading-engine, sportsbook-engine, sports-ingest, market-display)
supabase/         migrations(248) · functions(12+_shared/24) · tests(142 .sql) · config.toml
scripts/          264개 TypeScript 파일 — 게이트, 위생, 배포, 스포츠 워커, 감사
```

**패키지 의존성 그래프:**

```text
@phonara/money            (base — decimal.js)
@phonara/shared-types     (base — 생성된 DB 타입)
@phonara/i18n              (base)
@phonara/market-display   → money
@phonara/game-engine       → money, zod
@phonara/wallet-ledger     → money, shared-types      [양쪽 앱 어디서도 import 0건]
@phonara/trading-engine    → money, shared-types
@phonara/sportsbook-engine → money, shared-types
@phonara/sports-ingest     → money, sportsbook-engine  [루트 scripts에서만 소비, 앱에서는 미사용]

apps/web    → game-engine, i18n, market-display, money, shared-types, sportsbook-engine, trading-engine
apps/admin  → i18n, money, shared-types
```

**공유 UI 패키지는 존재하지 않는다**(`packages/ui`는 존재하지 않고, `@phonara/ui` import도 어디에도 없다). `apps/web`과 `apps/admin`은 **완전히 분리된, 겹치지 않는** 프리미티브/의존성 세트를 갖는다(web: 약 35개 프리미티브 + Radix + cva + Zustand + Pixi + charts; admin: 프리미티브 1개[`admin-table.tsx`] + `@tanstack/react-table`, Radix 0건). 두 앱의 결합은 **오직** `@phonara/*` 엔진/타입/i18n 패키지 계층에서만 존재한다.

**도메인 격리는 문서만이 아니라 코드로 강제된다**: `apps/web/src/product/shell/surface-domain-boundary.ts`는 실제로 import되는 262줄 TS 모듈로, 6개 정식 `SurfaceDomainId`(earn/wallet/trade/sports/casino/account)를 라우트 프리픽스/폴더 allowlist와 함께 하드코딩하며, `FORBIDDEN_CROSS_DOMAIN_PATTERNS` 정규식 목록, `FORBIDDEN_SUBNAV_IMPORTS_IN_SURFACES` 정규식, `MOBILE_LAYOUT_FORBIDDEN_PATTERNS`를 포함한다 — `scripts/check-phase-r-guards.ts`가 직접 소비한다.

**라우팅 컨벤션:** "얇은 route, 두꺼운 surface" — 모든 route 파일은 세션 가드(`beforeLoad` → `getSession()` → 없으면 `/login` 리다이렉트)와 정확히 하나의 `product/surfaces/<domain>/<name>-page.tsx` 컴포넌트 렌더링으로만 구성된다. Route 파일에 비즈니스 로직이 없다.

---

## 8. 디자인 시스템

`apps/web/src/product/tokens/` 아래 실제로 규율 있는 토큰 우선 디자인 시스템이 존재한다 — **13개 파일**, Tailwind config 파일은 전혀 없음(순수 CSS-first Tailwind v4, `@theme inline` 경유).

| 시스템 | 검증된 세부사항 |
| --- | --- |
| **토큰** | `colors.css`, `spacing.css`, `elevation.css`, `layout.css`, `motion.css`, `fonts.css`, `theme.css`(Tailwind 브릿지), `domain-card-personalities.css`, `brand-elevation.css`, `signature-surfaces.css`, `viewport-contract.ts`/`motion.ts`/`index.ts`. **`--ds-*` 고유 커스텀 속성 약 112개.** |
| **색상** | CSS `light-dark()`를 통한 전면 OKLCH — SOT에는 hex/RGB가 없으며, 예외는 4개의 고정 브랜드축 hex 값뿐(명시적 예외, Quad Stream 로더 전용). |
| **타이포그래피** | 자체 호스팅 가변 폰트 3종 — Pretendard Variable(sans/한국어 인지), Space Grotesk Variable(display), JetBrains Mono Variable(money) — 전부 커밋된 `.woff2` 파일로 실존 확인. 9단계 fluid `clamp()` 스케일; 한국어는 더 느슨한 line-height(1.625 vs 1.5)와 더 가벼운 heading weight(600 vs 700). |
| **여백(spacing)** | 4px 배수 12단계 래더(4–64px). 실무에서는 허브 페이지가 토큰 스케일과 plain Tailwind 여백을 혼용하고, 밀집 surface(casino, trade)는 plain Tailwind만 사용. |
| **radius** | 4단계(8/12/16/9999px), 48px 터치 타겟 토큰과 같은 파일에 공존. |
| **shadow/elevation** | 5단계 래더, shadow 색상은 `--ds-bg`에서 `color-mix()`로 도출(테마를 자동 추종); flat 3단 z-index(chrome 40 < overlay 50 < toast 60). |
| **모션** | 시맨틱 duration role(press 120 / field+toggle 150 / surface 200 / overlay 320 / count-up 400 / page-enter 250ms), 전부 `prefers-reduced-motion` 하에서 0으로; deprecated alias 3개("P13 removal" 표기, 여전히 존재); overlay/dialog/sheet에 CSS-native `@keyframes`(framer-motion을 명시적으로 대체); casino 전용 추가 모션 토큰 3개, 코어 계층을 절대 완화하지 않도록 격리. |
| **반응형** | 의도적으로 병렬인 2개 breakpoint 시스템 — Tailwind-native(480/768/1024/1920/2560)와 semantic Phase-R tier(320/390/768/1024/1280/1920/2560, 살아있는 TS 모듈 `viewport-contract.ts`에 미러). |
| **테마** | 라이트 모드는 **실제로 구현되어 있다**(stub 아님) — `light-dark()` 전면 사용 + `data-theme` 속성 + inline `color-scheme` + anti-flash boot 스크립트 + localStorage 영속 + 기본값 dark + 3단계 사용자 제어. Tailwind의 `dark:` 클래스 variant는 실질적으로 **미사용**(실제 사용례 0건 — 전부 `light-dark()`로 라우팅). 라이트 모드는 `/login`에서만 시각적으로 스크린샷 확인되었다 — 코드는 완성이나 그 외 화면은 시각적으로 미검증. |
| **시맨틱 컬러** | surface/text/brand/status/market(success/danger와 분리)/bet-CTA/focus/tier-ramp(6단계) 그룹, 전부 Tailwind 유틸리티 이름으로 브릿지 — JSX에서 raw `var()`로 참조되는 곳은 없음. |
| **아이콘** | Lucide React 전용(137개 파일); 별도 아이콘 토큰 패키지 없음. |
| **컴포넌트 variant** | `class-variance-authority`, 정확히 4개의 중앙화된 프리미티브(Button, Card, Text, StatusBadge)에서만 사용 — 산발적이지 않음. `packages/`·`apps/admin`에서는 `cva` 사용 0건. |
| **토큰 내 접근성** | 포커스 링 토큰이 공유 Button의 기본 클래스에 기본 배선; 48px 터치 타겟; skip-link; 모션 파일 전반의 체계적 reduced-motion 처리; 로케일 인지 line-height; 실제 `light-dark()` 토큰 쌍을 파싱하는 전용 대비(contrast) 검사 모듈.

**존재하지 않음이 확인됨**(rule 주장과 일치, `scripts/check-ui-architecture.ts`의 하드코딩된 forbidden-path 목록으로 실제 강제됨): `apps/web/src/components/ui`, 루트 레벨 `apps/web/src/theme.css`, `apps/web/src/ui/design`, `packages/ui`, `@phonara/ui` import, `apps/web/src/components/shell`, `apps/web/src/presentation-import`.

**규칙 문서와 코드가 상충하는 지점 1건 발견:** rule 파일들은 `viewport-contract.ts`를 역사적/삭제됨으로 서술하지만, 실제로는 **살아있고, 실제로 import되며, 단위테스트가 존재하는 72줄 모듈**이다 — rule 텍스트가 낡았고 코드는 최신이다.

**일관성 판정:** 이번 패스에서 샘플링한 실제 코드(프리미티브, 카지노, 허브 surface)는 깨끗하다(raw hex/rgb 0건 발견). 그러나 **회귀 방지 수준은 균일하지 않다** — 구조/중복 게이트(`check:ui-architecture`, `check:phase-r-guards --strict`, `check:primitive-ratchet --strict`)는 필수 마감 경로에 연결되어 있으나, raw-hex/legacy-class 게이트(`check:design-tokens`)는 그렇지 않다.

---

## 9. 컴포넌트 시스템

| 계층 | 개수(검증됨) | 성격 |
| --- | --- | --- |
| `apps/web/src/product/surfaces/` | 27개 도메인 폴더, **약 191개 non-test 파일**(약 79개가 `docs/audit/PER_PAGE_UI_MATRIX.md`의 좁은 정의 기준 라우트-마운트 "page"; 나머지는 같은 폴더 안의 panel/form/banner) | 도메인 우선 조직: account, auth, casino, earn, events, games, home, install, landing, legal, login, marketing, notifications, onboarding, referral, reset-password, rewards, settings, share, signup, sports, staking, tier, trade, verify-email, wallet. |
| `apps/web/src/product/primitives/` | **약 33–35개 컴포넌트** | shadcn/ui 스타일 세트(Button, Card, Dialog, Sheet, Input, Select, Slider, Switch, Tabs, Tooltip, Popover, DropdownMenu, Skeleton, ToastZone, EmptyState, ZeroBalanceState, ErrorPanel, ConfirmDialog, ProgressRing, MissionCard, RoutineCard, Text, HelpTip, CollapsibleSection, SpendCurrencySelector, MoneyDisplay(+fiat-hint), StatusBadge, IconButton, BrandMark, DomainEmptyMark, QuadStreamLoading, HowItWorks, TradeConfirmSettingsLink). **범용 Table 프리미티브 없음** — web에는 `@tanstack/react-table` 의존성 자체가 없음. |
| `apps/web/src/domain/` | **410개 파일**(약 204개 root, 그중 약 192개가 `*-display-contract.ts` 패턴; 206개가 `__tests__/`) | "display contract"란 typed 라우트/상태 상수 + i18n-key 전용 빌더 함수 + self-check assertion 함수의 조합이며, 데이터 페칭/RPC 계층이 아님 — 금액 관련 카피/구조를 선언적이고 test-locked 상태로 유지하며, 실데이터를 다루는 `features/*` 컨트롤러와 분리된다. |
| `apps/web/src/product/surfaces/games/` | **12/12 정식 게임 전부 구현**(`crash`, `limbo`, `dice`, `mines`, `hilo`, `plinko`, `mint-reels`, `gold-rush`, `roulette`, `blackjack`, `deepshaft`, `momentum` — 각각 실제 `*-stage.tsx`) | 4일 전 "placeholder"라는 finding을 직접 반박한다 — 해당 판정은 이제 **낡음/폐기**됐고, 여러 stage 파일이 오늘(2026-07-15) 날짜 주석을 갖고 있다. |
| `apps/admin/src/product/surfaces/` | 63개 파일(root 34 + test 29) | desk `*-page.tsx` 29개(audit, casino, cms, deposits, earn+변형3, home, login, mfa×2, ops, promotions, queues, risk, settings, sports, staking, support, team, tier-benefits, tiers, user-tier, users, viral-stats, withdrawals). |
| `apps/admin/src/product/primitives/` | **파일 1개**: `admin-table.tsx` | 유일하게 승인된 테이블 구현 — 자체 주석이 native `<table>`이나 로컬 `LoadingTable`을 금지; admin surface에서 native-`<table>` 우회 0건 발견. |
| `apps/admin/src/hooks/admin/` | 44개 파일 | "desk" 10개가 실제 hook + Mock hook 짝을 가짐(casino, wallet, earn, tiers, users, missions, viralStats, staking, referrals, cms); 나머지(audit, support, team, tierBenefits, userTier, mfaPolicy, opsPush, operatorRbac, exceptionQueueSummary, reviewQueue, sports, compliance)는 mock 없음. |

**내비게이션/셸(§12에서 상세):** `AppShell`은 `TopBar` + 선택적 데스크톱 사이드레일(Earn/Trade만) + `DomainSubnav`(모바일 전용, trade/sports/casino/wallet) + content + `BottomNav`(모바일 전용, 5탭)로 구성. `NovaMobileAppBar`는 코드에 **존재하지 않는다**(rule 파일 안의 역사적 언급뿐). Admin은 완전히 별도의 셸(`admin-shell.tsx` + RBAC-필터링 사이드바 `admin-nav.tsx`)을 가짐 — web의 `AppShell`과 구조적으로 무관.

**재사용/결합/중복:**

- **두 앱 사이에 공유 UI 패키지가 전혀 없다** — 프리미티브, 다이얼로그, 시트, 카드가 앱마다 완전히 중복되거나 부재하며 공유되지 않는다. 결합은 `@phonara/*` 엔진/타입/i18n 계층으로만 한정.
- **역사적으로 확인된 중복 1건, 이미 수정됨**: admin은 이전에 여러 데스크에 걸쳐 로컬 table/`LoadingTable` 구현을 중복 보유했으나, 단일 `AdminTable` 프리미티브로 통합됨(2026-07-11, 자체 domain contract `admin-table-dedup-display-contract.ts`로 추적).
- **버전 drift 1건**: `zod` `4.4.3`(web) vs `3.25.67`(admin) — 동일 라이브러리, 다른 major 버전.
- **미해결된 스캐폴드 의문 1건**: `@phonara/wallet-ledger`는 빌드·유닛테스트되는 패키지이나 **어느 앱의 `src/`에서도 import되지 않는다**. 배선 대기 중인 것인지 죽은 코드인지 **미확인**.
- **naive한 `*-v2`/`*-old`/`*-backup`/`.bak` 중복 파일, native `<table>` 우회 — 저장소 전체 네이밍 컨벤션 스캔으로 0건 발견.**

---

## 10. UX 실태 (현재 사용자 흐름)

실제 route/surface/controller 코드에서 직접 추적한 결과이며(문서의 의도가 아니라), 평가 없이 사실만 기술한다.

- **온보딩:** onboarding 미완료 플래그를 가진 인증된 사용자는 `/onboarding`으로 이동 — 도메인 튜토리얼이 아니라 일반적인 3단계 "플랫폼 pillar" 인트로 스테퍼, 이어서 `/onboarding/missions`(D0 미션: 웰컴보너스 클레임, 프로필완성, 공유링크). 완료 여부는 `localStorage`(`phonara.onboarding.completed.v1`)에만 기록되고 **DB 플래그가 아니다**. 모든 단계에서 "Skip"이 가능하며 즉시 `/home`으로 단축.
- **Earn:** `/home`(URL과 무관하게 BottomNav의 "Earn" 탭)은 5단 progressive-disclosure 페이지 — greeting + day-flow nav strip + tier 카드(fold 1, 항상 열림) → claimable rewards 합계(fold 2, 기본 열림) → activity ticker/season countdown/trust 카드(fold 3, 기본 접힘) → mission 프리뷰(fold 4) → missions/events/wallet/sports/trade로의 navigate-only 카드 정확히 5개(fold 5, **Casino 카드 없음**). 하위 저니: missions 허브(`/home/missions`, 탭형 + claim 플로우), 리퍼럴(`/referral`, 코드/링크 복사 + tree 목록), 그리고 실제 카지노가 아님을 명시적으로 disclaim하는 독립 Earn-only 무료 룰렛 미니게임(`/earn/play`).
- **Wallet:** `/wallet`은 히어로 잔액(PHON, count-up) + 기본 닫힘 상태의 disclosure(3개 통화 전체 available/locked 분해, locked 행은 양수일 때만 렌더링) + Deposit/Withdraw/Ledger CTA(kill-switch/KYC 차단 시 tooltip 이유와 함께 비활성화) + KYC/출금준비 compliance strip + 최근 원장 5건을 보여준다. `/ledger`는 type/currency/period 필터, 두 가지 구분된 empty state, 데스크톱-테이블/모바일-리스트 이중 레이아웃을 추가한다.
- **Trading:** `/trade`(Spot)와 `/trade/futures`는 하나의 3단계 반응형 데스크 패턴을 공유(데스크톱 3-column 그리드 / 태블릿 primary+secondary / 모바일 탭형 + sticky CTA), 여기에 초보자 설명 패널, 시장상태 배너(가격 stale/frozen, realtime 연결끊김 상태), 재시도 가능한 에러 배너가 더해진다. `/staking`은 별도의 3단계 위저드(풀 선택 → 금액 → 확인) + 활성 포지션 목록(행별 claim/unstake)이다.
- **Sports:** 단 하나의 surface 파일(`sports-page.tsx`)이 `mode` prop을 통해 7개 스포츠 라우트 전체를 구동 — 리그 필터 레일 + fixture 보드 + 항상 마운트된 bet-slip 레일(데스크톱), `/sports/live`에는 라이브 인플레이 배너, `/sports/vip`는 자격 게이트로 bet slip 전체를 숨길 수 있다.
- **Casino:** 로비(`/casino`)는 카테고리 필터 가능한 게임 그리드 + PF-strip CTA(gate 오프 시 비활성화된 placeholder)를 보여주고 → 게임 진입(`/games/$gameCode`)은 12개 게임 전체에 대해 하나의 공유 `CasinoGameShell` 셸을 렌더링하며, 엔드투엔드로 병렬적인 2개 베팅 모드를 가진다 — **oneshot**(commit-hash → 단일 RPC 베팅 → 리플레이 애니메이션)과 **live/progressive**(세션 시작 → 단계별 reveal/guess → cash-out, Crash의 공유 라운드와 Mines/HiLo/Blackjack에 사용), launch flag와 게임별 allowlist로 게이트됨.
- **Deposit:** 탭형 허브(Methods/History) → KRW(rate 카드, 금액, 확인 다이얼로그, 참조코드 + 선택적 입금증 업로드 + 상태 타임라인) 또는 Crypto(네트워크 선택, plain-text 복사 가능 주소 — **플로우 어디에도 QR 코드가 없음**, 0-매치 grep으로 확인). **크립토 레일은 현재 내비게이션으로 도달 불가능하다** — `LAUNCH_GATES.cryptoRails = false`가 완전히 구현된 페이지가 렌더링되기 전에 `/wallet/deposit/crypto`를 허브로 리다이렉트한다.
- **VIP/Tier:** `/tier`는 비인증 공개 마케팅 페이지; `/tier/me`는 인증된 개인 대시보드(progress ring, 자격 있을 때만 나타나는 decay-warning 카드, "오늘의 한도" 카드, benefits 테이블); `/sports/vip`는 공유 스포츠 surface를 재사용하되 자격 게이트된 bet slip을 가진다.
- **Settings/Profile:** `/settings`는 알림 설정 토글 5개, 그룹화된 nav 링크, casino/trade 행동 토글을 가진 허브; `/account`는 알림 토글 **2개**만(명시적으로 서브셋이라고 주석 처리됨) 가진 별도 허브 + profile/KYC/responsible-gaming 링크 + danger-zone(로그아웃/계정삭제).
- **Auth:** `/login`은 이미 인증된 방문자를 폼을 보여주지 않고 자동으로 리다이렉트; `/signup`은 비밀번호 강도 미터와 동의 패널을 포함; `emailNotConfirmed`로 실패한 로그인은 `/verify-email`로 딥링크; `/auth/callback`은 모든 진입 경로(비밀번호, magic link, passkey, OAuth 스타일 코드 교환, 비밀번호 재설정 딥링크)에 대해 post-auth 목적지를 결정하는 단일 퍼널 관문이다.

**코드에서 발견된, 문서화된 `*_UX_CANON.md`와의 divergence(사실만, 평가 없음):** `/casino/tournaments`는 canon에 문서화되어 있으나 등록된 라우트가 없음(코드 주석이 의도적 제거를 확인); `/trade/spot/$pair` per-pair 동적 라우팅은 canon에 문서화되어 있으나 실제 Spot 데스크는 페이지 내 마켓 드롭다운을 가진 단일 `/trade` index임; onboarding canon은 D0–D7 일단위 여정을 문서화하지만 코드는 일반 인트로 스테퍼 + D0 미션 페이지 1개만 구현하며 앱 내 일단위 시퀀싱이 없음; `/verify-email`은 auth canon 자체의 라우트 목록에는 없는, 실제로 별도 라우팅된 5번째 auth surface임.

---

## 11. UI 실태 (현재 시각 언어)

- **디자인 언어:** CSS 변수 우선, 대부분 `--ds-*` 토큰을 직접 소비하는 raw Tailwind 유틸리티 문자열로 작성(Tailwind v4의 arbitrary-property 문법, 예: `rounded-(--ds-radius-lg)` 포함) — 미리 스타일링된 컴포넌트 라이브러리 추상화가 아니다.
- **4일 전 finding이 이제 낡음/수정됨:** 2026-07-11 visual 감사의 최우선 finding — "Casino 12게임 stage가 placeholder, 최대 시각 부채" — 는 더 이상 성립하지 않는다. 12게임 전부 실제 인터랙티브 구현을 갖고 있으며, 여러 개는 이 보고서와 같은 날 수정되었다.
- **4일 전 finding이 같은 날 독립적으로 재확인됨:** 랜딩 페이지 첫 fold 밀도 문제("hero budget 과밀")는 2026-07-15에 팀 자체 실측 캡처로 재캡처·재확인되었다.
- **지금 이 순간 미해결된 live-vs-code 불일치가 존재한다:** 코드 정책은 `BottomNav`를 ≥1024px에서 숨긴다(`lg:hidden`, 그리고 이 Tailwind 클래스를 실제 specificity 위험으로부터 보호하기 위한 의도적 CSS cascade-layer-safe 스코핑 포함) — 그런데 같은 날짜의 작업 로그 항목은 `/home`/`/wallet`의 실제 캡처에서 데스크톱 폭에서도 5탭 바가 여전히 노출된다고 기록하며, **"launch blocker candidate"로 미해결 상태로 표기**되어 있다. 본 감사는 브라우저를 실행하지 않았으므로 현재 어느 쪽이 맞는지 확정할 수 없다.
- **실제 프로덕션 버그가 이 저장소의 최근 자체 감사 활동 중 발견되어 같은 날 수정되었다:** 유효하지 않은 Tailwind arbitrary grid-template-columns 값(`grid-cols-[minmax(280px,360px),1fr]` — 필수 언더스코어 구분자 대신 쉼표)이 선언 전체를 조용히 무효화하여, 공유 auth 페이지 레이아웃을 소스 순서와 무관하게 한 컬럼으로 쌓아버렸다. 같은 날 새 회귀 테스트와 함께 수정됨.
- **실무에서의 타이포그래피/여백:** 토큰 해석은 내부적으로 일관되지만 *작성 스타일*은 그렇지 않다 — 허브 페이지는 `--ds-*` 여백 스케일과 plain Tailwind 여백을 혼용; 밀집 인터랙티브 surface(카지노, 트레이드)는 plain Tailwind만 사용한다. `tabular-nums`는 금액/수량이 나타나는 모든 곳에서 일관되게 적용된다.
- **스크린샷 증거는 2026-07-11 감사 이후 실제 긍정적 drift를 보여준다**: `screenshots/tablet/`(768px) 폴더가 이제 존재하며 채워져 있다 — 07-11 감사는 태블릿이 "아직 캡처되지 않음"이라고 명시적으로 표시했었다.

---

## 12. 내비게이션

- **모바일:** 고정 5탭 `BottomNav`(Earn→`/home`, Wallet→`/wallet`, Trade→`/trade`, Sports→`/sports`, Casino→`/casino`), 정책상 ≥1024px에서 숨김(실시간 렌더 상태는 §11에서 다투는 중).
- **크롬:** `TopBar`에 브랜드 마크, 알림 벨(현재 비활성 버튼 — `LAUNCH_GATES.notificationsCenter = false`로 게이트 오프), `/account`로 연결되는 아바타(비인증 시 로그인 링크)가 있다.
- **도메인 서브내비:** wallet/trade/sports/casino는 각각 자체 가로 chip row를 가짐(모바일/태블릿 전용, `lg:hidden`); Earn은 대신 자체 전용 사이드내비(데스크톱)/모바일-서브내비 쌍을 가지며, 공유 `DomainSubnav`를 사용하지 않는다.
- **서브내비 소유권은 관례가 아니라 코드로 강제된다** — `product/surfaces/**` 파일이 서브내비 registry를 직접 import하는 것을 막는 정규식 가드가 있으며, `AppShell`/`domain-subnav.tsx`만 해당 크롬을 마운트할 수 있다.
- **Admin 내비게이션은 완전히 별도 시스템이다**: RBAC-필터링된 사이드바(`admin-nav.tsx` + `admin-nav-filter.ts`), bottom-tab 패턴이 아니며, web 앱의 셸과 구조적으로 무관하다.

---

## 13. 정보 구조 (IA)

- **라우트 근거:** 92개 등록 라우트 ID(`apps/web/src/routeTree.gen.ts`), 6개 정식 도메인(earn, wallet, trade, sports, casino, account) + auth/landing/legal/neutral로 그룹화 — `surface-domain-boundary.ts`에서 라우트 프리픽스와 폴더 allowlist로 전부 formal하게 정의됨.
- **feature 계층:** route 파일(얇음, 세션 가드만) → surface 컴포넌트(`product/surfaces/<domain>/<name>-page.tsx`) → feature 컨트롤러(`features/<domain>/use-<name>-controller.ts`, RPC/query 오케스트레이션) → domain display-contract(`domain/<name>-display-contract.ts`, typed 상수 + i18n-key 빌더).
- **상태 계층:** TanStack Query 캐시가 지배적인 "서버 상태" 계층; Zustand는 3개의 좁은 클라이언트-영속 관심사를 담당; 순수 Context는 정확히 2개의 크로스컷팅 관심사(auth 세션, PWA install prompt)만 담당.
- **지갑 계층:** 사용자당 지갑 행 1개 → 3개 통화 × (available, locked) = 6개 잔액 컬럼 → append-only `wallet_ledger`(mutation마다 1행, 완전한 before/after 잔액 스냅샷 포함)가 DB로 강제되는 진실의 원천이다.
- **권한/아이덴티티 계층:** 두 개의 독립된 역할 시스템 — 거친 `user_role` enum(`user`/`admin`, `profiles.role`에) 과 세밀한 `admin_role` enum(`owner`/`finance`/`risk`/`support`/`operator`/`viewer`, 별도 `admin_role_grants` 테이블에), 12개의 명시적 권한 액션에 매핑, `viewer`로 fail-closed, grant가 0건인 최초 admin은 `owner`로 부트스트랩되는 규칙.
- **크로스도메인 내비게이션은 명시적으로 navigate-only다** — embed가 없다. 정규식 가드(`FORBIDDEN_CROSS_DOMAIN_PATTERNS`)가 pre-Demolition 아키텍처의 legacy "Bet hub" 크로스 embed 패턴을 구체적으로 잡아낸다.

---

## 14. 반응형 전략

- **의도적으로 병렬인 2개의 breakpoint 시스템** — 코드 내 주석으로 "의도된 것, 정리 대상 중복이 아님"이라고 명시: Tailwind-native 스케일(`sm/md/lg/xl/2xl` = 480/768/1024/1920/2560)과 semantic "Phase-R tier" 스케일(`mobile-narrow/mobile/tablet/desktop/wide/ultra/superwide` = 320/390/768/1024/1280/1920/2560), 후자는 CSS 외 소비자를 위해 살아있는 TypeScript 모듈(`viewport-contract.ts`)에 미러링된다.
- **정식 스모크 테스트 폭은 정확히 390/768/1024/2560이다**, 한 곳에서 정의되고 CSS breakpoint 변수, vitest 시각 서명(`*_VISUAL_VIEWPORT_WIDTHS` 배열), CDP 스크린샷 캡처 툴링에 일관되게 소비된다 — 진짜로 단일 진실의 원천이며 단순 관례가 아니다.
- **실제 사용은 `md:`/`lg:`에 집중**(각각 코드베이스 전체 206회, 62회); `xl:`/`2xl:`는 토큰 *정의*로만 존재하며 실제 컴포넌트 레벨 반응형 variant로는 전혀 사용되지 않는다 — ultra/superwide 레이아웃(1920/2560px)은 discrete 유틸리티 breakpoint 대신 CSS container query(`@container trade-desk`)와 fluid `clamp()`로 처리된다.
- **Trade Desk가 앱에서 가장 커스텀한 반응형 로직을 소유한다** — 전용 태블릿/모바일 레이아웃 컴포넌트와 자체 리터럴-픽셀 breakpoint 파일을 가지며, 실제 3단계 레이아웃(데스크톱 3-column 그리드 / 태블릿 primary+secondary / 모바일 탭형 + sticky CTA)을 구현한다.
- **anti-pattern은 코드로 강제된다**: 정규식(`MOBILE_LAYOUT_FORBIDDEN_PATTERNS`)이 고정 `max-w-[390px]`/`w-[390px]`/`min-w-[500px+]` 페이지 root의 재도입을 막는다.

## 15. 모션 전략

- **JS 애니메이션 런타임이 아니라 토큰 기반 CSS 시스템이다.** `apps/web/src/product/tokens/motion.css`(294줄)가 시맨틱 duration role(press 120 / field+toggle 150 / surface 200 / overlay 320 / count-up 400 / page-enter 250ms)과 overlay/dialog/sheet 트랜지션을 위한 손수 작성된 `@keyframes`를 정의한다.
- **framer-motion은 실제 배포 번들에서 완전히 제거된 것으로 확인되었다** — `apps/web/src`에 실제 import가 0건; 유일한 흔적은 한 presets 파일의 type-only import이며, `motion` npm 패키지는 `devDependency`로 프로덕션 의존성이 아니다. 이는 의도적인 성능 수정이었다(`R9-PERF-JS` finding 체인의 일부): 제거 자체만으로 gzip 약 38kB를 줄였고, 이후 i18n lazy-loading 패스가 최초 로드 JS를 539kB에서 394kB로 낮춰 450kB SLO를 충족시켰다.
- **deprecated duration alias 3개**(`--ds-motion-fast/base/slow`)는 여전히 존재하지만 코드 주석에 "P13 removal"로 명시 표기되어 있다 — 조용한 drift가 아니라 살아있고 자체 문서화된 진행 중 deprecation이다.
- **casino 전용 추가 모션 티어**(reveal 360ms / tile-flip 160ms / card-flip 280ms)는 코어 금융-surface 토큰과 명시적으로 격리되어 있으며 이를 절대 완화하지 않는다; card-flip duration은 애니메이션/로직 desync를 피하기 위해 의도적으로 JS 타이머와 수치적으로 동기화되어 있다 — 팀의 코드 주석이 이름으로 경고하는 버그 클래스다.
- **`prefers-reduced-motion`은 3개의 독립된 계층에서 중복으로 존중된다**: CSS-변수 zeroing(모든 duration 토큰에 매칭되는 reduced-motion override 존재), 렌더 전에 클래스 적용을 게이트하는 공유 React 훅(12개 카지노 stage 전체 포함 15개 이상 컴포넌트에서 사용), hover-only transform 효과를 위한 CSS-selector 레벨 override. 철저하지만 단일 원천은 아니다.

## 16. 접근성

- **구체적이고 코드 레벨의 a11y가 존재한다, 단순 문서화된 의도가 아니다:** 공유 `Button`의 기본 클래스에 기본 배선된 포커스 링 토큰; 48px 터치 타겟 토큰(공유 클래스 하나가 아니라 요소별 리터럴 유틸리티 클래스로 적용); skip-link; 체계적인 reduced-motion 처리; 한국어를 위한 로케일 인지 line-height/word-break; 실제 `light-dark()` OKLCH 토큰 쌍을 파싱하는 전용 대비 검사 모듈(눈으로 보는 대비 확인이 아님).
- **`aria-*`/`role=`/`aria-live` 속성이 150개 이상 파일에 걸쳐 나타난다.** Radix UI가 대부분의 인터랙티브 프리미티브(Dialog, DropdownMenu, Popover, Tooltip, Tabs, Slider, Switch, Select)의 기반이며, 이는 포커스 트랩과 ARIA 배선을 "공짜로" 제공한다.
- **서로 겹치지 않는 진짜로 다른 2개의 axe-core 메커니즘이 존재한다:**
  1. Vitest/jsdom 컴포넌트 테스트(다수의 `*-visual-signoff.test.tsx` 파일)가 jsdom-렌더링된 subtree에 대해 raw `axe-core` 패키지를 실행하고 **critical-impact 위반만** 단언한다(`toHaveLength(0)`) — serious/moderate/minor 위반은 이 테스트들로 게이트되지 않는다.
  2. 독립적인 CDP 스크린샷 캡처 스크립트가 실제 `axe-core`를 라이브 headless-Chrome 페이지에 주입하고 critical/serious/moderate/minor 카운트를 기록하지만, 라우트당 정확히 하나의 뷰포트/테마 조합(1024px, dark)에서만 실행된다.
- **`@axe-core/playwright`는 선언되어 있지만 코드베이스 어디에서도 사용되지 않는 의존성이다.** Playwright E2E spec(5개의 고유 spec 발견)은 오늘 기준 접근성 단언이 **0건**이다.
- **전체 실제-브라우저, 다중 뷰포트, 다중 테마 접근성 매트릭스는 한 번도 실행된 적이 없다** — 이는 본 감사가 독립적으로 발견한 것이 아니라, 원본 감사 자체가 (저장소 자체의 저사양/CI-authoritative 게이트 정책으로 막혀) 이미 스스로 미확인/공백으로 명시해 놓은 항목이다.

---

## 17. 기술적 건강도

- **전형적 기술부채 마커는 애플리케이션 코드에서 실질적으로 사라져 있다:** `apps/`·`packages/` 어디에도 정확한 `\bTODO\b` 0건, `\bFIXME\b` 0건, `HACK`/`XXX` 0건(release 게이트 자체의 정규식-정의 라인 제외 — 이는 합법적으로 해당 리터럴 문자열을 포함). 양쪽 앱의 non-test 소스에서 `console.log`/`warn`/`error` 0건. 저장소 전체에서 `describe.only`/`it.only`/`test.only` 0건.
- **그러나 release 게이트가 볼 수 없는 대규모의 의도적 병렬 백로그 추적 컨벤션이 존재한다**: 약 90–100개 파일이 `*_TODO` 접미사가 붙은 상수 네이밍 패턴(예: `SETTINGS_API_KEYS_ENGINE_TODO`)을 사용하며 주로 `domain/*-display-contract.ts` 계층에 집중되어 있고, 관련된 소문자 `todo` prose 주석 컨벤션도 있다. `check-release.ts`의 마커 정규식이 대소문자를 구분하고 단어경계로 고정되어 있기 때문에, **두 패턴 모두 release-readiness 게이트를 통과해버린다** — 규칙이 잡겠다고 주장하는 것과 코드가 실제로 잡는 것 사이의 실질적이지만 좁은 격차다.
- **`release-allow:` 우회 마커는 드물고 정당하게 사용된다** — 저장소 전체에서 실제 사용례는 정확히 2건(랜딩 분석의 DEV-게이트된 `console.debug` 1건, 이미 적용된 SQL 마이그레이션의 역사적 대체-스캐폴드 주석 1건), 둘 다 명확한 근거를 가진다.
- **가장 최근 dead-code 리포트에서 구체적인 거짓 주장이 발견되었다**: `docs/audit/KNIP_DEADCODE_REPORT.md`는 `apps/admin/src/contracts/controller-view-freeze.ts`가 삭제되었다고 주장하지만 파일시스템에 여전히 존재한다(참조 0건으로 실제 dead인 것은 확인되나, 삭제되었다는 서술 자체가 오류).
- **현재 Knip 신호**(주장된 정리 이후): unused files 0, unused dependencies 0, unresolved imports 0; unused devDependencies 12개(리포트 자체 서술로는 Knip의 의존성 그래프 밖에서 사용되는 false positive라고 주장 — 이번 패스에서 패키지별로 개별 재검증하지 않음); unlisted binaries 19개(예상됨 — `gh`/`psql`/`wsl` 같은 OS 레벨 도구); unused exports 17개 + unused exported types 10개 + duplicate exports 7개(대부분 위 `*_TODO` 접미사 컨벤션의 추가 사례).
- **`any` 타입 사용은 적고 집중되어 있다**: raw `any` 패턴 매치의 대부분은 자동생성된 두 `routeTree.gen.ts` 파일에 있다(수기 작성 부채가 아님); 진짜 수기 작성 핫스팟은 admin의 casino/CMS/operations "desk" 훅(real·Mock 변형 모두)과 web의 casino/trading/env 파일에 흩어진 소수의 단일 사례다.
- **네이밍 컨벤션 기반 전수 스캔으로 중복/병렬 파일 발견 0건**(`*-v2`, `*-old`, `*-backup`, `.bak`, `*-legacy` 등) — 정당하게 이름에 "legacy"가 들어간, 실제로 배선된 게이트 스크립트 1건만 제외.
- **집행 메커니즘은 실체가 있다, 단순 열망이 아니다** — 확인한 모든 hook, permission-정책 항목, skill, 게이트 스크립트가 문서화된 대로 실제로 동작한다(docstring을 믿는 것이 아니라 하위 코드를 직접 읽어 검증). 발견된 주요 격차(대소문자 구분 TODO 정규식, CI에 연결되지 않은 `check:design-tokens`, 오해를 유발하는 bypass 메시지 문구 1건)는 좁고 구체적이며 시스템적이지 않다.

---

## 18. 기존 제약사항 (Non-negotiable)

실제로 코드 또는 CI에 의해 **강제되는**(단순히 문서화된 것이 아니라) 제약사항.

| 제약 | 강제 메커니즘 |
| --- | --- |
| 단일 Supabase 프로젝트(`yocjhjsdwoijfdrehzoq`) — 다른 프로젝트는 절대 접근 금지 | `prod-apply-deny.ts` hook이 `project_id`가 불일치하는 모든 MCP 호출을 차단; `scripts/push-pending-remote-migrations.ts`가 ref를 하드코딩. |
| 엔진 freeze — 신규 마이그레이션/RPC 기능 금지, 회귀 수정만 | `scripts/check-ai-reference-legacy.ts`가 삭제된 실행 문서 참조를 차단; 신규 마이그레이션 *파일* 자체를 막는 하드 코드 게이트는 발견되지 않음 — PR 리뷰 레벨의 사람/에이전트 규율에 의존(하드 블록 아님). |
| 금액은 Decimal-only; 원장은 append-only; Σ=0 보존(PHON/USDT 범위) | `wallet_ledger`의 UPDATE/DELETE에 대한 DB 레벨 `CREATE RULE ... DO INSTEAD NOTHING`; `game-engine`의 `quantize6()` 런타임 타입 가드; SQL 보존 테스트 142개. |
| 신규 테이블/함수마다 RLS + `SECURITY DEFINER` 이중 방어 | `supabase/tests/grants_rls_inventory_test.sql`, `security_definer_inventory_test.sql`; rule `25-postgres-plpgsql.mdc`. |
| `main`에 직접 작업/push 금지 | `main-push-deny.ts` hook, 실제 정규식 기반 차단(단순 rule 서술이 아님). |
| Heavy 게이트(SQL 통합, 전체 E2E, `check:full`)는 GitHub-CI-authoritative, 에이전트 자율 실행 금지 | `agent-heavy-gate-deny.ts` hook, `test:e2e*`/`test:sql`/`check:full`/`supabase db reset`에 대한 실제 차단. |
| operator 명시적 문구 없이 Lovable ZIP 발행 금지 | rule 텍스트만(`92-lovable-lock-execute.mdc`) — **참고:** 본 감사가 확인한 `.cursor/rules/` 37개 목록에 이 파일이 실제로 존재하지 않는다(`80-absolute-gate-prohibitions.mdc` G8에서 이름으로 인용되지만 참조-대상-없음 — `docs/rebuild/LOWSPEC_RULES.md`와 동일한 종류의 깨진 참조). 이 세션에서 hook 레벨 대조는 하지 않음. |
| i18n 카탈로그 밖 한글 하드코딩 금지 | `scripts/check-i18n-coverage.ts`, allowlist 밖 리터럴 한글을 정규식으로 스캔. |
| 배포되는 코드에 디버그/테스트/placeholder 잔재 금지 | `scripts/check-release.ts`(§17에서 언급한 대소문자 구분 격차 있음). |
| 크로스도메인 UI embed 금지; 5탭 IA 고정 | `surface-domain-boundary.ts` + `check-phase-r-guards.ts`. |
| 에이전트의 시크릿 읽기 금지 | `secrets-read-deny.ts` hook, `.env*`/`.pem`/`.key` 읽기를 직접 차단(본 감사 자체도 세션 중간에 인접 ignore 메커니즘에 의해 `.cursor/perf/*.json` 읽기가 차단됨). |
| 5가지 특정 제품 변경 전 법률 재검토 필요(외부 상장, P2P 전송, 직접 교환, 출금경로 변경, 신규 적립경로 구조) | `docs/LEGAL_BASIS.md` — 코드로 강제되지 않는, 문서화된 제약. |
| 한 번에 heavy 게이트 1개만, foreground only, 특정 orphan-정리 lifecycle | 부분적으로 hook 강제(`subagent-guard.ts`가 다른 heavy 프로세스 실행 중 heavy subagent 기동을 차단); 그 외는 operator/에이전트 규율에 의존. |

---

## 19. 미확인 / Not Verified

9개 조사 패스 전체에서 정제한 목록 — 프로젝트를 정확히 이해하는 데 실질적 영향을 미치지만, 이번 read-only 정적 파일 읽기로는 확인할 수 없었던 항목들.

- **정확한 현재 CI 상태**(quality/sql/e2e/advisors), 정확히 지금의 HEAD(`06450b6e`)에 대해. 기록상 가장 최근 CI-green 증거는 한 커밋 계보만큼 뒤에 있다.
- **`BottomNav`가 데스크톱에서 여전히 노출되는 버그가 지금 열려 있는지 닫혀 있는지** — 코드 정책은 ≥1024px에서 숨김이라고 하지만, 같은 날짜의 작업 로그는 Home/Wallet에서 여전히 노출된다고 주장한다. 이번 패스는 이를 해결하지 못했다(브라우저를 실행하지 않음).
- **24시간 소크, PPR 리뷰, 3-Owner 서명, DR 훈련이 마지막 문서 스냅샷 이후 진행되었는지** — 읽은 모든 문서는 비어있는/미기입 템플릿으로 보인다; 이는 "문서에 완료 기록이 없다"는 것만 증명하며 "실제로 전혀 실행되지 않았다"는 것을 증명하지는 않는다.
- **정확한 현재 live `rpc_*` 함수 개수** — 방법에 따라 254–257; 이번 세션 자체 직접 정규식 카운트는 257을 반환했고, `RPC_USAGE_MATRIX.md`는 256을 주장한다.
- **`CREATE POLICY`/`SECURITY DEFINER` 누적 정확 개수** — 248개 마이그레이션에 걸친 수동 파일별 합산으로 인해 자릿수 단위(≈285 / ≈758)만 확인, 감사-정확 수치는 아님.
- **`wallets.version` 컬럼의 정확한 용도** — 모든 mutation마다 증가함은 확인되었으나, 진짜 낙관적 동시성 compare-and-swap 체크로 어디에서든 사용되는지(기존 pessimistic row lock 위에 놓인 감사용 카운터일 뿐인지)는 전체 RPC body를 확인하지 않아 미확인.
- **여러 trade/wallet 테이블의 현재 `supabase_realtime` publication 멤버십** — 2026-07-08 감사(테이블 10개 누락)와 2026-07-11 증거(같은 publication의 이후 "narrowing")가 상충하는 역사적 신호를 보인다.
- **`@phonara/wallet-ledger`와 `@phonara/sports-ingest`가 web/admin 앱에서 import되지 않는 것이 의도된 배선 대기인지 죽은 스캐폴드인지.**
- **`check:design-tokens --strict`를 지금 실행하면 통과할지 여부** — 로직은 읽고 추적했으나 read-only 제약상 실행하지 않았다.
- **Home/Wallet/Trade/Casino/Sports의 인증된 렌더링에 대한 실제 브라우저 접근성 메트릭**(critical/serious/moderate/minor 카운트) — 이번 패스에서 실행하지 않았고, 원본 감사들 자신도 실행하지 않았음을 스스로 인정하고 있다.
- **`docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2`–`R12`의 개별 증거 파일 약 48개와 최상위 `.yaml` 동반 파일 8개의 전체 내용**(서술형 `.md` 동반 파일만 읽음).
- **`H-09`(Supabase leaked-password protection)가 마지막 감사 접촉 이후 해결되었는지** — 이는 외부 결제 의존성(Supabase Pro+ 구매)으로, 저장소 상태에서 보이지 않는다.
- **`docs/PRODUCT/SCOPE_TRACK3_DECISION.md`가 그 이후 서명되었는지** — 읽은 버전 기준 미서명 확인; out-of-band 서명이 있었다면 저장소에는 반영되지 않는다.
- **`@deprecated` 마커가 붙은 약 20개 파일 중 약 16개**는 개별적으로 열어보지 않았다; 분류는 4개 파일 샘플의 패턴 일관성에 근거하며 전수 확인은 아니다.
- **Knip이 "unused devDependency"로 표기한 12개가 실제로 Knip의 의존성 그래프 밖(Vite 플러그인, CI, Playwright 설정 등)에서 사용되는지** — 리포트 자체의 서술로만 주장되며, 이번 패스에서 패키지별 독립 재검증은 하지 않았다.

---

## 20. 종합 그라운드 트루스

PHONARA는 초기 발견 단계의 프로젝트가 아니다 — **기능적으로 완성되어 있고, 스스로를 감사하는 습관을 가진, 출시 직전 단계의 플랫폼**이며, 엔진은 의도적으로 동결되었고 프레젠테이션 계층은 이미 한 번 완전히 철거된 뒤 상당 부분 재구축되었다. 이 코드베이스를 파악하는 누구에게든 가장 중요한 사실은, **"우리가 지금 어디에 있는가"를 서술하는 3개 문서가 정도의 차이로 낡아 있을 뿐 사실의 모순은 아니라는 점**이다: `.cursorrules`는 2026-07-04 시점의 마일스톤을 서술하고, `AGENTS.md`는 그보다 며칠 뒤의 시점을, 심지어 가장 최신이자 가장 엄격한 감사(2026-07-13)조차 자신의 하위 형제 파일보다 하루 낡았다. 저장소 안에서 실질적으로 가장 신선한 진실의 원천은 `docs/SSOT/ACTIVE_WORK_SSOT.md`의 *최상단*을 실제 git 상태와 함께 읽는 것이며, 둘 다 이 감사 시점에 진행 중인 같은 날짜의 카지노 UX 정비 작업을 보여준다.

문서 신선도라는 잡음 아래, 실제 엔지니어링은 일관되게 엄격하다: Decimal-only 금액이 타입 시스템과 데이터베이스 양쪽 레벨에서 동시에 강제되고, append-only 원장은 관례가 아니라 데이터베이스 규칙으로 강제되며, 도메인 격리는 코드로 검사되고, 실제 실행 가능한(단순 문서화가 아닌) permission/hook 계층이 존재하며, 디자인 시스템은 진짜 토큰 규율을 갖는다. 제품의 실제 현재 launch 장애물은 **operator가 소유한 프로세스와 일정 단계**다(소크 기간, 서명, 한 번도 실행된 적 없는 DR 훈련, 유료 Supabase 티어 업그레이드) — **미해결된 코드 결함이 아니다.** 코드 레벨 격차가 존재하는 곳은 좁고 구체적이며, 이미 저장소 자체의 이전 감사들이 대부분 스스로 식별해 놓았다(release 게이트의 대소문자 구분 격차, CI에 연결되지 않은 design-token 게이트, dead-code 리포트의 거짓 remediation 주장 1건, 데스크톱 하단내비에 대한 미해결 live-render 불일치). 이것이 그라운드 트루스다: 출시까지 마지막 한 걸음이 대부분 operator 게이트로 막혀 있는, 근본이 의문시되는 시스템이 아니라 성숙하고 잘 계측된 플랫폼이라는 것.
