# LOVABLE World Crush · Home Nav Overlap Hotfix LOCK — L1-16e v0.1 EXECUTE

> **상태:** **✅ §GREEN APPROVE** · 2026-06-17 · home tests **16/16** · SideNav **6** · D∩E 라벨 **0**  
> **큐 ID:** **L1-16e** (nav overlap audit · CRITICAL hotfix)  
> **의존:** L1-16c ✅ · vitest carry post-16c **540/544** · catalog **2591**  
> **상위:** [`LOVABLE_WORLD_CRUSH_L1-16C_HOME_STAKE_LOBBY_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16C_HOME_STAKE_LOBBY_LOCK.md)

---

## Scope (1줄)

`/home` nav overlap 해소 — **HomeSideNav 슬림화** (missions/rank/invite 제거 · sports 추가) · 헤더 브랜드 **Link→div** · HomeTabShell과 **라벨 교집합 0** · rpc/i18n minimal append only.

---

## Audit summary (operator 2026-06-17)

| 등급 | 이슈 | fix |
|------|------|-----|
| CRITICAL | Missions/Rank/Invite — SideNav 이탈 vs Tab 패널 | SideNav에서 3항목 제거 |
| MAJOR-1 | 브랜드 Link + Home nav 이중 `/home` | 브랜드 → `<div>` 표시만 |
| MINOR | MoreMenu vs SideNav 비대칭 | `/sports` SideNav 추가 |

**Defer:** `/more` route vs sheet · Games/Casino 라벨 (3-3) — future slice

---

## HomeSideNav (after fix)

**6 items:** Home · Casino · Games · Trade · Wallet · **Sports**

**Removed from SideNav (Tab owns these on `/home`):**
- `/earn/missions` (Missions)
- `/leaderboard` (Rank)
- `/referral` (Invite)

**Header:** brand block **non-link** `<div>` — single Home nav item for `/home` active state.

---

## Files (canvas)

| ID | Path | Action |
|----|------|--------|
| H16e-1 | `src/components/home/HomeSideNav.tsx` | EDIT — 8→6 items · sports add · brand div |
| H16e-2 | `src/i18n/ko.ts` + `en.ts` | APPEND `home.side.sports` if missing |
| H16e-3 | `src/components/home/__tests__/HomeSideNav.test.tsx` | EDIT — count=6 · D∩E labels 0 |

**NO-TOUCH:** BottomNav · HomeTabShell 5 tabs · WalletStrip · EarnPowerRow · posters · `/trade` · admin · rpc · ZIP

---

## LOCK Footer H16e-F1 ~ F6

| # | 고정 | FAIL |
|---|------|------|
| F1 | SideNav item count **= 6** | missions/rank/invite still in SideNav |
| F2 | SideNav ∩ TabShell **label intersection = 0** | same label different destination |
| F3 | Brand header **not** `<Link to="/home">` | dual /home entry |
| F4 | `data-primary-cta` **= 1** | changed |
| F5 | home vitest **16/16** (or full carry) | fail |
| F6 | ko=en **DIFF=0** | drift |

---

## §GREEN (reported)

- HomeSideNav **8→6** · missions/rank/invite removed · **sports** added
- Header brand **Link→div**
- Label intersection **= 0**
- **16/16** home tests pass

**§GREEN template:**

```text
L1-16e §GREEN — SideNav 6 · D∩E labels 0 · brand div · home tests 16/16 · L1-16d/L1-17 queue per contract · ZIP defer.
```

---

## Defer

- L1-16d poster cards — **still queued if not §GREEN**
- `/more` route unification · Games label clarity — L1-16e.1 optional

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 EXECUTE · §GREEN APPROVE — nav overlap hotfix |

---

*Operator priority hotfix · may run parallel to L1-16d poster slice*
