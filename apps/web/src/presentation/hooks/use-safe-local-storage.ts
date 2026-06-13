import { useCallback, useEffect, useState } from 'react';

export function useSafeLocalStorageFlag(key: string) {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [pendingWrite, setPendingWrite] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    setEnabled(localStorage.getItem(key) === 'true');
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (pendingWrite === null || typeof localStorage === 'undefined') return;
    if (pendingWrite) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  }, [key, pendingWrite]);

  const setFlag = useCallback(
    (nextEnabled: boolean) => {
      setEnabled(nextEnabled);
      setPendingWrite(nextEnabled);
    },
    [],
  );

  return { ready, enabled, setFlag };
}
