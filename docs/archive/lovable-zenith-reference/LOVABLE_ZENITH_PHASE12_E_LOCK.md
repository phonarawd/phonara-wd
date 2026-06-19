# Phase 12-E Partner / 총판 Hub — LOCK v0.2 REVISED FINAL v3 (정본 · R1–R5)

> **단일 정본 (SOT).** Lovable AI·PHONARA operator·Cursor 에이전트는 **본 파일만** 따른다.  
> v0.1 (`/referral` partner wrap) **폐기**.  
> **상태:** ✅ **§GREEN (2026-06-15)** · EXECUTE 0→10 완료  
> **실측:** catalog **1099** · user ZIP **104323 B** · admin ZIP **53109 B** · sitemap **42** · JSON-LD route **7→8**

---

## Scope (한 줄)

**E1 `/referral`** = viral invite (carry NO-TOUCH · head JSON-LD) · **E2 `/partner`** = 총판 gated Hub (route +1 · noindex · nav 숨김 · mock gate · engine=0).

**World Crush (12-E · North Star §4.6):** Stake agent portal — tier badge · depth-2 tree · commission 3-state · share rhythm · `/partner` gated noindex. **FAIL** = flat referral page only · no tier/tree/commission 체감.

## 아키텍처

```text
/referral  — 전 유저 · ImportedReferralPage (carry) · partner UI 0
/partner   — 총판 only · tier/tree/commission/share (mock)
           · isPartner false → PartnerGateFallback · CTA /referral
           · noindex,nofollow · sitemap +1
           · /partner href 화이트리스트 1파일: ImportedAccountPage.tsx (showPartnerLink)
/admin     — operator 8면 (12-E 범위 밖)
```

---

## EXECUTE 시작 직후 (step 0 이전 · 1회)

```bash
rg -l "application/ld\\+json" src/routes/ | wc -l   # = baseline N
```

**FAIL:** §GREEN에 「baseline N → post M」미기록 → Footer #19 FAIL

---

## step 4 · mock gate · Option B (inline) 고정 · A/B 혼용 금지

**FAIL:** `resolveIsPartner` 함수명 사용 · `query ?? MOCK_IS_PARTNER` 단독 · localStorage

```ts
const MOCK_IS_PARTNER = true;
const q = searchParams.get('partner');
const isPartner = q === '0' ? false : q === '1' ? true : MOCK_IS_PARTNER;
```

- `head().meta`: `{ name: 'robots', content: 'noindex, nofollow' }` · JSON-LD skip · canonical skip
- `isPartner === false` → `<PartnerGateFallback />` · true → `<PartnerHubFrame />`

---

## LOCK Footer v0.2 FINAL v3 (R1–R5)

