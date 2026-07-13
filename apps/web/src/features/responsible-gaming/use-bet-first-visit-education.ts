import { useCallback, useEffect, useState } from 'react';

import {
  dismissBetFirstVisitEducation,
  isBetFirstVisitEducationDismissed,
} from './bet-first-visit-education';

/** Sports+casino surfaces — show once until localStorage dismiss (§32.5 · p10-first-bet-education). */
export function useBetFirstVisitEducation(active: boolean) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!active) {
      setOpen(false);
      return;
    }
    setOpen(!isBetFirstVisitEducationDismissed());
  }, [active]);

  const dismiss = useCallback(() => {
    dismissBetFirstVisitEducation();
    setOpen(false);
  }, []);

  return { open, dismiss };
}
