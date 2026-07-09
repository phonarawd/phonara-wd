import { useEffect, type ReactNode } from 'react';

import {
  applySettingsThemeToDocument,
  readSettingsTheme,
} from '@/domain/settings-preferences-display-contract';

/** Applies persisted theme before first paint follow-up and on mount (§25.8.2). */
export function ThemeShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    applySettingsThemeToDocument(readSettingsTheme());
  }, []);

  return children;
}
