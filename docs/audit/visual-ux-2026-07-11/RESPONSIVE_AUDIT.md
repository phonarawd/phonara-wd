# RESPONSIVE_AUDIT — PHONARA Phase R

> **날짜:** 2026-07-11  
> **SOT:** `apps/web/src/product/tokens/viewport-contract.ts` · `layout.css`

---

## 1. Breakpoint 정본

| Key          | px   | 역할                               |
| ------------ | ---- | ---------------------------------- |
| mobileNarrow | 320  | 최소 폭                            |
| mobile       | 390  | smoke · 기본 모바일                |
| mobilePlus   | 480  | `sm:` 밀도 상승                    |
| tablet       | 768  | 2-col · gutter-wide                |
| desktop      | 1024 | Orbit 12-col · BottomNav 숨김 경향 |
| wide         | 1280 |                                    |
| ultra        | 1920 | content max 1680 letterbox         |
| superwide    | 2560 | trade panel min 유지               |

### Layout tiers (5)

`mobile` · `mobilePlus` · `tablet` · `desktop` · `ultra`

### Smoke widths (게이트 체크리스트)

#### 390 · 768 · 1024 · 2560

### 요청 해상도 매트릭스와의 관계

| 요청                                       | 제품 정본과의 관계      |
| ------------------------------------------ | ----------------------- |
| 1920×1080 · 1600×900 · 1440×900 · 1280×720 | desktop/wide/ultra 샘플 |
| 1024×1366 · 820×1180                       | tablet                  |
| 430…320 세로                               | mobile / mobileNarrow   |

제품 게이트는 **4 smoke 폭**이 권위. 12해상도 풀매트릭스는 Director 참고용.

---

## 2. Shell geometry

| Token                     | 값                              |
| ------------------------- | ------------------------------- |
| `--ds-content-max`        | 1680px                          |
| `--ds-panel-min`          | 280px                           |
| `--ds-shell-gutter`       | clamp(1rem, 2.5vw, 1.5rem)      |
| `--ds-shell-gutter-wide`  | clamp(1.25rem, 3vw, 2rem) @768+ |
| `--ds-shell-gutter-ultra` | clamp(1.5rem, 4vw, 3rem) @1920+ |
| `--ds-touch-target-min`   | 48px                            |

클래스: `.ds-shell-page` · `.ds-shell-content-column` · `.ds-shell-bleed` · `.ds-shell-panel-grid`

---

## 3. 컴포넌트별 반응형 변화

| 영역           | ≤479 mobile              | 480–767+    | ≥768 tablet           | ≥1024 desktop    | ≥1920 ultra        |
| -------------- | ------------------------ | ----------- | --------------------- | ---------------- | ------------------ |
| BottomNav      | fixed 표시               | 표시        | 표시                  | 숨김(정책)       | 숨김               |
| Earn side rail | 없음                     | 없음        | 부분                  | 표시             | 표시               |
| Domain subnav  | 가로 칩                  | 가로        | 가로 · lg:hidden 일부 | desktop 대체 nav | 동일               |
| Trade desk     | mobile tabs + sticky CTA | 동일        | tablet 2-col          | 3-panel grid     | 2560+ panel min    |
| Orbit grid     | 1-col                    | 1-col       | 2-col                 | 12-col span      | 동일 + letterbox   |
| Cards          | stack                    | denser type | 2-col                 | 8/4 composition  | 동일               |
| Casino stage   | min-h 220                | —           | min-h 320             | 동일             | 동일 (placeholder) |
| Typography     | fluid clamp              | fluid       | fluid                 | fluid            | fluid              |

---

## 4. Trade desk (특수)

- 파일: `trade-desk-layout.css` · `trade-desk-tablet-layout.tsx` · `trade-desk-mobile-tabs.tsx`
- `@container` + `--ds-content-max`
- 모바일: 차트/호가/티켓 탭 분리 + bottom sticky CTA
- 태블릿: 2열
- 데스크톱: 3열 (book | chart | ticket)
- Ultra: panel min 280 유지

**리스크:** CSS 복잡도 → 해상도 회귀 비용 큼

---

## 5. 금지 패턴 (§32.7)

| 금지                                          | 이유                            |
| --------------------------------------------- | ------------------------------- |
| page root `max-w-[390px]` / `w-[390px]`       | shell column 우회 → 가로 스크롤 |
| page root `min-w-[500px+]`                    | 모바일 가로 스크롤              |
| surface 내부 subnav + 긴 vertical 이중 chrome | 스크롤 혼란                     |
| Trade에 sports/casino embed                   | 도메인 격리                     |

의도된 `overflow-x-auto`는 **Card/table wrapper 안**만 허용.

---

## 6. 반응형 이슈 요약

1. Trade desk 다단 레이아웃 — 최우선 회귀 대상
2. Casino stage는 높이만 반응형, 콘텐츠 없음
3. Landing 섹션 스택 — 좁은 폭에서 스크롤 길이 과다
4. Admin 테이블 — 모바일 최적화 약할 수 있음 (운영 PC 가정)

---

## 7. 캡처 권장 폭 (실무)

우선: **390 · 768 · 1024 · 1920**  
확장: 요청 12해상도 (Director 풀매트릭스)
)
