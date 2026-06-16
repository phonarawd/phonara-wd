# PHONARA 스포츠북 LEGAL GATE — 기획 정본

> **단계:** Planning · **S1 migration 전 필수** · counsel 서면 없이 DDL **0**  
> **상위:** [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) · [`LEGAL_BASIS.md`](LEGAL_BASIS.md)  
> **갱신:** 2026-06-16

---

## 0. Scope (1줄)

스포츠북(토토형 prematch/in-play) vertical 추가 시 [`LEGAL_BASIS.md`](LEGAL_BASIS.md) 전제와 충돌 여부를 **서면으로 확인**하기 위한 operator·counsel 체크리스트.

---

## 1. 왜 re-review가 자동 해당인가

[`LEGAL_BASIS.md`](LEGAL_BASIS.md) § Re-review triggers는 카지노·PHON·출금·Earn 구조 기준이다. 스포츠북은 아래 **신규**에 해당:

| 항목 | 기존 LEGAL 범위 | 스포츠북 추가 시 |
|------|-----------------|------------------|
| 베팅 vertical | 카지노 PF 10종 (의견서 전제) | **스포츠 경기 베팅** — 별도 규제·면허 검토 |
| 수익 구조 | game output → PHON | **sports GGR → PHON payout** 동일 rail이어도 **상품 분류** 재확인 |
| 마케팅 | 카지노·Earn | **스포츠·토토형 카피** — 광고 규제 |
| 제3자 데이터 | 없음 | **odds vendor 계약** — 데이터 사용·재배포 조항 |

**FAIL =** S1 migration · `rpc_place_sports_bet` · 공개 `/sports` 마케팅 중 **본 gate 미통과**

---

## 2. Counsel 질문 목록 (복붙용)

operator가 의견서 작성 시 아래를 **그대로 또는 확장**하여 전달:

### 2.1 상품·규제 분류

1. 스포츠 경기 결과에 PHON을 stake하고 decimal odds로 payout하는 구조가, 기존 카지노 의견서 **동일 면허/등록 범위** 내인가?
2. prematch vs in-play(live) 베팅이 **규제상 구분**되는가? MVP는 prematch only로 시작해도 되는가?
3. 조합 베팅(≤8 leg) · void/refund · push(무효) 처리가 **도박/베팅 규정**상 문제 없는가?

### 2.2 PHON · 원장 · 출금

4. 스포츠 payout이 기존 **PHON credit → withdrawal path**를 그대로 쓸 때, [`LEGAL_BASIS.md`](LEGAL_BASIS.md) § Assumptions와 **모순 없는가**?
5. 스포츠 stake lock/debit가 카지노 wallet RPC와 **동일 ledger**를 쓸 때, virtual asset·선불전자지급수단 분류에 **영향**이 있는가?
6. [`LEGAL_BASIS.md`](LEGAL_BASIS.md) trigger #5(비게임 Earn)와 **스포츠 affiliate GGR 커미션**(Wave-2 이후)은 별도 re-review인가?

### 2.3 데이터·제3자

7. B2B odds feed(Odds-API / Oddsmarket / Betradar) **재표시·지연 배당**에 대한 계약·면책 요건은?
8. 경기 결과·정산 데이터를 vendor에 의존할 때 **소비자 분쟁**(오류 정산) 책임 범위는?

### 2.4 RG · 연령 · 지역

9. 기존 RG(kill switch · 한도)를 스포츠 place에 **동일 적용**하면 충분한가, **추가 한도**가 필요한가?
10. 서비스 **지역·IP·KYC** 제한이 스포츠북에서 **강화**되어야 하는가?
11. 미성년·자기배제 목록과 **스포츠 마케팅** 제한은?

### 2.5 마케팅 · 공개