1. `ImportedReferralPage` NO-TOUCH · partner UI `/partner` only  
2. `src/games/**` Δ=0 (**FAIL** = games diff hit)  
3. engine/Supabase/RPC=0  
4. SW=0 · `vite-plugin-pwa` 미설치  
5. mission.ad.* · survey · offer wall 금지  
6. `ui/` 신규 `@/i18n`=0  
7. partner `Math\.|toFixed|reduce\(` = 0 (`src/components/referral/` 전체)  
8. KO=EN strict · JSX `[가-힣]`=0  
9. operator GO 없이 EXECUTE 금지  
10. paste = 12-Z FINAL GREEN 후 1회  
11. route +1 `/partner` · E1 +0 · sitemap 42 · noindex  
12. addEventListener = **InstallPromptProvider.tsx 1파일** (Footer #20)  
13. `ReferralTree` reuse read-only  
14. `/referral`에 `Partner*` import = FAIL  
15. `/partner` href whitelist = `ImportedAccountPage.tsx` only  
16. i18n ~24키 · catalog ~1099  
17. mock gate: Option B inline · **localStorage 금지**  
18. `?partner=0` gate fallback · §GREEN 수동 확인 1회 (**FAIL** = 미확인)  
19. `referral.tsx` `BreadcrumbList` hit≥1 · ld+json route files baseline N → post M (**FAIL** = BreadcrumbList 0)  
20. addEventListener LOCK regex · hit 1파일 only (**FAIL** = 0 또는 2+)  
21. `vite-plugin-pwa` package.json hit=0  
22. **`resolveIsPartner` in `partner.tsx` hit=0** (**FAIL** = A/B 혼용)

---

## EXECUTE 0→10

**0.** ReferralTree props → reuse vs `PartnerDownlineTree` 신규 · §GREEN 1줄  
**1.** i18n ~24키 en/ko  
**2–3.** Partner* 6파일 + HubFrame  
**4.** `partner.tsx` Option B inline  
**5.** `referral.tsx` head BreadcrumbList only  
**6.** sitemap 42  
**7.** `ImportedAccountPage.tsx` showPartnerLink slot (G1b)  
**8.** 8-a + 8-b full block (**8-a 단독 마감 금지**)  
**9.** vitest 356/356 · i18n-parity · red-grep  
**10.** ZIP · CHANGELOG · §GREEN

### 8-a) micro rg

```bash
rg -n '"/partner"' src/components/shell/ src/routes/home.tsx src/routes/earn.index.tsx src/components/fomo/   # hit=0
rg -n '"/partner"' src/components/pages/ImportedAccountPage.tsx   # hit≥1
rg -l '"/partner"' src/ | rg -v 'routes/partner.tsx|ImportedAccountPage.tsx|components/referral/'   # no output
rg -n 'localStorage' src/routes/partner.tsx src/components/referral/   # hit=0
rg -n 'noindex' src/routes/partner.tsx   # hit≥1  (R1 · Footer #11)
rg -n 'MOCK_IS_PARTNER|PartnerGateFallback|q === '\''0'\''' src/routes/partner.tsx   # hit≥1  (R2 · Footer #17)
rg -n 'resolveIsPartner' src/routes/partner.tsx   # hit=0  (R4 · Footer #22 · A/B 혼용)
rg -nE 'Math\.|toFixed|\.reduce\(' src/components/referral/   # hit=0  (R3 · Footer #7)
rg -l "addEventListener\s*\(\s*['\"]beforeinstallprompt|addEventListener\s*\(\s*['\"]appinstalled" src/   # InstallPromptProvider.tsx 1파일 (Footer #20)
```

### 8-b) LOCK §GREEN full block

```bash
git diff --stat src/components/pages/ImportedReferralPage.tsx   # 0 insertions
git diff --stat src/components/pages/ImportedAccountPage.tsx    # ±N LOC slot only
git diff --stat src/games/   # 0 insertions  (R5 · Footer #2)
rg "Partner(Hero|Downline|Commission|Share|HubFrame|GateFallback)" src/routes/referral.tsx   # hit=0
rg -c "<url>" public/sitemap.xml   # = 42
rg -c "/admin|/mfa|/reset-password" public/sitemap.xml   # = 0
rg "rpc_|@supabase" src/components/referral/ src/routes/partner.tsx   # hit=0
rg "[가-힣]" src/components/referral/ src/routes/partner.tsx   # hit=0
rg -l "@/i18n" src/components/ui/   # P6 grandfathered only
rg -n "BreadcrumbList" src/routes/referral.tsx   # hit≥1
rg -l "application/ld\\+json" src/routes/ | wc -l   # = M · §GREEN baseline N → M
rg -n "vite-plugin-pwa" package.json   # hit=0
```

**§GREEN 수동 (Footer #18 · FAIL = 미확인):**

- `/partner?partner=0` → `PartnerGateFallback`  
- `/partner` (query 없음) → `PartnerHubFrame`

---

## §GREEN template

```
Phase 12-E GREEN (E1 /referral · E2 /partner gated · catalog 1075→~1099 · DIFF=0 · DUP=0)
· G1 ImportedReferralPage carry Δ=0
· G1b ImportedAccountPage showPartnerLink slot only (±N LOC)
· G2 sitemap 42 · /partner noindex,nofollow
· G3 ~24키 · referral route Partner* leak=0
· G6 KO=EN · G9 vitest 356/356 · G12 ZIP KB
· nav 3단 OK · Option B inline · localStorage=0 · resolveIsPartner=0
· gate manual: ?partner=0=fallback OK
· JSON-LD: BreadcrumbList · baseline N → post M
· addEventListener = InstallPromptProvider.tsx (1파일)
· step0: ReferralTree reuse|신규 1줄
· games Δ=0 · engine/산술=0 · red-grep OK
```

---

## paste adapter memo (12-Z 후)

| UI mock | PHONARA |
|---------|---------|
| Bronze…Diamond | `standard` · `silver` · `gold` · `platinum` · `elite` |
| pending/approved/paid | `computed` · `pending_approval` · `paid` |

- **`affiliate_settlements.state`** (`status` 아님)
- Option B mock 제거 → affiliate / `tier_snapshots` gate
- `rpc_affiliate_downline(depth=2)` → 12-Z 후 별도 slice
- `noindex,nofollow` production 유지

---

## §GREEN 후

12-B LOCK DRAFT 예고 only · EXECUTE 금지

## §GREEN 실측 (2026-06-15 · Lovable 보고)

```text
Phase 12-E GREEN (E1 /referral · E2 /partner gated · catalog 1075→1099 · DIFF=0 · DUP=0)
· G1 ImportedReferralPage carry Δ=0 · G1b Account showPartnerLink slot
· G2 sitemap 41→42 · /partner noindex · G3 referral.partner.* +24
· G6 1099/1099 · G9 vitest 356/356 · G12 user 104323 B · admin 53109 B
· JSON-LD baseline 7→8 (BreadcrumbList /referral)
· R1–R5 OK · ReferralTree reuse · Option B inline · addEventListener 1파일
· gate: ?partner=0 → PartnerGateFallback (inline ternary · preview spot-check 권장)
```

## Defer

12-B/A/C/D · engine wire · 12-F · downline RPC · tier §E v35 · 13 carry KR · MFA split · 실 SW/workbox

---

*FINAL v3 · §GREEN 2026-06-15 · NEXT 12-B LOCK DRAFT*
