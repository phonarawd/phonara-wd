# RPC Usage Matrix

> Generated: 2026-07-13T00:43:27.782Z  
> SOT: `packages/shared-types/src/database.types.ts` Functions `rpc_*`  
> Call sites: `apps/web` · `apps/admin` (`callRpc` / `supabase.rpc` / string constants)

## Summary

| Metric                         | Count |
| ------------------------------ | ----: |
| Types `rpc_*`                  |   256 |
| Called from apps (∩ types)     |   144 |
| Types but **no app call site** |   112 |
| App call sites not in types    |     3 |
| Total call-site rows           |   215 |

## Matrix (types ∩ apps)

| RPC                                                 | web | admin | call sites | sample file                                                                      |
| --------------------------------------------------- | --: | ----: | ---------: | -------------------------------------------------------------------------------- |
| `rpc_accept_co_bet`                                 |   0 |     0 | **unused** | —                                                                                |
| `rpc_accept_co_mission`                             |   0 |     0 | **unused** | —                                                                                |
| `rpc_ack_ops_alert`                                 |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:33                                                  |
| `rpc_add_withdrawal_address`                        |   1 |     0 |          1 | apps/web/src/features/wallet/use-crypto-withdraw.ts:47                           |
| `rpc_adjust_isolated_margin`                        |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:49                           |
| `rpc_admin_approve_giftcard_deposit`                |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminWalletDesk.ts:329                             |
| `rpc_admin_flag_deposit`                            |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminWalletDesk.ts:392                             |
| `rpc_admin_fulfill_giftcard_redeem`                 |   0 |     0 | **unused** | —                                                                                |
| `rpc_admin_get_ops_dashboard`                       |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:57                                                  |
| `rpc_admin_get_product_analytics`                   |   0 |     0 | **unused** | —                                                                                |
| `rpc_admin_get_viral_analytics`                     |   0 |     2 |          2 | apps/admin/src/hooks/admin/useAdminEarnActivityDesk.ts:36                        |
| `rpc_admin_halt_market`                             |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:123                                                 |
| `rpc_admin_list_alert_thresholds`                   |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:68                                                  |
| `rpc_admin_list_casino_catalog`                     |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminCasinoDesk.ts:239                             |
| `rpc_admin_list_cms_content`                        |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminCmsDesk.ts:113                                |
| `rpc_admin_list_exception_queue`                    |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:61                                                  |
| `rpc_admin_list_giftcard_fee_market`                |   0 |     0 | **unused** | —                                                                                |
| `rpc_admin_list_linked_device_users`                |   0 |     0 | **unused** | —                                                                                |
| `rpc_admin_list_mfa_policy`                         |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminMfaPolicyDesk.ts:125                          |
| `rpc_admin_list_mission_catalog`                    |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminMissionsDesk.ts:29                            |
| `rpc_admin_list_outcome_liability`                  |   0 |     0 | **unused** | —                                                                                |
| `rpc_admin_list_role_grants`                        |   0 |     2 |          2 | apps/admin/src/hooks/admin/useAdminOperatorRbac.ts:38                            |
| `rpc_admin_list_sports_exposure`                    |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminSports.ts:141                                 |
| `rpc_admin_list_sports_risk_events`                 |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminSports.ts:142                                 |
| `rpc_admin_list_staking_pools`                      |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminStakingDesk.ts:85                             |
| `rpc_admin_list_support_tickets`                    |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminSupportDesk.ts:173                            |
| `rpc_admin_list_trade_market_breakers`              |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:115                                                 |
| `rpc_admin_list_unsettled_sports_fixtures`          |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminSports.ts:140                                 |
| `rpc_admin_list_users`                              |   0 |     3 |          3 | apps/admin/src/hooks/admin/useAdminRewardsDesk.ts:101                            |
| `rpc_admin_manual_wallet_adjust`                    |   0 |     2 |          2 | apps/admin/src/hooks/admin/useAdminRewardsDesk.ts:147                            |
| `rpc_admin_match_crypto_deposit`                    |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminWalletDesk.ts:354                             |
| `rpc_admin_match_krw_deposit`                       |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminWalletDesk.ts:335                             |
| `rpc_admin_rebase_resume_market`                    |   0 |     0 | **unused** | —                                                                                |
| `rpc_admin_reject_giftcard_redeem`                  |   0 |     0 | **unused** | —                                                                                |
| `rpc_admin_release_self_exclusion`                  |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminUsersDesk.ts:187                              |
| `rpc_admin_resolve_support_ticket`                  |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminSupportDesk.ts:215                            |
| `rpc_admin_resume_sports_market`                    |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminSports.ts:211                                 |
| `rpc_admin_review_krw_deposit_proof`                |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminWalletDesk.ts:419                             |
| `rpc_admin_set_alert_threshold`                     |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:78                                                  |
| `rpc_admin_set_casino_game_status`                  |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminCasinoDesk.ts:295                             |
| `rpc_admin_set_mfa_policy`                          |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminMfaPolicyDesk.ts:162                          |
| `rpc_admin_set_role_grant`                          |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminTeamDesk.ts:169                               |
| `rpc_admin_set_sports_risk_tier`                    |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminSports.ts:274                                 |
| `rpc_admin_set_staking_pool_active`                 |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminStakingDesk.ts:100                            |
| `rpc_admin_set_user_activity`                       |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminUsersDesk.ts:154                              |
| `rpc_admin_set_user_earn_vip_tier`                  |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminUserTierDesk.ts:98                            |
| `rpc_admin_settle_sports_fixture_quorum`            |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminSports.ts:235                                 |
| `rpc_admin_suspend_sports_market`                   |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminSports.ts:191                                 |
| `rpc_admin_trade_exposure_summary`                  |   0 |     0 | **unused** | —                                                                                |
| `rpc_admin_upsert_cms_content`                      |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminCmsDesk.ts:136                                |
| `rpc_admin_upsert_giftcard_fee_market`              |   0 |     0 | **unused** | —                                                                                |
| `rpc_admin_upsert_mission_catalog`                  |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminMissionsDesk.ts:38                            |
| `rpc_admin_void_game_bet`                           |   0 |     0 | **unused** | —                                                                                |
| `rpc_approve_affiliate_commission`                  |   0 |     2 |          2 | apps/admin/src/hooks/admin/useAdminEarnDesk.ts:127                               |
| `rpc_approve_withdrawal`                            |   0 |     1 |          1 | apps/admin/src/domain/queues.ts:43                                               |
| `rpc_attach_krw_deposit_proof`                      |   1 |     0 |          1 | apps/web/src/domain/wallet.ts:47                                                 |
| `rpc_cancel_game_bet`                               |   0 |     0 | **unused** | —                                                                                |
| `rpc_cancel_order`                                  |   1 |     0 |          1 | apps/web/src/hooks/use-trading.ts:1158                                           |
| `rpc_cancel_spot_order`                             |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:40                           |
| `rpc_cashout_sports_bet`                            |   1 |     0 |          1 | apps/web/src/features/sports/use-sports-betting.ts:360                           |
| `rpc_check_casino_rtp_drift`                        |   0 |     0 | **unused** | —                                                                                |
| `rpc_check_onboarding_consent`                      |   2 |     0 |          2 | apps/web/src/hooks/use-client-gate-prechecks.ts:45                               |
| `rpc_check_reserve_ratio`                           |   0 |     0 | **unused** | —                                                                                |
| `rpc_claim_daily_reward`                            |   1 |     0 |          1 | apps/web/src/features/earn/use-home-attendance-page-controller.ts:199            |
| `rpc_claim_repeatable_mission`                      |   1 |     0 |          1 | apps/web/src/features/earn/use-repeatable-missions.ts:64                         |
| `rpc_claim_staking_reward`                          |   3 |     0 |          3 | apps/web/src/domain/trading-rpc-display-contract.ts:62                           |
| `rpc_claim_viral_mission`                           |   1 |     0 |          1 | apps/web/src/features/earn/use-viral-missions.ts:76                              |
| `rpc_claim_welcome_bonus`                           |   1 |     0 |          1 | apps/web/src/features/onboarding/use-onboarding-missions-page-controller.ts:137  |
| `rpc_claim_whale_mission`                           |   0 |     0 | **unused** | —                                                                                |
| `rpc_clear_risk_flag`                               |   0 |     1 |          1 | apps/admin/src/domain/queues.ts:88                                               |
| `rpc_clear_trailing_stop`                           |   3 |     0 |          3 | apps/web/src/domain/trading-rpc-display-contract.ts:52                           |
| `rpc_close_futures_position`                        |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:53                           |
| `rpc_complete_co_bet`                               |   0 |     0 | **unused** | —                                                                                |
| `rpc_complete_co_mission`                           |   0 |     0 | **unused** | —                                                                                |
| `rpc_complete_mission`                              |   0 |     0 | **unused** | —                                                                                |
| `rpc_contribute_insurance_capital`                  |   0 |     0 | **unused** | —                                                                                |
| `rpc_create_crypto_deposit_request`                 |   1 |     0 |          1 | apps/web/src/features/wallet/use-crypto-deposit.ts:114                           |
| `rpc_create_game_round`                             |   0 |     0 | **unused** | —                                                                                |
| `rpc_create_giftcard_deposit_request`               |   1 |     0 |          1 | apps/web/src/domain/wallet.ts:285                                                |
| `rpc_create_giftcard_redeem_request`                |   1 |     0 |          1 | apps/web/src/domain/wallet.ts:384                                                |
| `rpc_create_krw_deposit_request`                    |   1 |     0 |          1 | apps/web/src/domain/wallet.ts:23                                                 |
| `rpc_create_siwe_challenge`                         |   0 |     0 | **unused** | —                                                                                |
| `rpc_create_support_ticket`                         |   0 |     0 | **unused** | —                                                                                |
| `rpc_create_trading_api_key`                        |   1 |     0 |          1 | apps/web/src/domain/trading-api-keys.ts:39                                       |
| `rpc_disable_market_source`                         |   0 |     0 | **unused** | —                                                                                |
| `rpc_get_affiliate_rank_leaderboard`                |   0 |     0 | **unused** | —                                                                                |
| `rpc_get_candles`                                   |   3 |     0 |          3 | apps/web/src/domain/trading-rpc-display-contract.ts:38                           |
| `rpc_get_co_bet_status`                             |   0 |     0 | **unused** | —                                                                                |
| `rpc_get_co_mission_status`                         |   0 |     0 | **unused** | —                                                                                |
| `rpc_get_compliance_status`                         |   1 |     0 |          1 | apps/web/src/hooks/use-compliance-status.ts:78                                   |
| `rpc_get_crypto_deposit_address`                    |   1 |     0 |          1 | apps/web/src/features/wallet/use-crypto-deposit.ts:46                            |
| `rpc_get_dr_health_summary`                         |   0 |     0 | **unused** | —                                                                                |
| `rpc_get_earn_activity_feed`                        |   0 |     0 | **unused** | —                                                                                |
| `rpc_get_earn_hub_status`                           |  15 |     0 |         15 | apps/web/src/features/account/use-account-hub-controller.ts:46                   |
| `rpc_get_fixture_markets`                           |   1 |     1 |          2 | apps/web/src/features/sports/use-sports-betting.ts:163                           |
| `rpc_get_game_pf_state`                             |   1 |     0 |          1 | apps/web/src/features/casino/use-game-pf-state.ts:32                             |
| `rpc_get_golden_earth_status`                       |   1 |     0 |          1 | apps/web/src/features/earn/use-share-earnings-page-controller.ts:51              |
| `rpc_get_live_fixture_state`                        |   2 |     0 |          2 | apps/web/src/features/sports/use-sports-betting.ts:252                           |
| `rpc_get_mission_chain_status`                      |   0 |     0 | **unused** | —                                                                                |
| `rpc_get_ops_alerts`                                |   0 |     2 |          2 | apps/admin/src/domain/ops.ts:52                                                  |
| `rpc_get_ops_health`                                |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:47                                                  |
| `rpc_get_phon_balance_breakdown`                    |   1 |     0 |          1 | apps/web/src/domain/phon-balance.ts:16                                           |
| `rpc_get_position_mode`                             |   1 |     0 |          1 | apps/web/src/domain/trading-rpc-display-contract.ts:43                           |
| `rpc_get_public_platform_status`                    |   1 |     0 |          1 | apps/web/src/features/marketing/use-system-status.ts:16                          |
| `rpc_get_repeatable_mission_status`                 |   2 |     0 |          2 | apps/web/src/features/earn/use-home-attendance-page-controller.ts:64             |
| `rpc_get_reward_config`                             |   0 |     0 | **unused** | —                                                                                |
| `rpc_get_sports_bet`                                |   1 |     0 |          1 | apps/web/src/features/sports/use-sports-betting.ts:242                           |
| `rpc_get_support_ticket`                            |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminSupportDesk.ts:229                            |
| `rpc_get_synthetic_book`                            |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:39                           |
| `rpc_get_tier_decay_status`                         |   3 |     0 |          3 | apps/web/src/domain/**tests**/ew-e1-gate-decay-display-contract.test.ts:61       |
| `rpc_get_tier_leaderboard`                          |   0 |     0 | **unused** | —                                                                                |
| `rpc_get_user_tier_summary`                         |   1 |     0 |          1 | apps/web/src/product/surfaces/sports/sports-vip-stub-panel.tsx:46                |
| `rpc_get_viral_mission_status`                      |   4 |     0 |          4 | apps/web/src/features/earn/use-home-attendance-page-controller.ts:65             |
| `rpc_get_whale_mission_status`                      |   0 |     0 | **unused** | —                                                                                |
| `rpc_golden_earth_tap`                              |   0 |     0 | **unused** | —                                                                                |
| `rpc_ingest_sports_c1`                              |   0 |     0 | **unused** | —                                                                                |
| `rpc_ingest_sports_c1_batch`                        |   0 |     0 | **unused** | —                                                                                |
| `rpc_ingest_sports_fixture_status`                  |   0 |     0 | **unused** | —                                                                                |
| `rpc_invite_co_bet`                                 |   0 |     0 | **unused** | —                                                                                |
| `rpc_invite_co_mission`                             |   0 |     0 | **unused** | —                                                                                |
| `rpc_link_co_bet_bet`                               |   0 |     0 | **unused** | —                                                                                |
| `rpc_liquidate_position`                            |   0 |     0 | **unused** | —                                                                                |
| `rpc_list_cms_content`                              |   3 |     0 |          3 | apps/web/src/features/landing/use-landing-live-proof.ts:22                       |
| `rpc_list_giftcard_fee_market`                      |   1 |     0 |          1 | apps/web/src/domain/wallet.ts:260                                                |
| `rpc_list_mission_chains`                           |   0 |     0 | **unused** | —                                                                                |
| `rpc_list_my_sports_bets`                           |   1 |     0 |          1 | apps/web/src/features/sports/use-sports-betting.ts:230                           |
| `rpc_list_p2p_transfers`                            |   1 |     0 |          1 | apps/web/src/domain/wallet.ts:336                                                |
| `rpc_list_sports_catalog`                           |   0 |     0 | **unused** | —                                                                                |
| `rpc_list_sports_fixtures`                          |   1 |     0 |          1 | apps/web/src/features/sports/use-sports-betting.ts:95                            |
| `rpc_list_sports_market_types`                      |   0 |     0 | **unused** | —                                                                                |
| `rpc_list_support_tickets`                          |   1 |     0 |          1 | apps/web/src/features/support/**tests**/use-support-ticket-controller.test.ts:15 |
| `rpc_list_trading_api_keys`                         |   1 |     0 |          1 | apps/web/src/domain/trading-api-keys.ts:30                                       |
| `rpc_list_wallet_identities`                        |   0 |     0 | **unused** | —                                                                                |
| `rpc_list_withdrawal_addresses`                     |   1 |     0 |          1 | apps/web/src/features/wallet/use-crypto-withdraw.ts:37                           |
| `rpc_live_crash_advance`                            |   0 |     0 | **unused** | —                                                                                |
| `rpc_live_crash_cashout`                            |   1 |     0 |          1 | apps/web/src/features/casino/use-live-crash.ts:107                               |
| `rpc_live_crash_get_current`                        |   1 |     0 |          1 | apps/web/src/features/casino/use-live-crash.ts:58                                |
| `rpc_live_crash_place_bet`                          |   1 |     0 |          1 | apps/web/src/features/casino/use-live-crash.ts:83                                |
| `rpc_lock_wallet`                                   |   0 |     0 | **unused** | —                                                                                |
| `rpc_mark_withdrawal_sent`                          |   0 |     1 |          1 | apps/admin/src/domain/queues.ts:57                                               |
| `rpc_open_futures_position`                         |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:45                           |
| `rpc_open_game_round`                               |   1 |     0 |          1 | apps/web/src/features/casino/use-casino-round.ts:136                             |
| `rpc_partial_cashout_sports_bet`                    |   1 |     0 |          1 | apps/web/src/features/sports/use-sports-betting.ts:385                           |
| `rpc_partial_close_futures`                         |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:48                           |
| `rpc_place_game_bet`                                |   1 |     0 |          1 | apps/web/src/features/casino/use-casino-round.ts:172                             |
| `rpc_place_limit_order`                             |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:46                           |
| `rpc_place_sports_bet`                              |   1 |     0 |          1 | apps/web/src/features/sports/use-sports-betting.ts:196                           |
| `rpc_place_sports_system_bet`                       |   1 |     0 |          1 | apps/web/src/features/sports/use-sports-betting.ts:333                           |
| `rpc_place_spot_limit_order`                        |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:57                           |
| `rpc_place_spot_stop_order`                         |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:58                           |
| `rpc_place_stop_order`                              |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:47                           |
| `rpc_preview_giftcard_deposit`                      |   1 |     0 |          1 | apps/web/src/domain/wallet.ts:268                                                |
| `rpc_preview_giftcard_redeem`                       |   1 |     0 |          1 | apps/web/src/domain/wallet.ts:374                                                |
| `rpc_preview_sports_cashout`                        |   1 |     0 |          1 | apps/web/src/features/sports/use-sports-betting.ts:306                           |
| `rpc_preview_sports_partial_cashout`                |   1 |     0 |          1 | apps/web/src/features/sports/use-sports-betting.ts:415                           |
| `rpc_process_bank_transfer`                         |   0 |     0 | **unused** | —                                                                                |
| `rpc_process_bank_transfer_batch`                   |   0 |     0 | **unused** | —                                                                                |
| `rpc_process_on_chain_transfer`                     |   0 |     0 | **unused** | —                                                                                |
| `rpc_progressive_cashout`                           |   1 |     0 |          1 | apps/web/src/features/casino/use-progressive-round.ts:99                         |
| `rpc_progressive_start`                             |   1 |     0 |          1 | apps/web/src/features/casino/use-progressive-round.ts:53                         |
| `rpc_progressive_step`                              |   1 |     0 |          1 | apps/web/src/features/casino/use-progressive-round.ts:77                         |
| `rpc_rate_limit_buckets`                            |   0 |     0 | **unused** | —                                                                                |
| `rpc_rate_limit_configs`                            |   0 |     0 | **unused** | —                                                                                |
| `rpc_recommend_missions`                            |   0 |     0 | **unused** | —                                                                                |
| `rpc_record_app_install_attribution`                |   0 |     0 | **unused** | —                                                                                |
| `rpc_record_consent`                                |   5 |     0 |          5 | apps/web/src/domain/trading-rpc-display-contract.ts:54                           |
| `rpc_record_product_analytics_event`                |   0 |     0 | **unused** | —                                                                                |
| `rpc_record_sports_ingest_health`                   |   0 |     0 | **unused** | —                                                                                |
| `rpc_record_sports_score_quorum_mismatch`           |   0 |     0 | **unused** | —                                                                                |
| `rpc_refresh_affiliate_commission_daily_aggregates` |   0 |     0 | **unused** | —                                                                                |
| `rpc_refresh_affiliate_tier_snapshots`              |   0 |     0 | **unused** | —                                                                                |
| `rpc_register_affiliate_relationship`               |   0 |     0 | **unused** | —                                                                                |
| `rpc_register_referral`                             |   1 |     0 |          1 | apps/web/src/lib/referral-register.ts:15                                         |
| `rpc_reject_withdrawal`                             |   0 |     1 |          1 | apps/admin/src/domain/queues.ts:50                                               |
| `rpc_remove_withdrawal_address`                     |   1 |     0 |          1 | apps/web/src/features/wallet/use-crypto-withdraw.ts:55                           |
| `rpc_request_account_deletion`                      |   1 |     0 |          1 | apps/web/src/features/account/use-account-hub-controller.ts:84                   |
| `rpc_request_idem`                                  |   0 |     0 | **unused** | —                                                                                |
| `rpc_request_self_exclusion_release`                |   0 |     0 | **unused** | —                                                                                |
| `rpc_request_withdrawal`                            |   3 |     0 |          3 | apps/web/src/domain/wallet.ts:117                                                |
| `rpc_resolve_admin_review_queue`                    |   0 |     1 |          1 | apps/admin/src/domain/queues.ts:20                                               |
| `rpc_resolve_ops_alert`                             |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:40                                                  |
| `rpc_resolve_sanctions_screening`                   |   0 |     2 |          2 | apps/admin/src/domain/queues.ts:27                                               |
| `rpc_resume_market`                                 |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:130                                                 |
| `rpc_reveal_game_round`                             |   1 |     0 |          1 | apps/web/src/features/casino/use-casino-round.ts:181                             |
| `rpc_reveal_roulette_spin`                          |   0 |     0 | **unused** | —                                                                                |
| `rpc_review_kyc_submission`                         |   0 |     2 |          2 | apps/admin/src/domain/queues.ts:95                                               |
| `rpc_revoke_trading_api_key`                        |   1 |     0 |          1 | apps/web/src/domain/trading-api-keys.ts:47                                       |
| `rpc_rotate_game_server_seed`                       |   1 |     0 |          1 | apps/web/src/features/casino/use-game-pf-state.ts:64                             |
| `rpc_run_affiliate_settlements`                     |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminReferralsDesk.ts:139                          |
| `rpc_run_cms_publish_scheduled`                     |   0 |     0 | **unused** | —                                                                                |
| `rpc_run_custody_reconciliation`                    |   0 |     0 | **unused** | —                                                                                |
| `rpc_run_funding_accrual`                           |   0 |     0 | **unused** | —                                                                                |
| `rpc_run_invariant_checks`                          |   0 |     0 | **unused** | —                                                                                |
| `rpc_run_liquidations`                              |   0 |     0 | **unused** | —                                                                                |
| `rpc_run_open_order_fills`                          |   0 |     0 | **unused** | —                                                                                |
| `rpc_run_phon_internal_oracle`                      |   0 |     0 | **unused** | —                                                                                |
| `rpc_run_reconciliation`                            |   0 |     0 | **unused** | —                                                                                |
| `rpc_run_spot_order_fills`                          |   0 |     0 | **unused** | —                                                                                |
| `rpc_run_stop_orders`                               |   0 |     0 | **unused** | —                                                                                |
| `rpc_run_tier_decay`                                |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_assess_circuit_breaker`                |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_claim_notification_dispatch_batch`     |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_claim_ops_notify_batch`                |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_claim_withdrawal_broadcast_batch`      |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_complete_notification_dispatch`        |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_complete_ops_notify`                   |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_complete_siwe_login`                   |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_create_siwe_challenge`                 |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_enqueue_ops_telegram_digest`           |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_fail_withdrawal_broadcast`             |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_ingest_usdt_krw_rate`                  |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_lookup_siwe_identity`                  |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_mark_withdrawal_broadcast`             |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_purge_siwe_analytics_retention`        |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_record_circuit_breaker_outcome`        |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_record_edge_ops_event`                 |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_record_product_analytics_event`        |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_register_pg_webhook_replay`            |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_set_crypto_address`                    |   0 |     0 | **unused** | —                                                                                |
| `rpc_service_upsert_provider_health`                |   0 |     0 | **unused** | —                                                                                |
| `rpc_set_affiliate_elite_override`                  |   0 |     0 | **unused** | —                                                                                |
| `rpc_set_feature_enabled`                           |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:21                                                  |
| `rpc_set_game_client_seed`                          |   1 |     0 |          1 | apps/web/src/features/casino/use-game-pf-state.ts:45                             |
| `rpc_set_margin_mode`                               |   1 |     0 |          1 | apps/web/src/hooks/use-trading.ts:899                                            |
| `rpc_set_market_limits`                             |   0 |     0 | **unused** | —                                                                                |
| `rpc_set_market_source`                             |   0 |     0 | **unused** | —                                                                                |
| `rpc_set_position_mode`                             |   1 |     0 |          1 | apps/web/src/hooks/use-trading.ts:917                                            |
| `rpc_set_rg_limit`                                  |   1 |     0 |          1 | apps/web/src/domain/responsible-gaming.ts:9                                      |
| `rpc_set_self_exclusion`                            |   1 |     0 |          1 | apps/web/src/domain/responsible-gaming.ts:22                                     |
| `rpc_set_system_mode`                               |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:9                                                   |
| `rpc_set_trailing_stop`                             |   3 |     0 |          3 | apps/web/src/domain/trading-rpc-display-contract.ts:51                           |
| `rpc_settle_game_bet`                               |   0 |     0 | **unused** | —                                                                                |
| `rpc_settle_sports_fixture`                         |   0 |     0 | **unused** | —                                                                                |
| `rpc_settle_sports_fixture_scores`                  |   0 |     0 | **unused** | —                                                                                |
| `rpc_settle_sports_prop_outcomes`                   |   0 |     0 | **unused** | —                                                                                |
| `rpc_spin_roulette`                                 |   1 |     0 |          1 | apps/web/src/features/earn/use-earn-play-page-controller.ts:83                   |
| `rpc_stake`                                         |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:60                           |
| `rpc_stake_phon`                                    |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:59                           |
| `rpc_submit_kyc`                                    |   1 |     0 |          1 | apps/web/src/domain/wallet.ts:211                                                |
| `rpc_submit_oracle_source_price`                    |   0 |     0 | **unused** | —                                                                                |
| `rpc_suspend_sports_fixture`                        |   0 |     0 | **unused** | —                                                                                |
| `rpc_sweep_stale_game_bets`                         |   0 |     0 | **unused** | —                                                                                |
| `rpc_sweep_stale_progressive_sessions`              |   0 |     0 | **unused** | —                                                                                |
| `rpc_sync_ops_alerts_from_health`                   |   0 |     1 |          1 | apps/admin/src/domain/ops.ts:29                                                  |
| `rpc_sync_sports_ingest_ops_alerts`                 |   0 |     0 | **unused** | —                                                                                |
| `rpc_transfer_to_user`                              |   1 |     0 |          1 | apps/web/src/domain/wallet.ts:326                                                |
| `rpc_transition_fixture_live`                       |   0 |     0 | **unused** | —                                                                                |
| `rpc_unlock_wallet`                                 |   0 |     0 | **unused** | —                                                                                |
| `rpc_unstake_phon`                                  |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:61                           |
| `rpc_update_futures_position_sltp`                  |   2 |     0 |          2 | apps/web/src/domain/trading-rpc-display-contract.ts:50                           |
| `rpc_update_oracle_price`                           |   0 |     0 | **unused** | —                                                                                |
| `rpc_update_str_case_status`                        |   0 |     3 |          3 | apps/admin/src/domain/queues.ts:64                                               |
| `rpc_update_treasury_reserve`                       |   0 |     0 | **unused** | —                                                                                |
| `rpc_void_sports_bet`                               |   0 |     0 | **unused** | —                                                                                |
| `rpc_void_sports_fixture_dead_heat`                 |   0 |     0 | **unused** | —                                                                                |
| `rpc_void_sports_market`                            |   0 |     1 |          1 | apps/admin/src/hooks/admin/useAdminSports.ts:257                                 |

## Types RPCs with no app call site

- `rpc_accept_co_bet`
- `rpc_accept_co_mission`
- `rpc_admin_fulfill_giftcard_redeem`
- `rpc_admin_get_product_analytics`
- `rpc_admin_list_giftcard_fee_market`
- `rpc_admin_list_linked_device_users`
- `rpc_admin_list_outcome_liability`
- `rpc_admin_rebase_resume_market`
- `rpc_admin_reject_giftcard_redeem`
- `rpc_admin_trade_exposure_summary`
- `rpc_admin_upsert_giftcard_fee_market`
- `rpc_admin_void_game_bet`
- `rpc_cancel_game_bet`
- `rpc_check_casino_rtp_drift`
- `rpc_check_reserve_ratio`
- `rpc_claim_whale_mission`
- `rpc_complete_co_bet`
- `rpc_complete_co_mission`
- `rpc_complete_mission`
- `rpc_contribute_insurance_capital`
- `rpc_create_game_round`
- `rpc_create_siwe_challenge`
- `rpc_create_support_ticket`
- `rpc_disable_market_source`
- `rpc_get_affiliate_rank_leaderboard`
- `rpc_get_co_bet_status`
- `rpc_get_co_mission_status`
- `rpc_get_dr_health_summary`
- `rpc_get_earn_activity_feed`
- `rpc_get_mission_chain_status`
- `rpc_get_reward_config`
- `rpc_get_tier_leaderboard`
- `rpc_get_whale_mission_status`
- `rpc_golden_earth_tap`
- `rpc_ingest_sports_c1`
- `rpc_ingest_sports_c1_batch`
- `rpc_ingest_sports_fixture_status`
- `rpc_invite_co_bet`
- `rpc_invite_co_mission`
- `rpc_link_co_bet_bet`
- `rpc_liquidate_position`
- `rpc_list_mission_chains`
- `rpc_list_sports_catalog`
- `rpc_list_sports_market_types`
- `rpc_list_wallet_identities`
- `rpc_live_crash_advance`
- `rpc_lock_wallet`
- `rpc_process_bank_transfer`
- `rpc_process_bank_transfer_batch`
- `rpc_process_on_chain_transfer`
- `rpc_rate_limit_buckets`
- `rpc_rate_limit_configs`
- `rpc_recommend_missions`
- `rpc_record_app_install_attribution`
- `rpc_record_product_analytics_event`
- `rpc_record_sports_ingest_health`
- `rpc_record_sports_score_quorum_mismatch`
- `rpc_refresh_affiliate_commission_daily_aggregates`
- `rpc_refresh_affiliate_tier_snapshots`
- `rpc_register_affiliate_relationship`
- `rpc_request_idem`
- `rpc_request_self_exclusion_release`
- `rpc_reveal_roulette_spin`
- `rpc_run_cms_publish_scheduled`
- `rpc_run_custody_reconciliation`
- `rpc_run_funding_accrual`
- `rpc_run_invariant_checks`
- `rpc_run_liquidations`
- `rpc_run_open_order_fills`
- `rpc_run_phon_internal_oracle`
- `rpc_run_reconciliation`
- `rpc_run_spot_order_fills`
- `rpc_run_stop_orders`
- `rpc_run_tier_decay`
- `rpc_service_assess_circuit_breaker`
- `rpc_service_claim_notification_dispatch_batch`
- `rpc_service_claim_ops_notify_batch`
- `rpc_service_claim_withdrawal_broadcast_batch`
- `rpc_service_complete_notification_dispatch`
- `rpc_service_complete_ops_notify`
- `rpc_service_complete_siwe_login`
- `rpc_service_create_siwe_challenge`
- `rpc_service_enqueue_ops_telegram_digest`
- `rpc_service_fail_withdrawal_broadcast`
- `rpc_service_ingest_usdt_krw_rate`
- `rpc_service_lookup_siwe_identity`
- `rpc_service_mark_withdrawal_broadcast`
- `rpc_service_purge_siwe_analytics_retention`
- `rpc_service_record_circuit_breaker_outcome`
- `rpc_service_record_edge_ops_event`
- `rpc_service_record_product_analytics_event`
- `rpc_service_register_pg_webhook_replay`
- `rpc_service_set_crypto_address`
- `rpc_service_upsert_provider_health`
- `rpc_set_affiliate_elite_override`
- `rpc_set_market_limits`
- `rpc_set_market_source`
- `rpc_settle_game_bet`
- `rpc_settle_sports_fixture`
- `rpc_settle_sports_fixture_scores`
- `rpc_settle_sports_prop_outcomes`
- `rpc_submit_oracle_source_price`
- `rpc_suspend_sports_fixture`
- `rpc_sweep_stale_game_bets`
- `rpc_sweep_stale_progressive_sessions`
- `rpc_sync_sports_ingest_ops_alerts`
- `rpc_transition_fixture_live`
- `rpc_unlock_wallet`
- `rpc_update_oracle_price`
- `rpc_update_treasury_reserve`
- `rpc_void_sports_bet`
- `rpc_void_sports_fixture_dead_heat`

> Note: unused in apps ≠ dead — Edge Functions, SQL tests, cron, or admin-only paths may still call these.

## App references not in database.types Functions

- `rpc_error` (1 sites) — e.g. apps/web/src/lib/referral-register.ts
- `rpc_spot_market_buy` (3 sites) — e.g. apps/web/src/domain/trading-rpc-display-contract.ts
- `rpc_spot_market_sell` (3 sites) — e.g. apps/web/src/domain/trading-rpc-display-contract.ts

## Method

1. Parse `Functions` block in `database.types.ts` for keys matching `rpc_*`.
2. Walk `apps/web/src` + `apps/admin/src` for `callRpc` / `.rpc(` / RPC string constants.
3. Resolve `RPC_*` exported constants to literal names.
