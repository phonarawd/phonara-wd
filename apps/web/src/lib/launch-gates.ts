/**
 * Launch exposure gates for Phase B3.
 *
 * These flags only control browser exposure. Engine/RPC paths remain intact for
 * CI, admin review, and post-launch verification.
 */
export const LAUNCH_GATES = {
  cryptoRails: false,
  /** SB-W3 — prematch place live (operator-approved Wave 3; live betting stays flag-off). */
  sportsBetting: true,
  sportsComboBetting: false,
  sportsSystemBetting: false,
  /** SB-W3 — full cashout card live with prematch betting (operator-approved Wave 3). */
  sportsCashout: true,
  notificationsCenter: false,
  tierGuide: false,
  /** E1 — tier auto-decay engine + tier_decay_warning pref exposure on `/settings/notifications`. */
  tierDecayEngine: true,
  /** E2 — mission catalog engine (list/upsert RPC). */
  missionCatalogEngine: true,
  /** E2 GATE — `/admin/earn/missions` write UI unlock (`ew-e2-gate-missions`). */
  missionCatalogWrite: true,
  /** E3 — viral leaderboard + CMS targeting/schedule + viral analytics engine. */
  viralCmsEngine: true,
  /**
   * E3 GATE — `/referral/leaderboard` engine unlock (`ew-e3-gate-cms-promotions`).
   * E5 (`ew-e5-gap-surfaces-wire`) wires rank list UI to `rpc_get_affiliate_rank_leaderboard`.
   */
  referralLeaderboardLive: true,
  /**
   * E3 GATE — `/admin/promotions` · `/admin/cms` targeting/schedule path unlocked.
   * Full desk UI = E6 (`ew-e6-admin-desks-wave`).
   */
  adminCmsPromotions: true,
  /** E3 GATE — `/announcements` full CMS notice list (targeting-aware RPC). */
  announcementsFull: true,
  /** E4 — Option B tier summary + Prime Elite + caps engine. */
  tierOptionBEngine: true,
  /**
   * E4 GATE — trade/sports fee discount % display truth.
   * WAVE kept false (badge-only); GATE unlocks after remote verify.
   */
  tierFeeDisplayTruth: true,
  /**
   * E4 GATE — `/admin/tiers` · user tier write UI unlock.
   * WAVE shipped RPC + hook; GATE unlocks controls.
   */
  adminTierWrite: true,
  /**
   * E4 GATE — `/sports/vip` surface unlock (eligibility + engine ready).
   * E5 (`ew-e5-gap-surfaces-wire`) opens shared-fixture browse for Platinum+.
   */
  sportsVipSurface: true,
  /**
   * E4 GATE — `/tier/elite` Prime Elite surface unlock (engine ready).
   * Full elite page route may follow; Option B summary RPC is live.
   */
  tierEliteSurface: true,
  /** E7 — co-mission + whale threshold engine (RPCs live). */
  socialCoMissionEngine: true,
  /**
   * E7 GATE — social missions UI unlock (`ew-e7-gate-engine-wave`).
   * WAVE kept false; GATE unlocks after remote verify.
   */
  socialMissionsLive: true,
  /** E21 — hedge position mode + reduce-only engine (RPCs live). */
  tradeHedgeReduceOnlyEngine: true,
  /**
   * E21 UI — hedge · reduce-only · Tier-B display live unlock.
   * WAVE/GATE kept false; `ew-e21-ui-trade-engine-unlocks` flips after remote verify.
   */
  tradeParityLive: true,
  /** E22 — partial cashout · odds acceptance · correct_score · catalog engine. */
  sportsParityEngine: true,
  /**
   * E22 UI — partial cashout · odds policy · correct score live unlock.
   * GATE unlocked built_hidden path; `ew-e22-ui-sports-parity-unlocks` flips live.
   */
  sportsParityLive: true,
  /** E23 — progressive rounds · live crash · PF seed engine. */
  casinoLiveEngine: true,
  /**
   * E23 UI — live crash stage · progressive mines/hilo/blackjack · fairness seed controls.
   * `ew-e23-ui-casino-live-unlocks` flips after GATE remote verify.
   */
  casinoLiveLive: true,
  /** E8 — P2P transfer · trading API keys · giftcard redeem reverse engine. */
  financialConnectivityEngine: true,
  /**
   * E8/E10 UI — `/wallet/transfer` · API keys hub · redeem reverse wire.
   * `ew-e10-wallet-settings-ui` flips after GATE remote verify.
   */
  financialConnectivityLive: true,
  /** E9 — SIWE · support tickets · product analytics · app-install · tier LB engine. */
  identitySupportEngine: true,
  /**
   * E9/E10 UI — SIWE login surface live unlock.
   * WAVE keeps false; GATE remote + login wire unlock.
   */
  siweLoginLive: false,
  /**
   * E9/E10 UI — `/support/ticket` live unlock.
   * `ew-e10-trust-support-ui` flips after E9 engine + admin desk.
   */
  supportTicketsLive: true,
  /**
   * E9/E10 UI — `/tier/leaderboard` live unlock.
   * `ew-e10-trust-support-ui` flips after E9 engine remote verify.
   */
  tierLeaderboardLive: true,
  /**
   * E10 UI — public `/status` surface live unlock.
   * `ew-e10-trust-support-ui` flips presentation status page.
   */
  systemStatusLive: true,
  /**
   * E9/E10 UI — app-install mission hub tab live unlock.
   * `ew-e10-growth-ui` flips growth tab app-install mission live.
   */
  appInstallMissionLive: true,
  /**
   * E10 UI — Kakao Talk share augment on `/referral/invite`.
   * Web Share API remains canonical; SDK is progressive enhancement.
   */
  kakaoShareSdkLive: true,
  /** E10 — KRW proof · mission chains · co-bet · recommend engine. */
  platformEngine: true,
  /**
   * E10 UI — KRW deposit proof upload live unlock.
   * `audit-r2d-krw-proof-wire` (M-21) flips after typed attach RPC wire.
   */
  krwDepositProofLive: true,
  /**
   * E10 UI — mission chain hub unlock on `/home/missions`.
   * WAVE keeps false; growth/missions UI unlock.
   */
  missionChainsLive: false,
  /**
   * E10 UI — co-bet sports social unlock.
   * WAVE keeps false; sports social UI unlock.
   */
  coBetLive: false,
  /**
   * E10 UI — rule-based mission recommend carousel unlock.
   * WAVE keeps false; earn hub unlock.
   */
  mlMissionRecommendLive: false,
} as const;
