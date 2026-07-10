# UX_AUDIT — PHONARA Phase R

> **날짜:** 2026-07-11  
> **모드:** READ-ONLY 정적 감사  
> **대상:** ChatGPT UI/UX Director

---

## 1. IA — 5탭 (non-waivable)

```
Earn (/home) | Wallet | Trade | Sports | Casino
```

| 규칙 | 내용 |
|------|------|
| Subnav owner | `AppShell` only — surface 내부 `HorizontalSubnav` 금지 |
| Cross-domain | navigate CTA만 — embed 금지 |
| Earn desktop | side nav / rail |
| Mobile chrome | TopBar + BottomNav + domain subnav |
| Account / Settings / Legal | BottomNav 밖 · TopBar / deep link |

도메인 경계 SOT: `apps/web/src/product/shell/surface-domain-boundary.ts`

---

## 2. 핵심 플로우

### 2.1 회원가입

```
Landing CTA → /signup → (verify-email) → /home 또는 onboarding
```

- AB variant로 CTA/브랜드 라인 키 분기
- i18n 키만 · Confirm/에러 패널 문법 존재

### 2.2 로그인

```
/login → session → 직전 도메인 또는 /home
```

- password / passkey / magic-link 와이어 (P3 이후)
- reset-password · auth/callback 별도

### 2.3 입금

```
BottomNav Wallet → /wallet → /wallet/deposit → crypto | KRW | giftcard → ConfirmDialog
```

- 방법 카드 (`deposit-payment-method-card`)
- MoneyDisplay 표시만 (재계산 금지)

### 2.4 출금

```
/wallet/withdraw → crypto | KRW → tier limits card → ConfirmDialog
```

- RG / KYC 게이트 UI 상태 1급

### 2.5 거래 (Spot / Futures)

```
/trade | /trade/futures
→ (첫 방문) education sheet
→ chart + book + ticket
→ ConfirmDialog
→ realtime toast / fills
```

- 모바일: tabs + sticky CTA
- 차트/WS = display-only

### 2.6 스포츠

```
/sports → live | prematch | fixture → bet slip → Confirm
/sports/rules · /sports/vip(stub) · /sports/my-bets
```

### 2.7 카지노

```
/casino lobby → /games/:code
→ CasinoGameShell (stake · AutoBet · PF · WinTier)
→ stage = PLACEHOLDER (deferred)
```

**UX 치명:** 베팅 chrome은 있으나 결과 비주얼 루프가 stage에서 끊김.

### 2.8 미션 · 출석 · 온보딩

```
/home/missions* · /home/attendance · /onboarding*
```

- MissionCard / RoutineCard / ProgressRing
- Earn Tab1 mission badge (optional)

### 2.9 설정 · 프로필 · 보안 · KYC · RG

```
/settings* · /account/profile · kyc · responsible-gaming
```

- Preferences: theme light/dark
- Security: MFA 등
- RG: ConfirmDialog 고위험 액션

### 2.10 Admin

```
Login → MFA → exception queues
→ deposits/withdrawals/risk/sports settle
→ reason + audit dialog
```

---

## 3. 클릭 깊이 (대략)

| 목표 | 탭/스텝 |
|------|---------|
| Earn → 미션 | 1–2 |
| Wallet → 크립토 입금 Confirm | 3–4 |
| Trade → 지정가 Confirm | 2–3 (desk) / 3–4 (mobile) |
| Casino → 베팅 UI | 2 · stage 피드백 약함 |
| Admin 출금 승인 | 2–3 + reason |

---

## 4. UX 문제점

| ID | 문제 | 심각도 | 비고 |
|----|------|--------|------|
| U1 | Casino stage placeholder — 플레이 피드백 단절 | P0 | 12게임 공통 |
| U2 | Sports VIP stub | P1 | 기대 불일치 |
| U3 | Landing first-fold 과밀 | P1 | hero budget |
| U4 | Trade mobile 인지부하 | P1 | tabs+sticky+desk |
| U5 | Fiat hint `#205` BLOCKED | P1 | 머니 신뢰 |
| U6 | Earn→Casino navigate-only 맥락 단절 | P2 | 의도적 격리 |
| U7 | Admin/Web 시각·카피 톤 불일치 가능 | P2 | shim |

---

## 5. 상태 문법 (노출 규칙 §32.7)

| 상태 | 패턴 |
|------|------|
| 가능 | 동작 컨트롤 |
| 불가 | disabled + reason (또는 hidden) |
| 로딩 | Skeleton |
| 에러 | ErrorPanel / banner + retry |
| 빈 | EmptyState |
| 잔액 0 | ZeroBalanceState |

**Dead control 0** — deferred stage는 카피로 완화 중이나 시각적으로는 빈 카드.

---

## 6. 개선 우선순위 (UX)

1. Casino L1 stage (Pixi/canvas) × 12 — 피드백 루프 복구  
2. `#205` fiat hint session lock  
3. Sports VIP 실표면  
4. Landing fold 절제  
5. Trade mobile IA 단순화  
6. Onboarding → 첫 Earn 미션 직선화  
)
