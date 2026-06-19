# P1.4 · ⌘K Smart Search & Filter — v2 (정본)

> **상위:** [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) P1 · **P1.3 ✅ 후** · v4 §0·§10  
> **범위:** presentation-only · routing + recent push · 엔진 NO-TOUCH  
> **갱신:** 2026-06-15 · 검토 2건 반영

---

## 검토 반영 (v1 → v2)

1. **한글 alias = i18n only** — `casino-search-index.ts`는 `aliasKeys` + `asciiAliases` **ASCII only**. 한글 `"비행기"` 등은 `ko.ts`만. cmdk `value` = `t(nameKey)` ∪ `t(aliasKey)` ∪ ascii 병합.
2. **⌘K shell global** — `CommandPaletteProvider` + `<CommandPalette />` → **`src/routes/__root.tsx`** `RootComponent`. `ImportedCasinoPage` = `<SearchTrigger />` only. `/casino` · `/casino/crash` 양쪽 ⌘K.

---

## 왜 P1.4인가

P1.1~1.3 목록·상세 alive. **1초 내 게임 도달** 없으면 1M 스케일 이탈. Stake/Roobet ⌘K 패턴. **P2(Trade) 직전** 카지노 발견성 마감.

---

## 산출물 (12 paths · 9 implementation logical)

### 신규 6

| # | 파일 | 역할 |
|---|------|------|
| 1 | `src/data/casino-search-index.ts` | 10게임 · `aliasKeys[]` · `asciiAliases[]` · categories · `casino-game-meta` derived · **Hangul 0** |
| 2 | `src/hooks/useRecentPlays.ts` | `phonara.casino.recent` · max 8 dedupe · mount 후 read |
| 3 | `src/hooks/useCommandPalette.ts` | Context · ⌘K/Ctrl+K 1리스너 · `useCommandPalette()` |
| 4 | `src/components/casino/search/CommandPalette.tsx` | `CommandDialog` · `open && <Command/>` · chips · Recent · Popular · Empty · ⌘1~9 · ↵ nav + `pushRecentPlay` |
| 5 | `src/components/casino/search/SearchTrigger.tsx` | desktop pill · mobile icon · `setOpen(true)` |
| 6 | `src/components/casino/search/SearchResultRow.tsx` | 32px thumb · `<mark className="bg-accent/20 text-foreground">` · RTP · live · ⌘N |

### 편집 3

| # | 파일 | 변경 |
|---|------|------|
| 7 | `src/routes/__root.tsx` | `<InstallPromptProvider>` 안 · `<CommandPaletteProvider><Outlet /><CommandPalette /></CommandPaletteProvider>` |
| 8 | `src/components/pages/ImportedCasinoPage.tsx` | Hero 상단 `<SearchTrigger />` |
| 9 | `src/i18n/ko.ts` + `en.ts` | `casino.search.*` + `casino.search.alias.*` ≈ **35 keys** |

### 테스트 3 (P1.1 패턴 · 슬라이스 카운트 제외)

| # | 파일 | 케이스 |
|---|------|--------|
| T1 | `useRecentPlays.test.tsx` | dedupe · max 8 · `Storage.prototype` 격리 |
| T2 | `casino-search-index.test.ts` | `normalize("krash")` 매치 · category membership |
| T3 | `casino-search-alias-i18n.test.ts` | `locale=ko` · `t("…crash.plane")==="비행기"` (한글은 **테스트만**) |

**§0-5:** implementation **6+3=9** · tests 별도 · **1턴 마감**.

> **paste 메모:** ja/zh `casino.search.*` parity는 PHONARA merge 시 보강.

---

## Fuzzy 매치

```text
cmdk value per entry =
  t(nameKey) + " " + aliasKeys.map(t).join(" ") + " " + asciiAliases.join(" ")
```

- `크래시` / `krash` / `plane`(en alias) → Crash 1순위
- 카테고리 칩: All · Hot · Originals · Live · Slots · Crash · High RTP (i18n 라벨)

---

## 성능 / LOCK

| 규칙 | 적용 |
|------|------|
| lazy | `open && <Command/>` |
| listener | ⌘K 1개 · cleanup |
| scroll | Radix Dialog 닫힘 시 unlock |
| 인덱스 | 모듈 상수 |
| §10 | BottomNav · AppShell · PWA · ad/sensor 0 |
| 엔진 | `navigate()` + `pushRecentPlay` only |

---

## §GREEN self-check

```bash
rg -i "WatchCard|AdCard|mission\.ad|rewarded|offerwall" src/components/casino/search src/hooks/useRecentPlays.ts src/hooks/useCommandPalette.ts src/data/casino-search-index.ts && exit 1 || true
rg "[가-힣]" src/components/casino/search src/data/casino-search-index.ts src/hooks/useRecentPlays.ts src/hooks/useCommandPalette.ts --glob '!**/*.test.*' && exit 1 || true
rg "bg-\[#|text-white|text-black|oklch\(" src/components/casino/search && exit 1 || true
bunx vitest run src/hooks/__tests__/useRecentPlays.test.tsx src/data/__tests__/casino-search-index.test.ts src/data/__tests__/casino-search-alias-i18n.test.ts
```

---

## 스모크 (30초)

| # | 체크 |
|---|------|
| 1 | `/casino` → SearchTrigger · ⌘K |
| 2 | `/casino/crash` → ⌘K (shell) |
| 3 | 빈 쿼리 → Recent(empty) + Popular Top 5 |
| 4 | `크래시` / `krash` / `plane` → Crash |
| 5 | ↵ / ⌘1 → `/casino/crash` + recent push |
| 6 | ESC → 닫힘 · scroll 복귀 |

---

## Gate

| 항목 | FAIL |
|------|------|
| vitest | **358 + 3 = 361** |
| shell | Provider `__root` 누락 |
| alias | index 파일에 Hangul |
| sitemap | 시작 실측 N 불변 |

---

## 실행 · 보고

```text
P1.3 GREEN → P1.4 한 턴 → P2 LOCK bake → P2(12-O)
```

**마감:** `P1.4 GREEN · ⌘K palette (shell global) · alias i18n · vitest +3`

---

## PHONARA paste 어댑터

| Lovable | PHONARA |
|---------|---------|
| `__root.tsx` Provider | `apps/web/src/routes/__root.tsx` |
| `casino/search/*` | `apps/web/src/components/casino/search/` |
| `casino-search-index.ts` | `apps/web/src/lib/casino-search-index.ts` |

---

*P1.4 v2 정본 · 2026-06-15*
