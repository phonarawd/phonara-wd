# Phase 12-B EXECUTE GO — Lovable 채팅 붙여넣기 (v0.3.1 · A1)

> **PHONARA repo:** docs only · **EXECUTE = Lovable canvas**  
> **SOT:** [`LOVABLE_ZENITH_PHASE12_B_LOCK.md`](LOVABLE_ZENITH_PHASE12_B_LOCK.md)

---BEGIN EXECUTE GO---

# 12-B EXECUTE GO (분기 A1) · LOCK v0.3.1 baked

12-E NO-TOUCH · ZIP Step 9 only · RED 시 즉시 STOP + REVISE 보고.

**Step 0 pre-flight 먼저:** `earn.missions.tsx`에 `const missions: MissionItem[]` + `<MissionChecklist items={missions} />` 확인. 없으면 RED stop.

**Step 1→10** — `LOVABLE_ZENITH_PHASE12_B_LOCK.md` EXECUTE 0→10 최종 플랜 그대로.

**필수 self-check (Step 7/8):**

```bash
git diff src/components/earn/MissionChecklist.tsx | rg "^[+-].*(onClaim|MissionLane|LANE_ORDER|Props|interface\s+MissionChecklist|items\??:\s*MissionItem)" && echo FAIL || echo OK
git diff src/routes/earn.missions.tsx | rg "^[+-].*\b(head|meta|canonical|ld\+json)\b" && echo FAIL || echo OK
rg -n '"/partner"' src/components/shell/ src/routes/home.tsx src/routes/earn.index.tsx src/components/fomo/
rg -n '"/partner"' src/routes/earn.missions.tsx | wc -l
rg -oN "id:\s*['\"][^'\"]+['\"]" src/routes/earn.missions.tsx | rg -v "id: ['\"](daily|growth|viral|weekly|tier|social)-[a-z][a-zA-Z0-9]*['\"]" && echo FAIL || echo OK
bash scripts/red-grep.sh
bunx vitest run
bash scripts/i18n-parity.sh
```

**§GREEN 보고:** G-B1~G-B14 · catalog ~1127 · vitest N/N · ZIP KB · R-B17a/b OK.

**Step 10:** 12-C Home Hub LOCK DRAFT 예고 only — 코드 변경 0.

---END EXECUTE GO---
