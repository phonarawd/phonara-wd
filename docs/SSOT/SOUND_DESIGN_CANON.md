# Sound Design Canon (§34.27 · DA W8 DOC)

> **상태:** Active SSOT · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `da-w8-sound-design-spec-defer` (#227)  
> **선행:** `da-w8-signature-surfaces-bundle` (#226) **`[x]`**  
> **후행 GATE:** `da-w8-gate-signature-experience` (#228) **`[x]`**  
> **구현:** **E-Wave defer** — Track A는 **문서·계약만** · Web Audio wire **금지**  
> **코드 계약:** [`da-w8-sound-design-display-contract.ts`](../../apps/web/src/domain/da-w8-sound-design-display-contract.ts)  
> **엔진 경계:** presentation policy only — money/RPC/ledger **0**

본 문서는 Digital Aurora **시그니처 사운드 4종** 정본이다.  
카지노 승리 큐는 **범위 밖** — [`CASINO_UX_CANON`](CASINO_UX_CANON.md) · Plan **§23.8** · `casino-sound.ts` 정본.

---

## 1. 범위 (과하지 묶음 · non-waivable)

| 포함 (4종)                                     | 제외                                    |
| ---------------------------------------------- | --------------------------------------- |
| **mission** · **wallet** · **trade** · **vip** | Casino win cue (§23.8 이미 존재)        |
| 톤 성격 · 트리거 · 길이 · opt-in · a11y        | Sports kickoff SFX · lobby BGM · haptic |
| E-Wave 구현 체크리스트                         | Track A UI wire · 신규 npm audio lib    |

**FAIL:** Track A에서 4종 AudioContext wire · casino와 동일 파일에 4종 합치기 · loop BGM · L2 submit 중 decorative SFX.

---

## 2. 글로벌 규칙

| 규칙                       | 정본                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------ |
| **기본값**                 | **off** (opt-in) — casino `settings.casino.soundEffects`와 동일 철학                 |
| **prefers-reduced-motion** | reduce → **전부 off**                                                                |
| **AudioContext**           | 단일 lazy · 첫 user gesture 후 · E-Wave에서 casino 패턴 재사용 가능                  |
| **길이**                   | cue ≤ **220ms** · loop **0** · 동시 재생 ≤1                                          |
| **볼륨**                   | gain ≤ **0.05** (whisper) — 거래소/지갑 방해 금지                                    |
| **L2 Financial**           | withdraw · bet · order **submit 순간** = SFX **금지** (결과 toast/confirm 후만 허용) |
| **Money**                  | SFX는 금액·odds·payout을 **재계산하지 않음** — RPC 표시만                            |
| **dep**                    | Web Audio API only · Howler/Tone.js 등 **ADR 없이 금지** (§34.30)                    |

설정 키 (E-Wave 예약 · Track A 미도입):

| Tone    | Pref key (예약)                                               |
| ------- | ------------------------------------------------------------- |
| mission | `phonara.settings.sound.mission`                              |
| wallet  | `phonara.settings.sound.wallet`                               |
| trade   | `phonara.settings.sound.trade`                                |
| vip     | `phonara.settings.sound.vip`                                  |
| master  | `phonara.settings.sound.enabled` (마스터 off면 4종 전부 mute) |

---

## 3. 4종 톤 스펙

Emotion Map ([`PRODUCT_EXPERIENCE_CANON`](PRODUCT_EXPERIENCE_CANON.md) §2) · Toast Zone ([Plan §3.2](../PRODUCT/REBUILD_PLAN_v1.md))과 정렬.

| ID          | Surface                     | 목표 감정       | 음색 (서술)                    | 허용 트리거                                       | 금지                                                    |
| ----------- | --------------------------- | --------------- | ------------------------------ | ------------------------------------------------- | ------------------------------------------------------- |
| **mission** | `/home` · `/home/missions*` | 성취·기대(절제) | soft warm sine · 짧은 상승 2음 | mission claim success · attendance check-in       | false urgency loop · 매 스크롤 chime                    |
| **wallet**  | `/wallet*` · ledger confirm | 안정·통제       | soft confirm thud · 저역 1타   | deposit confirmed · withdraw **submitted** (결과) | withdraw **submit 버튼 누름** 순간 · fake urgency pulse |
| **trade**   | `/trade*`                   | 집중·전문       | crisp tick · exchange click    | order **accepted** · fill toast (Zone B)          | casino-style flash · every book tick                    |
| **vip**     | `/tier/me` · tier upgrade   | 승급 축하(절제) | soft ascending arpeggio ≤3음   | tier upgrade celebration only                     | XP tick every point · Decay 허위 완료음                 |

**Zone 정렬:**

| Tone           | Toast Zone | 이모지/카피                       |
| -------------- | ---------- | --------------------------------- |
| mission · vip  | A warm     | SFX ≠ copy — i18n toast 정본 유지 |
| wallet · trade | B strict   | SFX whisper · emoji **0**         |

---

## 4. E-Wave 구현 체크리스트 (Track A 금지)

```text
[ ] settings UI — master + 4 toggles (default off)
[ ] shared AudioContext helper (casino-sound 패턴 확장 또는 sibling)
[ ] playMissionCue / playWalletCue / playTradeCue / playVipCue
[ ] reduced-motion + master off → no-op
[ ] L2 submit path에 SFX 호출 0 (grep gate)
[ ] vitest: pref off · reduced-motion · cue length contract
[ ] gate:ai-impl owner path · check:release
```

**Unlock 조건:** Track B E-Wave 세션에서 operator가 본 canon을 선행 문서로 지정한 뒤만 wire.  
YAML id 후보: E-Wave UI unlock todo (신규 id는 Track B 재정렬 시) — **본 DOC todo는 구현을 열지 않음**.

---

## 5. Casino 경계 (§23.8)

| 항목     | 정본                                                  |
| -------- | ----------------------------------------------------- |
| Win cue  | `apps/web/src/product/surfaces/games/casino-sound.ts` |
| Pref     | `SETTINGS_CASINO_SOUND_PREF_KEY` · default off        |
| 범위     | big/mega tier only · oscillator beep                  |
| 본 canon | **교차 참조만** — 4종에 casino 합치지 않음            |

---

## 6. FAIL

- Track A에서 4종 SFX 구현·번들
- casino-sound에 mission/wallet/trade/vip 합치기
- default on · loop music · L2 submit SFX
- guaranteed-win / false urgency 연출음
- Emotion Map 금지 감정과 충돌하는 과한 fanfare

---

## 교차 참조

| 주제               | 문서                                                            |
| ------------------ | --------------------------------------------------------------- |
| Emotion Map        | [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md) §2 |
| Signature surfaces | `da-w8-signature-surfaces-display-contract.ts` (§34.21–34.26)   |
| Casino sound       | Plan §23.8 · `casino-sound.ts`                                  |
| Motion L2          | PRODUCT_EXPERIENCE_CANON §5 · ADR-009                           |
| Copy / toast       | [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md) · Plan §3.2      |
