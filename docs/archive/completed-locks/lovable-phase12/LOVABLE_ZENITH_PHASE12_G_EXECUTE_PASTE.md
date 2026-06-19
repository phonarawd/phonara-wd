# Phase 12-G EXECUTE GO — Lovable 붙여넣기

> **선행:** **12-A §GREEN** · catalog **1201**  
> **정본:** [`LOVABLE_ZENITH_PHASE12_G_LOCK.md`](LOVABLE_ZENITH_PHASE12_G_LOCK.md)

---BEGIN---

# 12-G EXECUTE GO · SEO Sweep v0.1 (GAP #4·#5·#6 P1)

**첫 응답 1줄:** `12-G EXECUTE GO 수령 · catalog baseline 1201 · Step 0 착수.`

**target:** catalog **1229** (Δ +28) · head() **60/60** · sitemap **43**

---

## Step 0 — Pre-flight

```bash
# Lovable READ-ONLY: 14 headless routes — EXECUTE 전 route list 확정·LOCK에 pin
HEADN=$(rg -l 'head\s*\(' src/routes/ | wc -l | tr -d ' ')
echo "head routes now: $HEADN (expect 46 before sweep)"
test -f src/routes/__root.tsx || exit 1
echo "OK Step 0"
```

---

## Step 1~3 — 구현

1. **14 route** `head()` 추가 — title · description · og:title · og:description · canonical · og:url · **og:image leaf only**
2. **i18n** +28 — `seo.<route>.title` · `seo.<route>.description` ×14 (ko/en)
3. **VERIFY** `__root.tsx` — global `og:image` **제거/없음**

**NO-TOUCH:** ImportedPage 본문 · 기존 **46** route head blocks Δ=0 · component · sitemap URL count

---

## Step 5 — Self-check

```bash
set -u; RED=0; fail(){ echo "FAIL $*"; RED=1; }

HEADN=$(rg -l 'head\s*\(' src/routes/ | wc -l | tr -d ' ')
[ "$HEADN" = "60" ] && echo "OK R-G2 head=60/60" || fail "R-G2 head=$HEADN"

rg -n 'og:image' src/routes/__root.tsx && fail "R-G4 root og:image" || echo "OK R-G4"

bash scripts/i18n-parity.sh || fail "i18n"
URLN=$(rg -c '<url>' public/sitemap.xml)
[ "$URLN" = "43" ] || fail "sitemap=$URLN"

[ $RED -eq 0 ] && echo "===== 12-G GREEN catalog=1229 head=60/60 =====" || exit 1
```

---

## Step 6 — §GREEN G-G1~G-G8 · **끝판왕 3종 완료 보고**

operator 「Lovable 완성」 대기 · ZIP/PHONARA paste **금지**.

---END---
