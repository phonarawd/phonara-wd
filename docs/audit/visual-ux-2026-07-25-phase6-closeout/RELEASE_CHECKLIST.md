# Phase 6 Release Checklist (2026-07-25)

> Plan `world-class_presentation_rebuild_bc0d5f4b` Phase 6 — every line must PASS (not "mostly").  
> 판정 근거는 Phase 0–5 ACTIVE_WORK_SSOT 절 + 본 팩 SCREENSHOT_INDEX + 로컬 L0–L4 게이트.

| #   | 항목                                                                                | 판정     | 근거                                                                     |
| --- | ----------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| 1   | Visual Complete — every phase DoD evidence attached                                 | **PASS** | Phase 0–5 CDP/스크린샷 절 + [SCREENSHOT_INDEX.md](./SCREENSHOT_INDEX.md) |
| 2   | Functional Complete — Phase 1 games click-tested · other surfaces controls verified | **PASS** | Phase 1 dice/mines/hilo interact CDP · Phase 2–5 HI-QA display contracts |
| 3   | Accessibility Complete — axe critical 0 on touched surfaces                         | **PASS** | 각 phase `axeCriticalFindings:[]` / contract HI-QA                       |
| 4   | Performance Complete — Pixi disposal + ≥55fps heaviest                              | **PASS** | phase1d-0 shared Pixi fix · dice/hilo FPS traces (≥55)                   |
| 5   | Responsive Complete — 390/768/1024/2560                                             | **PASS** | Public 4단 · auth 390/1024/2560(+768 CDP 의도 스킵 문서화)               |
| 6   | Design Token Complete — `check:design-tokens --strict`                              | **PASS** | strict green · spacing-ratchet advisory **0**                            |
| 7   | No Known Critical Issues — 0 open P0/P1                                             | **PASS** | Phase 5까지 P0/P1 수정 완료 · open P2(wave-debt 등) DEFER 유지           |
| 8   | Engine Boundary Preserved — `check:phase-r-guards --strict`                         | **PASS** | Phase 6 코드 = launch-gates flag + surface `gap-ds-8` only · RPC **0**   |

## Documentation exit

| #   | 항목                                                                      | 판정                                                                                                                                  |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `ACTIVE_WORK_SSOT.md` closeout sync (`82`)                                | **PASS** — §Phase 6 결과                                                                                                              |
| D2  | `visual-ux-2026-07-11/*` superseded 주석                                  | **PASS** — README 배너                                                                                                                |
| D3  | Release notes via `bun run release:manifest` (새 release-notes 파일 금지) | **MECHANISM** — clean tree + `apps/*/dist` 빌드 후 스탬프(H-06). 본 세션 working tree dirty이므로 stamp는 merge/빌드 직후 operator/CI |

## Out of scope (명시)

- Public launch / 24h soak / 3-Owner 서명 / DR / Supabase Pro+ — `platform-perfect-launch`
- 로컬 heavy E2E · `test:sql` · `check:full` — GitHub CI authoritative (G13)
