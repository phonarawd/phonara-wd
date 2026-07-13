/**
 * Futures UI capability map — expose controls only when matching RPC exists.
 * Engine freeze: update here when migrations add/remove RPCs (no client recompute).
 */
export const TRADE_FUTURES_UI_CAPABILITIES = {
  /** `rpc_partial_close_futures` */
  partialClose: true,
  /** `rpc_adjust_isolated_margin` — isolated positions only */
  isolatedMarginAdjust: true,
  /** `p_reduce_only` on `rpc_place_limit_order` / `rpc_place_stop_order` — E21 UI unlock. */
  reduceOnlyOrders: true,
  /** `rpc_update_futures_position_sltp` — post-open TP/SL edit */
  positionTpSlEdit: true,
  /**
   * Entry TP/SL on limit/stop open orders — RPC params absent on
   * `rpc_place_limit_order` / `rpc_place_stop_order` (still defer).
   */
  entryTpSlOnOpenOrders: false,
  /** `rpc_set_trailing_stop` / `rpc_clear_trailing_stop` + cron peak update */
  trailingStop: true,
  /** `time_in_force` on `rpc_place_limit_order` (gtc · post_only · ioc · fok) */
  timeInForce: true,
  /** `display_quantity` iceberg slices on limit orders */
  icebergOrders: true,
} as const;

/**
 * Spot UI capability map — expose controls only when matching RPC exists.
 */
export const TRADE_SPOT_UI_CAPABILITIES = {
  /** `rpc_place_spot_limit_order` */
  limitOrders: true,
  /** `rpc_place_spot_stop_order` (stop_market · stop_limit) */
  stopOrders: true,
  /** `spot_open_orders` read + dock panel */
  openOrdersDock: true,
  /** `rpc_cancel_spot_order` */
  cancelOpenOrders: true,
} as const;
