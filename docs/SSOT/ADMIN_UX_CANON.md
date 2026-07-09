# Admin UX Canon (D3)

> **상태:** D3 narrative complete (2026-06-30)  
> **Authority:** [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) (Phase R) · Decision 013  
> **Master map:** [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md) §Admin  
> **Blueprint:** [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md) §Admin  
> **Routes:** [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md) `/admin/*`  
> **User↔Admin:** [`docs/PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md`](../PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md)

D3 Admin Canon은 **1인 operator**가 초보자도 **오늘 처리할 예외**를 즉시 파악하고, high-risk action을 **reason + audit**으로 처리하도록 운영 UX grammar를 고정합니다.

**33차:** 초등학생도 읽을 수 있는 메뉴·버튼 = [`ADMIN_BEGINNER_LANGUAGE_CANON.md`](ADMIN_BEGINNER_LANGUAGE_CANON.md) · 팀 권한 = [`ADMIN_TEAM_RBAC_CANON.md`](ADMIN_TEAM_RBAC_CANON.md) · Plan §29.5 · §32.6

---

## 1. 목표 경험

Exception queue 우선 — normal dashboard보다 **“오늘 해야 할 일”**이 첫 화면 primary surface.  
High-risk = reason + confirmation + audit. Grafana/Stripe/Supabase Studio 수준의 scan · filter · drill-down.

---

## 2. 운영 철학

| 원칙               | 설명                                             |
| ------------------ | ------------------------------------------------ |
| **1인 운영**       | 기본 operator 1명 · role 확장 가능 구조          |
| **99% automation** | 정상 경로 자동 — admin은 예외만                  |
| **초보 operator**  | 전문용어 최소 · 버튼 이름만 봐도 이해            |
| **클릭 최소**      | 가능하면 한 화면에서 처리                        |
| **High-risk**      | confirmation dialog · server permission feedback |
| **Audit**          | 모든 manual action → reason field + audit row    |

---

## 3. 첫 화면 우선순위

```text
오늘 해야 할 일
→ 처리 안 된 출금
→ 입금 확인
→ 회원 문의
→ 이상 거래
→ 오류/실패 작업
→ 오늘 매출/정산 요약
```

- **Exception queue** = primary surface (`/admin/queues` · overview)
- **KRW deposit recon (E1a):** `WalletDeskDepositRecon` — match (`rpc_admin_match_krw_deposit`) · flag (`rpc_admin_flag_deposit`) · reason≥4 · AAL2 · audit — contract [`REBUILD_ENGINE_SSOT.md`](REBUILD_ENGINE_SSOT.md) §E1a
- Summary metrics = secondary — queue empty일 때만 hero
- 실패/오류 row: **왜** · **무엇을 해야 하는지** (i18n-backed operator copy)

---

## 4. Operator language (한국어 업무어)

Technical term → operator-facing label (admin locale / i18n):

| Technical             | Operator-facing    |
| --------------------- | ------------------ |
| Settlement Queue      | 출금 대기          |
| Compliance Review     | 확인이 필요한 회원 |
| Risk Flag             | 이상 거래          |
| AML Review            | 신원/거래 확인     |
| Manual Reconciliation | 입금 확인          |

**33차 초등어 정본:** [`ADMIN_BEGINNER_LANGUAGE_CANON.md`](ADMIN_BEGINNER_LANGUAGE_CANON.md) — 위 표는 내부 매핑용 · **화면에는 초등어 열만** (예: 「이상 거래」「처리 대기함」).

Financial/admin copy: **emoji 0** · numeric first ([`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)).

---

## 5. Required UX patterns

| Pattern         | Rule                                                                                  |
| --------------- | ------------------------------------------------------------------------------------- |
| Exception queue | Primary nav destination · filter · sort · bulk-safe where RPC allows                  |
| Manual action   | **Reason field required** · audit row persisted                                       |
| High-risk       | Confirm dialog · double-check amount/user · server rejects unauthorized               |
| Permission      | Server-trusted RPC/RLS — UI hide-only **금지**                                        |
| Tables          | Filter · search · scan-optimized · empty = “처리할 항목 없음” + next check hint       |
| Failure states  | Error code → stable operator message · remediation steps                              |
| Deposit review  | [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) status grammar와 1:1 |

---

## 6. Mobile / tablet

Secondary but usable:

- Nav collapses · queue remains reachable
- Tables → searchable lists on narrow viewports
- High-risk flow unchanged (no skip confirm on mobile)

---

## 7. Engine boundary

- Admin RPC · hooks · permissions **변경 금지** (UI reset scope)
- U7 착수 전: admin hook structure vs web freeze pattern 검증 — admin-specific contract in [`FREEZE_MANIFEST.md`](FREEZE_MANIFEST.md) if needed
- Correspondence matrix 1:1 surfaces preserved

---

## 8. Forbidden

- Jargon-only screens (operator must decode English internal terms)
- Action without reason
- Hidden audit trail
- Permission by UI hide only (must fail on RPC for unauthorized)
- Dense table with no filtering/search

---

## 9. Completion signals (U7 Admin)

- [ ] “오늘 해야 할 일” queue is admin landing primary
- [ ] Withdrawal · deposit review · risk exception rows drill-down in ≤3 clicks
- [ ] Every manual action: reason + audit evidence (E2E or SQL test operator/CI)
- [ ] High-risk: confirmation + negative auth path
- [ ] Operator language table applied to nav/queue labels
- [ ] Correspondence matrix rows have matching admin surface

---

## 교차 참조

| 주제                            | 문서                                                             |
| ------------------------------- | ---------------------------------------------------------------- |
| Payment review                  | [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) |
| Unified confirm pattern         | [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)                     |
| Product tone (admin audit zone) | [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md)                 |
