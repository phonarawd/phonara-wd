import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * P1.4 — Global Command Palette state + ⌘K / Ctrl+K hotkey.
 *
 * Provider mounts ONCE in __root.tsx so the palette is reachable from every
 * route (including /casino/<game> shells). Listens for ⌘K / Ctrl+K and
 * toggles `open`. SSR safe — listener attaches in useEffect.
 */

type Ctx = {
  open: boolean;
  setOpen: (next: boolean) => void;
  toggle: () => void;
};

const PaletteContext = createContext<Ctx | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false);

  const setOpen = useCallback((next: boolean) => setOpenState(next), []);
  const toggle = useCallback(() => setOpenState((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK =
        (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && !e.altKey;
      if (isCmdK) {
        e.preventDefault();
        setOpenState((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ open, setOpen, toggle }),
    [open, setOpen, toggle],
  );
  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  );
}

export function useCommandPalette(): Ctx {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    // Permissive fallback so a stray <SearchTrigger /> outside the provider
    // never crashes the page — it just becomes a no-op button.
    return { open: false, setOpen: () => {}, toggle: () => {} };
  }
  return ctx;
}
