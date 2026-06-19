import { GateBanner } from '@/components/ui/gate-banner';
import { usePlatformGates } from '@/hooks/use-platform-gates';

/**
 * Route-aware platform halt banner — reads app_config only (no engine mutation).
 */
export function PlatformGateBanner() {
  const { loading, showKillSwitchBanner } = usePlatformGates();

  if (loading || !showKillSwitchBanner) return null;

  return (
    <div className="px-3 pt-2 md:px-4" data-testid="platform-gate-killswitch">
      <GateBanner kind="killswitch" />
    </div>
  );
}
