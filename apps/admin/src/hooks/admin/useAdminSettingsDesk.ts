import { useCallback, useMemo, useState } from 'react';

import {
  filterSettingsSections,
  parseAdminSettingsSections,
} from '@/product/bridge/parse-admin-settings-config';
import { useAppConfig, useRefreshConfig } from '../use-app-config';

/** Engine-backed settings desk — `useAppConfig` read only (§29.2 R0 · R3 write deferred). */
export function useAdminSettingsDesk() {
  const { data, isLoading, isError, isFetching } = useAppConfig();
  const refreshConfig = useRefreshConfig();
  const [search, setSearch] = useState('');

  const sections = useMemo(() => parseAdminSettingsSections(data ?? {}), [data]);
  const filteredSections = useMemo(
    () => filterSettingsSections(sections, search),
    [sections, search],
  );
  const entryCount = useMemo(
    () => sections.reduce((count, section) => count + section.rows.length, 0),
    [sections],
  );

  const refresh = useCallback(async () => {
    await refreshConfig();
  }, [refreshConfig]);

  return {
    sections: filteredSections,
    entryCount,
    search,
    setSearch,
    isLoading,
    isError,
    isFetching,
    refresh,
  };
}