12. `/sports` 공개 · SEO · noindex 정책(`/partner`와 유사) 중 **법무 권고**는?
13. “실시간 배당”“Bet365급” 등 **비교 광고** 가능 범위는?
14. World Crush presentation layer(FOMO ticker)와 **스포츠 실제 베팅**을 혼동시키지 않기 위한 **필수 고지**는?

---

## 3. Operator 자체 체크 (counsel 전)

| # | 확인 | Y/N | 메모 |
|---|------|-----|------|
| L1 | [`LEGAL_BASIS.md`](LEGAL_BASIS.md) Assumptions 블록 최신인가 | | |
| L2 | 스포츠 GO 전 **면허/등록** 필요 여부 counsel에 질의했는가 | | |
| L3 | MVP = **prematch only**로 법적 리스크를 줄일 계획인가 | | |
| L4 | in-play(S5)는 **별도 서면** 후 착수로 합의했는가 | | |
| L5 | vendor 계약 초안에 **재배포·SLA·오류 정산** 조항 검토 예정인가 | | |
| L6 | Admin void/settle **수동 개입** audit가 규정상 충분한가 | | |

**FAIL =** L2=N 이거나 counsel 서면 없이 S1 착수

---

## 4. Gate 산출물 (통과 시)

| 산출 | 형식 | 보관 |
|------|------|------|
| **Sportsbook legal clearance** | counsel 서면 또는 이메일 **명시 승인** | operator secure |
| **Assumptions addendum** | 스포츠 vertical 전제 3~10줄 | [`LEGAL_BASIS.md`](LEGAL_BASIS.md) 하단 또는 별첨 |
| **Marketing guardrails** | 금지/필수 문구 목록 | `LOVABLE_SPORTSBOOK_UI_LOCK.md` §i18n 연동 |
| **MVP scope lock** | prematch only vs in-play 동시 | [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) §2 |

---

## 5. 트리거 매트릭스 (언제 다시 멈추나)

| 이벤트 | 조치 |
|--------|------|
| S5 in-play 착수 | **re-review** (§2.1 #2) |
| cashout / partial cashout | **re-review** |
| sports affiliate GGR 지급 | [`LEGAL_BASIS.md`](LEGAL_BASIS.md) #5 + re-review |
| PHON withdrawal path 변경 | [`LEGAL_BASIS.md`](LEGAL_BASIS.md) #4 |
| 신규 국가/언어 마케팅 | re-review |
| vendor → 자체 북메이킹 | re-review |

---

## 6. EXECUTE (Planning · operator only)

| Step | 액션 |
|------|------|
| 0 | 본 문서 + [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) 승인 |
| 1 | §2 질문 목록 counsel 전달 |
| 2 | §3 operator 체크 완료 |
| 3 | 서면 clearance 수령 → S1 LOCK에 **날짜·참조번호** 기록 |
| 4 | operator **「스포츠 GO」** (마스터 §10) |
| 5 | S1 migration 착수 허용 |

---

## 7. §GREEN self-check (Planning · clearance 0 허용)

```bash
test -f docs/PHONARA_SPORTSBOOK_LEGAL_GATE.md
rg "PHONARA_SPORTSBOOK_LEGAL_GATE" docs/PHONARA_SPORTSBOOK_MASTER_PLAN.md
rg "[\u4e00-\u9fff]" docs/PHONARA_SPORTSBOOK_LEGAL_GATE.md
rg "S1 migration" docs/PHONARA_SPORTSBOOK_LEGAL_GATE.md
```

**FAIL =** LEGAL 생략 문구 · S1 전 counsel 없이 GO 허용 · CJK(중/일) hit

---

## 8. Defer

- 구체적 면허 번호·관할 — counsel 답변 후 기입
- 국가별 스포츠 법률 비교표 — MVP jurisdiction 확정 후

---

## 9. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | 초판 — counsel 질문 · operator 체크 · gate 산출 |

---

*Planning 정본 · S1 DDL은 clearance + 「스포츠 GO」 후 only*
