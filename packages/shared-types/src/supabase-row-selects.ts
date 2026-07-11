/** Explicit PostgREST column lists — avoid select('*') over-fetching. */

export const WALLETS_ROW =
  'id,user_id,phon_available,phon_locked,krw_available,krw_locked,usdt_available,usdt_locked,version,created_at,updated_at';

export const WALLET_LEDGER_ROW =
  'id,user_id,wallet_id,seq,amount,currency,direction,available_before,available_after,locked_before,locked_after,reason_code,idempotency_key,related_entity_id,transfer_id,rate_snapshot_id,prev_hash,row_hash,created_at';

export const PROFILES_ROW =
  'id,username,display_name,legal_name,avatar_url,locale,role,kyc_tier,is_banned,ban_reason,activity_frozen,referrer_id,created_at,updated_at';

export const KRW_DEPOSIT_REQUESTS_ROW =
  'id,user_id,wallet_id,amount_krw,expected_phon,reference_code,status,rate_snapshot_id,expires_at,matched_at,credited_at,admin_note,proof_path,proof_uploaded_at,proof_status,proof_reviewed_at,proof_review_note,created_at,updated_at';

export const CRYPTO_DEPOSIT_REQUESTS_ROW =
  'id,user_id,wallet_id,address_id,asset,chain,amount,tx_hash,confirmations_required,confirmations_seen,status,expires_at,matched_at,credited_at,created_at,updated_at';

export const CRYPTO_DEPOSIT_ADMIN_ROW =
  'id,user_id,amount,status,created_at,tx_hash,crypto_deposit_addresses(address)';

export const GIFTCARD_DEPOSIT_REQUESTS_ROW =
  'id,user_id,wallet_id,kind,face_value_krw,net_krw,expected_phon,fee_rate_bps,fixed_fee_krw,payout_rate_bps,fee_market_id,pin_last4,status,rate_snapshot_id,credited_at,reviewed_at,reviewed_by,admin_note,created_at,updated_at';

export const WITHDRAWAL_REQUESTS_ROW =
  'id,user_id,wallet_id,currency,amount,destination,status,idempotency_key,client_request_id,rate_snapshot_id,expected_krw,ledger_lock_id,ledger_debit_id,ledger_approve_debit_id,ledger_reject_unlock_id,system_payout_transfer_id,on_chain_tx_hash,broadcast_at,broadcast_attempts,broadcast_claim_expires_at,broadcast_claimed_at,broadcast_claimed_by,broadcast_idempotency_key,approved_at,approved_by,rejected_at,rejected_by,sent_at,sent_by,admin_note,created_at,updated_at';

export const KYC_SUBMISSIONS_ROW =
  'id,user_id,legal_name,country,document_type,document_last4,document_front_path,document_back_path,selfie_path,status,idempotency_key,submitted_at,documents_uploaded_at,reviewed_at,reviewed_by,rejection_reason,created_at,updated_at';

export const APP_CONFIG_ROW = 'key,value,description,is_public,updated_at';

export const ADMIN_REVIEW_QUEUE_ROW =
  'id,queue_type,entity_type,entity_id,user_id,status,reason,payload,sla_due_at,resolved_at,resolved_by,created_at';

export const STR_CASES_ROW =
  'id,user_id,case_type,status,trigger_ref,details,created_at,updated_at';

export const RISK_FLAGS_ROW =
  'id,user_id,flag_type,status,details,created_at,cleared_at,cleared_by';

export const AUDIT_LOGS_ROW =
  'id,action,actor_id,entity_type,entity_id,payload,ip_address,user_agent,created_at';

export const FUTURES_MARKETS_ROW =
  'symbol,display_name,base_label,is_active,max_leverage,maintenance_margin_rate,open_fee_rate,close_fee_rate,min_notional,max_open_interest,max_user_positions,price_precision,tick_size,sort_order,created_at';

export const SPOT_MARKETS_ROW =
  'symbol,display_name,is_active,fee_rate,min_notional,price_precision,tick_size,sort_order,created_at';

export const FUTURES_POSITIONS_ROW =
  'id,user_id,market,side,status,quantity,notional,entry_price,exit_price,leverage,margin_amount,margin_currency,margin_mode,liquidation_price,open_fee,close_fee,realized_pnl,equity_returned,stop_loss,take_profit,opened_at,closed_at,first_breach_at,first_breach_tick_id,updated_at';

export const STAKING_POOLS_ROW =
  'id,display_name,stake_currency,reward_currency,reference_asset,term,lock_days,estimated_apr,is_active,sort_order,created_at';

export const STAKING_POSITIONS_ROW =
  'id,user_id,pool_id,principal,apr_snapshot,term,lock_days,status,reward_claimed,stake_currency,reference_asset,staked_at,unlock_at,unstaked_at,updated_at';

export const AFFILIATE_SETTLEMENTS_ROW =
  'id,affiliate_id,settlement_date,tier_code,state,direct_ggr,override_ggr,direct_commission,override_commission,override_commission_raw,cap_reduction,total_commission,ledger_entry_ids,system_transfer_ids,paid_at,created_at,updated_at';
