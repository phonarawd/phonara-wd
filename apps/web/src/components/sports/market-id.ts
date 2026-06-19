// Mutex key only · paste 후 engine market_id wire 시 adapter 1곳만 변경
// mocks NO-TOUCH · Row(hub)↔Card(fixture) 동일 규칙 강제 (V3-4 LOCK)
// market.market_id (UUID) mutex 사용 금지 — surface 간 불일치 차단.
export function slipMarketId(fixtureId: string, marketType: string): string {
  return `${fixtureId}:${marketType}`;
}
