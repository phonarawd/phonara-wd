# PHONARA Legal Basis Record

> **Wave 12 STOP gate:** Implementation must remain consistent with the assumptions recorded below. If a shipped change requires deviating from these assumptions, stop launch prep and obtain updated legal review before proceeding.

---

## Opinion metadata

| Field               | Value                                                 |
| ------------------- | ----------------------------------------------------- |
| Law firm / attorney | [사용자 기입]                                         |
| Opinion date        | [사용자 기입]                                         |
| Status              | Written legal opinion finalized (per operator record) |

---

## Assumptions (verbatim from opinion)

[사용자가 의견서 전제사실 그대로 전사]

---

## Three-line conclusion (implementation alignment)

1. **Casino output ↔ PHON ↔ withdrawal path structure** — The reviewed product structure (game/casino outputs credited as PHON, withdrawal path as designed) is within the scope approved under the assumptions above.
2. **PHON is not a virtual asset** — Under the reviewed assumptions, PHON is not treated as a virtual asset for regulatory classification purposes covered by the opinion.
3. **Written legal opinion finalized** — A formal written opinion has been received; this document records its operational linkage only. Legal text lives in the opinion itself and in the placeholders above.

---

## Re-review triggers

Re-engage legal counsel **before** shipping or publicly marketing any change that touches:

1. **PHON external exchange listing** or formal listing preparation (CEX/DEX or equivalent).
2. **PHON P2P transfer between users** (wallet-to-wallet user transfers outside existing product flows).
3. **Direct PHON ↔ other crypto asset swap** (on-platform or advertised off-platform path).
4. **Withdrawal path changes** — refund ratio, target asset, rail, or settlement structure changes.
5. **Structural changes to non-game earning paths** — new reward classes, referral/affiliate economics changes, or other earning surfaces not covered by the original assumptions.

Each trigger requires an updated written opinion or explicit written clearance before Wave 12 launch decisions.

---

## Wave 12 linkage

- `docs/RUNBOOK.md` §4 (withdrawal activation checklist) requires confirming this document’s assumptions still match the deployed product.
- Marketing / public copy must not contradict the assumptions block above (see human decision item 5 in the closeout report).
- If engineering discovers a required change that contradicts an assumption, **STOP** — do not enable withdrawals or expand marketing until legal re-review completes.
