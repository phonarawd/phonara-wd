/** Production-only hardening — deters casual inspection; not a crypto/security boundary. */
export function initProductionSecurityShell(): void {
  if (import.meta.env.DEV) return;
  if (typeof navigator !== 'undefined' && navigator.webdriver) return;

  const globalRecord = globalThis as Record<string, unknown>;

  if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in globalRecord) {
    try {
      Object.defineProperty(globalRecord, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
        get: () => undefined,
        set: () => undefined,
        configurable: false,
      });
    } catch {
      /* ignore */
    }
  }

  if ('__SUPABASE__' in globalRecord) {
    try {
      delete globalRecord['__SUPABASE__'];
    } catch {
      /* ignore */
    }
  }

  document.addEventListener(
    'contextmenu',
    (event) => {
      event.preventDefault();
    },
    { capture: true },
  );

  document.addEventListener(
    'keydown',
    (event) => {
      const key = event.key?.toLowerCase();
      if (!key) return;
      if (key === 'f12') {
        event.preventDefault();
        return;
      }
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        event.preventDefault();
      }
      if (event.metaKey && event.altKey && key === 'i') {
        event.preventDefault();
      }
    },
    { capture: true },
  );
}
