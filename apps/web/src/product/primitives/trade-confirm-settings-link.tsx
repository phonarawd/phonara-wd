import { Link } from '@tanstack/react-router';

import { TRADE_SETTINGS_HUB_ROUTE } from '@/domain/trade-settings-prefs-display-contract';
import { useT } from '@/product/i18n';

/** Discoverability link for confirm / one-click prefs (shared Earn staking + Trade tickets). */
export function TradeConfirmSettingsLink() {
  const t = useT();

  return (
    <p
      className="text-foreground-muted m-0 text-xs leading-relaxed"
      data-testid="trade-confirm-settings-link"
    >
      {t('trade.confirm.settingsHint')}{' '}
      <Link
        to={TRADE_SETTINGS_HUB_ROUTE}
        className="text-accent font-medium underline-offset-4 hover:underline"
      >
        {t('trade.confirm.settingsLink')}
      </Link>
    </p>
  );
}
