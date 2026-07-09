import { useCallback, useEffect, useState } from 'react';

import {
  dismissTradeFirstVisitEducation,
  isTradeFirstVisitEducationDismissed,
} from './trade-first-visit-education';

/** Trade surfaces only — show once until localStorage dismiss (§32.5 · p9-first-trade-education). */
export function useTradeFirstVisitEducation(active: boolean) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!active) {
      setOpen(false);
      return;
    }
    setOpen(!isTradeFirstVisitEducationDismissed());
  }, [active]);

  const dismiss = useCallback(() => {
    dismissTradeFirstVisitEducation();
    setOpen(false);
  }, []);

  return { open, dismiss };
}
