# PHONARA brand mark

> Phase R §25.9 · `p1-foundation-brand` canonical · v8 Quad Stream Core (2026-07-05)

## Selected (canonical)

**Quad Stream Core** — `logo.svg` (v8 · mockup v2) · **operator 확정 2026-07-05**

| Element                    | Meaning                                                                 |
| -------------------------- | ----------------------------------------------------------------------- |
| **4 diagonal streams**     | Earn(green) · Trading(blue) · Sports(orange) · Casino(pink) — 균등 수렴 |
| **Purple core sphere**     | PHON+ARA 공명체 — 4축 합류 허브                                         |
| **Soft translucent resin** | 단일 광원(좌상) · petal gradient + core radial                          |
| **Monochrome fallback**    | chrome/favicon 16–32px — `logo-mono.svg` 퍼플 단색                      |

## Context matrix (§25.9 · Rev. 2026-07-05)

| Context                           | Treatment                              | Asset                  | Size     |
| --------------------------------- | -------------------------------------- | ---------------------- | -------- |
| favicon · 16–32px chrome          | purple mono CSS mask                   | `logo-mono.svg`        | 16–32px  |
| PWA maskable · apple-touch · boot | full-color on `#0d0f14`                | `splash-mark.svg`      | 64–512px |
| 랜딩 hero · OG share              | sculpted **3D** full-color             | `logo.svg`             | 120px+   |
| AppShell / auth header            | mono mark + lowercase wordmark         | `logo-mono.svg` + i18n | 20–24px  |
| Admin favicon                     | web 정본 geometry                      | `favicon.svg`          | —        |
| Wordmark                          | Pretendard 500 · `phonara` · +0.04em   | `wordmark.svg` / i18n  | —        |
| Lockup                            | full-color symbol + phonara            | `logo-lockup.svg`      | —        |
| OG title                          | **PHONARA** uppercase + 4-axis tagline | `og-card.png`          | 1200×630 |

**FAIL:** chrome에 3D · PWA에 currentColor black raster · PrimeForge 잔존.

## Single-source pipeline

```text
logo.svg (3D full-color) ────────────→ hero · OG raster
splash-mark.svg (flat 4-color) ──────→ PWA/maskable/apple/boot raster
logo-mono.svg (#7B6FE8) ─────────────→ chrome CSS mask · monochrome PNG
logo-flat.svg (currentColor) ────────→ optional theme mask
favicon.svg (prefers-color-scheme) ──→ browser favicon
wordmark.svg / logo-lockup.svg ──────→ marketing
```

```bash
bun run generate:brand
bun run check:pwa
```

## Quad-stream palette

| Axis    | Primary   | Highlight |
| ------- | --------- | --------- |
| Earn    | `#2EC4A0` | `#6EEBC5` |
| Trading | `#4B8FE8` | `#85B8F5` |
| Sports  | `#E07A52` | `#F0A882` |
| Casino  | `#D456A0` | `#E88EC4` |
| Core    | `#7B6FE8` | `#A99EF2` |

## Contrast

| Pair                            | Ratio                |
| ------------------------------- | -------------------- |
| `#7B6FE8` on `#0d0f14`          | **5.8:1** (AA large) |
| `#A99EF2` on `#0d0f14`          | **8.9:1** (AAA)      |
| full-color splash on `#0d0f14`  | min axis **7.2:1+**  |
| `#1A1D26` wordmark on `#ffffff` | **16:1**             |
| `#F0F2F5` wordmark on `#0d0f14` | **17:1**             |

## Wordmark rules

- Display: **`phonara`** (lowercase)
- OG/marketing title: **PHONARA** (uppercase)
- Font: Pretendard **500**
- Letter-spacing: **+0.04em**
- Tagline: `EARN · TRADE · SPORTS · CASINO`

## Legacy

- `concepts/` · `concepts-v2/` — exploration only, not canonical
- v7 Resonance Chamber (mint mono) — superseded
