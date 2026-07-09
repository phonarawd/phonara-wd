import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  buildBetHubSectionHref,
  parseBetHubSectionFromSearch,
  readBetHubSectionStorage,
  resolveBetHubSection,
  writeBetHubSectionStorage,
  type BetSection,
} from './bet-hub-section';

/** BetHub `/trade` section tabs — URL deeplink + localStorage persistence. */
export function useBetHubSection(defaultSection: BetSection = 'trade') {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });

  const sectionFromSearch = useMemo(() => parseBetHubSectionFromSearch(searchStr), [searchStr]);

  const resolveSection = useCallback((): BetSection => {
    return resolveBetHubSection(sectionFromSearch, readBetHubSectionStorage(), defaultSection);
  }, [sectionFromSearch, defaultSection]);

  const [section, setSectionState] = useState<BetSection>(resolveSection);

  useEffect(() => {
    setSectionState(resolveSection());
  }, [resolveSection]);

  const setSection = useCallback(
    (next: BetSection) => {
      setSectionState(next);
      writeBetHubSectionStorage(next);
      const href = buildBetHubSectionHref(pathname, searchStr, next, defaultSection);
      void navigate({ to: href as never, replace: true });
    },
    [defaultSection, navigate, pathname, searchStr],
  );

  return [section, setSection] as const;
}
