/**
 * MobileGameFrame — P1.7 Mobile Apex v2 · mobile-crush skin.
 *
 * L1-16g additions (wrapper-only, engines NO-TOUCH):
 *   - Bet panel collapse toggle (chevron). Hides every
 *     [data-game-id$="-panel-mobile"] / spacer via scoped CSS when
 *     data-bet="collapsed". Persisted in localStorage.
 *   - Fullscreen toggle. Uses native Fullscreen API on the game card with
 *     webkit fallback; on iOS Safari where neither exists, applies a
 *     position:fixed full-viewport fallback via data-fs-fallback.
 *
 * Skin contract:
 *   - data-skin="mobile-crush" activates palette + font swap in styles.css.
 *
 * Mobile exit: AppShell TopBar back (hideMobileNav only) + browser history.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { RTPChip } from "@/components/casino/RTPChip";
import { ProvablyFairBadge } from "@/components/casino/ProvablyFairBadge";
import { MobileSideStack } from "./MobileSideStack";
import { getGameMeta, type CasinoGameId } from "@/data/casino-game-meta";
import { t } from "@/i18n";

type Props = { gameId: CasinoGameId; children: ReactNode };

const BET_KEY = "phonara.mobile.bet.collapsed";

const SCOPED_CSS = `
[data-skin="mobile-crush"][data-bet="collapsed"] [data-game-id$="-panel-mobile"],
[data-skin="mobile-crush"][data-bet="collapsed"] [data-game-id$="-panel-mobile-spacer"] {
  display: none !important;
}
[data-skin="mobile-crush"][data-fs="true"] [data-fs-hide],
[data-skin="mobile-crush"][data-fs-fallback="true"] [data-fs-hide] {
  display: none !important;
}
[data-skin="mobile-crush"][data-fs-fallback="true"] [data-fs-card] {
  position: fixed; inset: 0; z-index: 100; border-radius: 0;
  width: 100vw; height: 100dvh; overflow: auto;
}
`;

export function MobileGameFrame({ gameId, children }: Props) {
  const meta = getGameMeta(gameId);
  const cardRef = useRef<HTMLDivElement>(null);

  const [betCollapsed, setBetCollapsed] = useState<boolean>(false);
  const [isFs, setIsFs] = useState(false);
  const [fsFallback, setFsFallback] = useState(false);

  // Hydrate bet-collapsed from localStorage (client-only).
  useEffect(() => {
    try {
      setBetCollapsed(localStorage.getItem(BET_KEY) === "1");
    } catch {
      /* noop */
    }
  }, []);

  const toggleBet = useCallback(() => {
    setBetCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(BET_KEY, next ? "1" : "0");
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  // Sync native fullscreen state.
  useEffect(() => {
    const onChange = () => {
      const fsEl =
        document.fullscreenElement ??
        (document as unknown as { webkitFullscreenElement?: Element })
          .webkitFullscreenElement ??
        null;
      setIsFs(Boolean(fsEl));
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onChange as EventListener,
      );
    };
  }, []);

  const toggleFs = useCallback(() => {
    const el = cardRef.current as
      | (HTMLDivElement & {
          webkitRequestFullscreen?: () => Promise<void>;
        })
      | null;
    if (!el) return;
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      webkitFullscreenElement?: Element | null;
    };
    const fsActive = Boolean(
      doc.fullscreenElement ?? doc.webkitFullscreenElement,
    );
    // Native path
    if (el.requestFullscreen || el.webkitRequestFullscreen) {
      if (fsActive) {
        (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc);
      } else {
        (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
      }
      return;
    }
    // iOS Safari fallback — toggle CSS-only fixed viewport.
    setFsFallback((v) => !v);
  }, []);

  const fsOn = isFs || fsFallback;

  return (
    <div
      data-skin="mobile-crush"
      data-bet={betCollapsed ? "collapsed" : "expanded"}
      data-fs={isFs ? "true" : "false"}
      data-fs-fallback={fsFallback ? "true" : "false"}
      className="grid gap-3 bg-skin-bg text-skin-fg"
    >
      <style>{SCOPED_CSS}</style>

      {/* Zone 1 — Slim 56px header (hidden in fullscreen) */}
      <header
        data-fs-hide
        className="flex h-14 items-center justify-between gap-2 px-1"
      >
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-base font-bold tracking-tight text-skin-fg">
            {t(meta.nameKey)}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <RTPChip value={meta.rtp} />
          <button
            type="button"
            onClick={toggleBet}
            aria-pressed={betCollapsed}
            aria-label={t(
              betCollapsed
                ? "casino.detail.expandBet"
                : "casino.detail.collapseBet",
            )}
            data-testid="mobile-bet-toggle"
            className="grid size-9 place-items-center rounded-md border border-skin-border text-skin-fg hover:bg-skin-surface"
          >
            {betCollapsed ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronUp className="size-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={toggleFs}
            aria-pressed={fsOn}
            aria-label={t(
              fsOn
                ? "casino.detail.exitFullscreen"
                : "casino.detail.enterFullscreen",
            )}
            data-testid="mobile-fs-toggle"
            className="grid size-9 place-items-center rounded-md border border-skin-border text-skin-fg hover:bg-skin-surface"
          >
            {fsOn ? (
              <Minimize2 className="size-4" aria-hidden />
            ) : (
              <Maximize2 className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </header>

      {/* Zone 2 — Game card */}
      <div
        ref={cardRef}
        data-p13-id="casino-game-surface"
        data-fs-card
        className="min-w-0 overflow-hidden rounded-2xl border border-skin-border bg-skin-surface"
      >
        {children}
      </div>

      {/* Zone 2b — Meta footer (outside the game card) */}
      <div
        data-fs-hide
        className="flex items-center justify-between gap-2 px-1 text-[11px] text-skin-fg-muted"
      >
        <ProvablyFairBadge />
      </div>

      {/* Zone 3 — Inline side stack (hidden in fullscreen) */}
      <div data-fs-hide>
        <MobileSideStack gameId={gameId} />
      </div>

      <p data-fs-hide className="px-1 text-[10px] text-skin-fg-muted">
        {t("casino.detail.disclaimer")}
      </p>
      <span className="sr-only">{meta.nameAscii}</span>

      {/* safe-area bottom padding */}
      <div
        data-fs-hide
        aria-hidden
        style={{ height: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
      />
    </div>
  );
}
