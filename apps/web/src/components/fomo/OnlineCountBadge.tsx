/**
 * Phase 12-F v0.3 §Y - Concurrent online users pill (display-only mock).
 *
 * Wave 1.2 dedup: AppShell topbar OnlinePulse is the single SOT for the
 * online-count UI on /home. Legacy fake counts (3,214 등) were causing
 * mismatched numbers across the page. This badge now renders null in
 * every preference state (ON: topbar owns it; OFF: nothing shown).
 * Component kept (no shell leftover) so existing imports stay green.
 */
export interface OnlineCountBadgeProps {
  count: number;
  className?: string;
}

export function OnlineCountBadge(props: OnlineCountBadgeProps) {
  void props;
  return null;
}
