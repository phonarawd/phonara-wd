# Auth UX Canon (D1)

> **상태:** D1 narrative SSOT (2026-06-30)  
> **Master map:** [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md) §Login/Auth  
> **Blueprint:** [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md) §Auth  
> **Routes:** `/login` · `/signup` · `/reset-password` · `/auth/callback` — [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md)

## 목표 경험

절제된 신뢰감 — 사용자가 credentials 입력·오류 복구·가입/비밀번호 재설정을 **form hierarchy만으로** 완료한다. marketing layer 없이 **계정·보안 신뢰**를 전달하고, U1 Auth pilot의 **첫 surface sign-off** 기준이다.

## Reference

**Primary:** Apple  
**Secondary:** Notion · Linear

Pattern only — proprietary branding · copy · artwork clone **금지**.

---

## Layout canon

#### Desktop

- Centered form column · minimal chrome · trust cue (brand/security)
- Clear page title · labeled inputs · primary CTA full-width in column
- Secondary actions (signup · reset) below primary — not competing visually
- Inline errors adjacent to fields · loading on CTA without layout jump

#### Mobile

- Single column · thumb-safe primary CTA (min 48px touch)
- Recovery links visible without scroll hunt
- Keyboard-safe — focus order login → password → submit

---

## Required modules

Brand/Trust Cue · Auth Inputs (email/password/passkey/magic-link as wired) · Primary CTA · Secondary Links (signup/reset) · Inline Error · Loading State · Recovery Flow · Security/Privacy Cue · Session redirect handling (`/auth/callback`)

---

## Priority order

1. Where am I / what am I doing (login vs signup vs reset)
2. Credentials or auth method entry
3. Error recovery (inline + retry path)
4. Alternate paths (signup · reset · support)
5. Legal/privacy links (secondary)

---

## Interaction · density · trust

| Dimension     | Rule                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------- |
| **Density**   | Low — one primary action per screen                                                                |
| **Hierarchy** | trust cue → title → inputs → primary CTA → secondary                                               |
| **Trust**     | show only supported auth methods; unsupported = disabled + reason, not hidden                      |
| **Recovery**  | forgot password always visible on login                                                            |
| **Motion**    | submit loading · field shake/error — [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) reduced-motion |

---

## Engine boundary

- Auth controller/session/RPC **signature unchanged** (UI reset)
- Display server error codes via i18n — no inline Korean/English in JSX
- Passkey/magic-link/OAuth: wire existing hooks only — no parallel auth stack

---

## Forbidden

- Mockup shell · excessive marketing hero above form
- Hidden recovery · toast-only errors without field context
- Parallel `LoginV2` / `ModernAuth` routes or components
- Inline hardcoded user-facing strings

---

## Completion signals

- Fast entry on mobile and desktop
- Clear recovery without support ticket for common cases
- Accessible labels · focus · contrast
- U1 pilot: `gate:ai-impl -- --test <auth-surface-vitest>` green
- Operator visual sign-off on `/login` before broad U-phase rollout (Phase R auth pilot — [`AUTH_UX_CANON.md`](AUTH_UX_CANON.md))
