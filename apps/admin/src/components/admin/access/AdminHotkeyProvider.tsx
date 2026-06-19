import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ADMIN_ROUTES } from "@/lib/admin-nav";

export interface AdminHotkeyContextValue {
  enabled: boolean;
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
}

const AdminHotkeyContext = createContext<AdminHotkeyContextValue | null>(null);

export function useAdminHotkeyContext(): AdminHotkeyContextValue {
  const ctx = useContext(AdminHotkeyContext);
  if (!ctx) {
    return {
      enabled: false,
      paletteOpen: false,
      openPalette: () => {},
      closePalette: () => {},
      togglePalette: () => {},
    };
  }
  return ctx;
}

const GOTO_MAP: Record<string, string> = {
  o: ADMIN_ROUTES.overview,
  q: ADMIN_ROUTES.queues,
  u: ADMIN_ROUTES.users,
  s: ADMIN_ROUTES.sports,
  a: ADMIN_ROUTES.audit,
  l: ADMIN_ROUTES.alerts,
  p: ADMIN_ROUTES.operations,
  c: ADMIN_ROUTES.casino,
  e: ADMIN_ROUTES.earn,
  n: ADMIN_ROUTES.cms,
  m: ADMIN_ROUTES.mfaPolicy,
  t: ADMIN_ROUTES.settings,
};

function isAdminHotkeyScope(pathname: string): boolean {
  if (pathname === ADMIN_ROUTES.login) return false;
  if (pathname.startsWith("/mfa/enroll") || pathname.startsWith("/mfa/challenge")) {
    return false;
  }
  return true;
}

export interface AdminHotkeyProviderProps {
  children: ReactNode;
}

export function AdminHotkeyProvider({ children }: AdminHotkeyProviderProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const enabled = isAdminHotkeyScope(pathname);
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const seqRef = useRef<{ key: string | null; at: number }>({
    key: null,
    at: 0,
  });

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const togglePalette = useCallback(() => setPaletteOpen((v) => !v), []);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editable =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (target?.isContentEditable ?? false);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

      if (editable) return;

      const key = e.key.toLowerCase();

      if (key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        seqRef.current = { key: "g", at: performance.now() };
        return;
      }

      if (seqRef.current.key === "g") {
        const elapsed = performance.now() - seqRef.current.at;
        seqRef.current = { key: null, at: 0 };
        if (elapsed < 1200 && GOTO_MAP[key]) {
          e.preventDefault();
          navigate({ to: GOTO_MAP[key] });
          return;
        }
      }

      if (key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, navigate]);

  useEffect(() => {
    setPaletteOpen(false);
    seqRef.current = { key: null, at: 0 };
  }, [pathname]);

  const value = useMemo<AdminHotkeyContextValue>(
    () => ({
      enabled,
      paletteOpen: enabled && paletteOpen,
      openPalette: enabled ? openPalette : () => {},
      closePalette,
      togglePalette: enabled ? togglePalette : () => {},
    }),
    [enabled, paletteOpen, openPalette, closePalette, togglePalette],
  );

  return (
    <AdminHotkeyContext.Provider value={value}>
      {children}
    </AdminHotkeyContext.Provider>
  );
}
