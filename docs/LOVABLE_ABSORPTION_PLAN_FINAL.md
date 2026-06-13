# PHONARA × Lovable 흡수 플랜 v2.1 — Cursor 이식 ZIP

목표: **눈에 보이는 모든 것**(UI/UX·게임 화면·사운드·모션) = Lovable. **돈·RNG·페이아웃·원장·인증** = PHONARA 엔진(수정 금지). 이식 후 Cursor가 할 일은 어댑터 10~30줄 + props 연결뿐.

한 줄: **Stake급 60fps 화면만 만든다. 정산은 서버.**

---

## 1. 절대 금지 (이번 ZIP에서 만들지 않음)

- `src/engine/ports/*`, `EngineProvider`, `VITE_ENGINE_MODE`
- 클라 RNG/HMAC로 결과 산출 (`useProvablyFair()`의 결과 생성 로직)
- `rpc_*` / Supabase 직접 호출, JS `number` 금액 계산
- `routeTree.gen.ts` 의존, `/auth`, `games.$gameId` 동적 라우트
- Wheel/Keno/Tower/Coinflip/슬롯/라이브 **정산 로직** (UI shell은 P2 허용)
- `@phonara/ui` 카지노 위젯 모방·유지

PF 포맷(엔진 고정): `HMAC-SHA256(key=serverSeed, msg="${clientSeed}:${nonce}:${cursor}")`, 기본 `nonce=1`. UI는 표시·검증만.

---

## 2. P0 — 6종 게임 + 공용 + 카탈로그 (출시 1차 ZIP)

지원 `game_code` (DB 고정): `crash | dice | mines | plinko | limbo | hilo`. 통화 `PHON | USDT`, 금액은 항상 string.

### 2.1 공용 (`src/games/shared/`)

- `BetPanel`, `BetHistoryStrip`(가상 스크롤), `FairnessSheet`(seedHash/clientSeed/nonce/cursor 표시 + verify 스니펫), `RGGate`
- 훅: `useGameLoop`(rAF fixed-timestep, tab blur pause), `useSound`(단일 WebAudio, mute persist), `useHaptics`, `useReducedMotionGuard`, `useAutoBetQueue`(큐 UI만 — 실제 베팅은 어댑터)

### 2.2 게임 컴포넌트 표준 Props (전부 dumb/presentational)

```ts
type ImportedGameSurfaceProps = {
  gameCode: 'crash' | 'dice' | 'mines' | 'plinko' | 'limbo' | 'hilo';
  currency: 'PHON' | 'USDT';
  stake: string;
  selection: Record<string, unknown>;
  clientSeed: string;
  availableBalance: string | null;
  commitment: { round_id: string; server_seed_hash: string } | null;
  bet: { status: string; payout: string; result: Record<string, unknown> } | null;
  verification: VerificationEvidence | null;
  recentBets: RecentBet[];
  busy: boolean;
  confirmOpen: boolean;
  onStakeChange: (v: string) => void;
  onCurrencyChange: (c: 'PHON' | 'USDT') => void;
  onSelectionChange: (sel: Record<string, unknown>) => void;
  onClientSeedChange: (seed: string) => void;
  onPrepareRound: () => void;
  onOpenBetConfirm: () => void;
  onSubmitBet: () => void;
  onCancelBetConfirm: () => void;
};
```

### 2.3 게임별 selection (엔진 고정 — UI는 이 JSON만 조작)

- **Crash** `{ autoCashout: "2.00" }` — 원샷. 베팅 **전** 목표 설정. Pixi 곡선·로켓은 `result.crashMultiplier` 연출 리플레이. 중간 캐시아웃 버튼은 시각만.
- **Dice** `{ target, direction: 'over' | 'under' }`
- **Mines** `{ mineCount, revealedCells: number[] }` — 원샷. 타일 클릭은 로컬 state 누적 → 한 번에 베팅. 다음 타일 배수 미리보기는 `minesMultiplier()` 표시 전용.
- **Plinko** `{ rows: 8 | 12 | 16, risk: 'low' | 'medium' | 'high' }` — Matter.js는 연출, 핀 정합은 서버 결과로 강제.
- **Limbo** `{ target: "2.00" }`
- **Hilo** `{ startCard: number | null, guesses: ('higher' | 'lower' | 'skip')[] }`

### 2.4 카탈로그

- `src/routes/games.tsx`: 필터/검색/즐겨찾기/투어 카드 — 모든 카드 링크는 `/casino/{game}` (Lovable에서는 정적 `Link to` 문자열, 동적 라우트 안 만듦).

### 2.5 데모 라벨 정리

`.lovable/plan.md` 라벨 제거 작업 유지/마무리.

---

## 3. P1 — 앱 셸 + 게임 보조 페이지

- `src/routes/games.history.tsx`, `games.fairness.tsx`, `games.tournaments.tsx` (시각 + mock props)
- Earn / Home / Landing / Wallet / Auth(`/login`, `/signup` UI shell) / Account / Settings / Legal 마감
- RG 게이트 모달 UI (RPC 에러코드는 어댑터가 매핑)
- 접근성/스켈레톤/Empty/Error 표준화, sitemap/robots
- PWA는 PHONARA에 이미 구성됨 — **건드리지 않음**

