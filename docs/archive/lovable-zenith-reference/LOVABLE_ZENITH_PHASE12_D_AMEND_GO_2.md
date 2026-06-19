# Phase 12-D Step 9 RED=1 — operator amend GO #2 (#D-13 · Lovable 복붙용)

> **아래 `---BEGIN---` ~ `---END---` 전체를 Lovable 채팅에 붙여넣기.**  
> **정본:** [`LOVABLE_ZENITH_PHASE12_D_LOCK.md`](LOVABLE_ZENITH_PHASE12_D_LOCK.md) v0.2.2 · Step 9 = [`LOVABLE_ZENITH_PHASE12_D_EXECUTE_PASTE.md`](LOVABLE_ZENITH_PHASE12_D_EXECUTE_PASTE.md)

---BEGIN---

# 12-D amend GO #2 · Step 9 re-run (#D-13)

**첫 응답 1줄:** `12-D amend GO #2 (v0.2.2 · #D-13) 수령 · Step 9 G-D13 re-run 착수.`

Step 0~8 PASS 유지 · **코드 변경 0** · Step 9에서 **G-D13 vitest 블록만** #D-13 패치 · 나머지 gate **전부 그대로** (#D-11·#D-12 포함).

---

## operator 판정

| 옵션 | 판정 |
|------|------|
| **#D-13** vitest summary output assert (exit code 무시) | **승인** |
| plinko `Stage.tsx` guard (legacy fix) | **거부** — 12-A scope · 12-D NO-TOUCH |
| exit code 재시도만 | **거부** — flaky · 확률적 GREEN |

**원인:** jsdom canvas `getContext` null → `plinko/Stage.tsx:136 setTransform` unhandled · **pre-existing** · 12-D drift = 0 · Tests **356/356** · Files **77/77** 실측 PASS.

---

## #D-13 — G-D13 vitest (output assert)

`bunx vitest run || fail "vitest"` **제거** → summary line assert:

```bash
echo "=== G-D13 i18n + vitest (#D-13 · output assert · jsdom plinko flake) ==="
bash scripts/i18n-parity.sh || fail "i18n-parity"
VLOG=$(mktemp)
set +e
bunx vitest run 2>&1 | tee "$VLOG"
V_EC=$?
set -e
T_LINE=$(rg 'Tests\s+[0-9]+ passed \([0-9]+\)' "$VLOG" | tail -1)
TF_LINE=$(rg 'Test Files\s+[0-9]+ passed \([0-9]+\)' "$VLOG" | tail -1)
[ -n "$T_LINE" ] || fail "G-D13 vitest Tests summary missing (exit=$V_EC)"
[ -n "$TF_LINE" ] || fail "G-D13 vitest Test Files summary missing (exit=$V_EC)"
T_PASS=$(echo "$T_LINE" | sed -E 's/.*Tests[[:space:]]+([0-9]+) passed.*/\1/')
T_TOTAL=$(echo "$T_LINE" | sed -E 's/.*\(([0-9]+)\).*/\1/')
TF_PASS=$(echo "$TF_LINE" | sed -E 's/.*Test Files[[:space:]]+([0-9]+) passed.*/\1/')
TF_TOTAL=$(echo "$TF_LINE" | sed -E 's/.*\(([0-9]+)\).*/\1/')
rg 'Tests\s+[1-9][0-9]* failed' "$VLOG" \
  && fail "G-D13 vitest has failed tests (exit=$V_EC)" || true
[ "$T_PASS" = "$T_TOTAL" ] && [ "$TF_PASS" = "$TF_TOTAL" ] && [ "$T_PASS" != "0" ] \
  && echo "OK G-D13 vitest Tests ${T_PASS}/${T_TOTAL} Files ${TF_PASS}/${TF_TOTAL} (exit=$V_EC · #D-13)" \
  || fail "G-D13 vitest mismatch Tests=${T_PASS}/${T_TOTAL} Files=${TF_PASS}/${TF_TOTAL} exit=$V_EC"
```

**FAIL =** Tests failed > 0 · summary missing · pass ≠ total · **exit code만으로 RED**.

---

## Step 9 re-run

`EXECUTE_PASTE.md` Step 9 **전문** · G-D13 블록만 위로 치환 · RED=0 → Step 10 §GREEN G-D1~G-D15.

---

## 금지

plinko/`src/games/**` edit · 재구현 · Step 0~8 재실행 · gate 축약 · §GREEN/ZIP 주장.

**ZIP:** operator **「ZIP 발행」** 전까지 **금지**.

---END---
