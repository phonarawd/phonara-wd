# ADR-000: Demolition-first — presentation orchestration 백지

> **상태:** Accepted · **착수:** Phase D Batch 0  
> **범위:** Demolition만 — Rebuild는 별도 ADR

## Context

PHONARA는 UI/UX를 3회 이상 전면 교체했으며, 격리·rollback reserve·parallel route가 **AI와 operator가 레거시를 참고**하게 만들어 4번째 반복을 유발했다.

[`ENGINE_BOUNDARY.md`](../../SSOT/ENGINE_BOUNDARY.md) 및 기존 ADR은 page controller·presentation orchestration layer 보존을 전제로 한다.

## Decision

1. **Demolition-first:** presentation JSX/CSS/routes/assets·`packages/ui`·`packages/game-ui`·page controller **전부 삭제** (옵션 A).
2. **의도적 override:** engine boundary 중 **presentation orchestration** 은 백지로 재정의한다. DB · RPC · contracts · domain · money/game/trade 엔진 packages는 불변.
3. **복구 SSOT:** `apps/web/src/contracts/**` · `domain/**` (\*.ts) · `git tag ui-v3-final-backup` — tag에서 UI 복붙 **금지**.
4. **Presentation orchestration** (page controller 등) 및 **v2 실행 문서**는 Batch 11에서 `git rm` — archive 이동 금지.
5. **완료 기준:** 코드 백지 + Doc Demolition (KEEP 표 A만) + `check:engine-demolition:full` green.
6. **Rebuild:** Demolition DONE 후 **별도** `REBUILD_PLAN_v1` — controller는 `product/bridge/` 에서 **신규 작성**.

## Consequences

- Demolition ~2주간 브라우저 돈 경로 검증 불가 → SQL conservation · Rebuild 후 operator L6.
- 카지노 Pixi 화면 전멸 → `game-engine` RNG/settlement 유지 · 화면은 Rebuild.
- i18n 키 catalog KEEP · UI 0 — Rebuild 시 키 reuse OK.

## Operator sign-off

> 엔진만 남기고 UI 전삭제, 앱 빌드 깨짐 수용.

| 필드   | 값                                                   |
| ------ | ---------------------------------------------------- |
| 서명   | operator — D0 시작 승인                              |
| 날짜   | 2026-07-02                                           |
| 동기화 | `docs/archive/PRE_DEMOLITION_INVENTORY.md` 동일 문구 |
