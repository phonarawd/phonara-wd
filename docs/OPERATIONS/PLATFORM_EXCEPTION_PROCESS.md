# Platform Exception Process (§50)

> **날짜:** 2026-07-13 · Playbook 1.0.0  
> **용도:** SOP 일시 우회 템플릿. 「빠른 출시」는 예외 사유 **아님**.

## 절차

1. Exception ID 발급 (`EXC-YYYYMMDD-NN`)
2. 사유 · 범위 · 만료 시각 · 영향 Domain 기록
3. RACI: Security Owner + Product Owner **공동 A** (Runtime C)
4. 허용 우회만 명시 (Freeze 중 Critical 패치 · Standing Grant 임시 확대 · 단일 Stage 병합 등)
5. 만료 후 자동 종료 · 사후 Finding/Risk/ADR · Evidence 90일 보관

## 우회 불가 (Exception으로도 금지)

- Money Σ=0 파괴
- No Shortcut (stub / `as any` / fake data)
- REFERENCE (`PLATFORM_AUDIT_REFERENCE`) 본문 수정
- `main` 직접 push
- Supabase 단일 프로젝트 잠금 우회

## 템플릿

```yaml
id: EXC-YYYYMMDD-01
status: REQUESTED # REQUESTED|APPROVED|ACTIVE|EXPIRED|REJECTED
reason: ""
scope: ""
domains: []
expires_at: ""
allowed_bypasses: []
denied_always: ["money-sigma", "no-shortcut", "reference-edit", "main-push"]
approvals:
  security: { by: "", at: "" }
  product: { by: "", at: "" }
runtime_consulted: { by: "", at: "" }
evidence_uri: ""
postmortem_finding_or_risk: ""
```

승인 없는 우회 = FAIL · 다음 RC Gate Block.