## 4. P2 — 엔진 PR 병행 필요 항목 (UI shell만)

- 슬롯 4종 릴 컴포넌트 (`disabled` + "곧 제공"), 라이브 4종 보드/휠/로드맵 shell
- Wheel/Keno/Tower/Coinflip 시각 prototype — 라우트 등록은 엔진 PR 후

## 5. P3 — 정리

- 신규 `game_code` UI 연결, Playwright 카지노 funnel, Storybook, knip 정리, i18n ja/zh-CN 스켈레톤

---

## 6. ZIP export 경로 (Cursor 흡수 기준)

```text
src/components/{ui,shell,earn,trade,fomo,welcome}/*
  → apps/web/src/components/{ui,shell,earn,trade,fomo,welcome}/
src/games/shared/*
  → apps/web/src/components/games/shared/
src/games/shared/hooks/*
  → apps/web/src/components/games/shared/hooks/
src/games/{crash,dice,mines,plinko,limbo,hilo}/*
  → apps/web/src/components/games/{game}/
src/routes/games.tsx
  → presentation-import/pages/games-catalog-page.tsx
src/routes/games.history.tsx
  → presentation-import/pages/games-history-page.tsx
src/routes/games.fairness.tsx
  → presentation-import/pages/games-fairness-page.tsx
src/routes/games.tournaments.tsx
  → presentation-import/pages/games-tournaments-page.tsx
src/routes/{home,earn,wallet,trade,account,settings,...}
  → presentation-import/pages/*
```

- import alias `@/` 유지. PHONARA가 `react-router-dom` / `@/hooks/use-toast` / `@/lib/utils`를 TanStack/sonner shim으로 받음.
- Lovable Cloud **비활성**.

---

## 7. 의존성

**추가:** `pixi.js@^8`, `matter-js`, `@tanstack/react-virtual` (선택: `comlink`).

**이미 있음:** `framer-motion`, `lucide-react`, Radix, `vaul`, `cmdk`, `sonner`, `canvas-confetti`, `react-hook-form`, `zod`, `vite-plugin-pwa`, `@tanstack/react-router`.

**금지:** `howler`(자체 WebAudio 래퍼), 게임 컴포넌트 내 Supabase/Cloud.

---

## 8. 성능 수용 기준

| 지표 | 기준 |
|---|---|
| Desktop frame p95 | < 12ms (Crash 연출 중) |
| Mobile frame p95 | < 16.6ms |
| 게임 lazy JS | < 250KB |
| INP | < 100ms |
| LCP (/games) | < 1.8s |
| DOM 노드/게임 | < 150 |
| 10분 자동베팅 heap | 누수 0 |

모바일 DPR cap 2.0, `ResizeObserver` 재초기화, `transform/opacity`만 애니메이트, 파티클은 캔버스.

---

## 9. 산출 문서

- `docs/PRESENTATION_IMPORT.md` — 폴더 매핑·alias·금지사항
- `docs/GAMES-INTEGRATION.md` — 6종 selection·PF·RPC 순서
- `.env.example` — UI 전용 키만 (분석 placeholder)
- `CHANGELOG.md`

## 10. 범위 외

엔진/DB/Supabase/Cloud, 신규 game_code, 실 결제·KYC·라이브 비디오, 디자인 리브랜딩.

---

## 11. v2 → v2.1 변경 요약

| v2 원안 | v2.1 (PHONARA 흡수) |
|---|---|
| `GameProvider` + 클라 PF | `useCasinoRoundPipeline` + `useWallet`, 클라 산출 금지 |
| `src/engine/ports/**` | 삭제 — 기존 `hooks/`·`lib/rpc.ts` 유지 |
| 오리지널 10 + 슬롯 + 라이브 P0 | **6종 UI만 P0**, 나머지 Phase 2/3 |
| Stake식 멀티스텝 Crash/Mines | **원샷 모델** (autoCashout / revealedCells[]) |
| `/games/$gameId` 동적 | `/casino/{game}` 고정, Lovable은 카탈로그만 |
| `@phonara/ui` 게임 위젯 | 전부 제거 → Lovable `src/games/*`가 단일 출처 |

---

## 12. Cursor 이식 후 검증

```bash
bun run typecheck
bun --filter @phonara/web build
bun run check:i18n
bun run check:release
```

- 베팅 후 DB conservation Σ=0 (PHON/USDT)
- server_seed_hash → reveal → client verify 일치
- RG 한도 초과 시 베팅 차단
- 프로덕션 demo/test UI 없음

---

승인 시 **P0**(6종 게임 UI + shared + 카탈로그)부터 진행. P0 완료 시점에 점검 보고 후 P1 착수.

기술 명세: `docs/GAMES-INTEGRATION.md` · 일반 이식: `apps/web/PRESENTATION_IMPORT.md`
