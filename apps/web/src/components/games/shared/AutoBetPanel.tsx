/**
 * AutoBetPanel — Stake/Rollbit-style auto-bet UI.
 *
 * P1.5-A LOCK + §0a hardening (autobet-layer v2):
 *  - Refuse start unless `count > 0` OR `stopOnLoss > 0` (no unbounded sessions).
 *  - Surface "stopping after current bet" state between Stop press and settle.
 *  - Surface "paused (tab hidden)" badge when visibility-paused.
 *  - Typed per-game slot via `slot` (back-compat `children`/`autoChildren`).
 *
 * Caller wires `onFire` as the A6 wrapper (prepare-if-needed → submit) and
 * passes the engine's latest `bet` (reference inequality drives settle). The
 * panel surfaces `onActiveChange` so the parent can lock UI from the moment
 * Start is pressed (atomic — fixes pre-LOCK race where lock only attached
 * after the first fire).
 */
import { useCallback, useEffect, useState } from "react";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import type { BetResult, Currency } from "./types";
import {
  type AutoBetConfig,
  DEFAULT_AUTOBET,
  INFINITE_REMAINING,
  useAutoBetQueue,
} from "./hooks/useAutoBetQueue";

export interface AutoBetPanelProps {
  baseStake: string;
  currency: Currency;
  /** Engine settle truth — reference inequality = new settle. */
  bet: BetResult | null;
  busy: boolean;
  /** Optional balance guard. */
  availableBalance?: string | null;
  onFire: () => void | Promise<void>;
  /** Fires when active goes true/false (synchronous parent lock). */
  onActiveChange?: (active: boolean) => void;
  onStopped?: (reason: string) => void;
  errorReason?: string | null;
  /** Optional pre-Start guard (e.g. "select tiles first"). When set, Start is disabled. */
  startDisabledReason?: string | null;
  /** Per-caller inter-fire delay (ms). Crash passes 5000. */
  fireDelayMs?: number;
  /** Optional countdown renderer — shown while a fire is pending. */
  countdownSlot?: (secondsRemaining: number, pendingMs: number) => React.ReactNode;
  /** §0a typed per-game slot. Renders above the config fields. Preferred over `children`. */
  slot?: React.ReactNode;
  children?: React.ReactNode;
}

const NUM_RE = /^[0-9]*\.?[0-9]*$/;

export function AutoBetPanel(p: AutoBetPanelProps) {
  const [cfg, setCfg] = useState<AutoBetConfig>(DEFAULT_AUTOBET);
  const [active, setActive] = useState(false);

  useEffect(() => {
    p.onActiveChange?.(active);
  }, [active, p]);

  useEffect(() => {
    if (p.errorReason && active) setActive(false);
  }, [p.errorReason, active]);

  const {
    remaining,
    runningStake,
    cumulativeProfit,
    stop,
    pendingMs,
    secondsRemaining,
    stopping,
    pausedByHidden,
  } = useAutoBetQueue({
    active,
    config: cfg,
    baseStake: p.baseStake,
    onFire: p.onFire,
    bet: p.bet,
    busy: p.busy,
    availableBalance: p.availableBalance,
    fireDelayMs: p.fireDelayMs,
    onStop: (reason) => {
      setActive(false);
      p.onStopped?.(reason);
    },
  });

  // §0a — hard gate: require either a finite count OR a stop-on-loss limit.
  const hasStopCondition =
    cfg.count > 0 || (cfg.stopOnLoss !== "" && Number(cfg.stopOnLoss) > 0);

  const start = useCallback(() => {
    if (p.startDisabledReason) return;
    if (!hasStopCondition) return;
    setActive(true);
  }, [hasStopCondition, p.startDisabledReason]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const setCount = (v: string) =>
    !active && NUM_RE.test(v) && setCfg((c) => ({ ...c, count: Number(v) || 0 }));
  const setSOP = (v: string) =>
    !active && NUM_RE.test(v) && setCfg((c) => ({ ...c, stopOnProfit: v }));
  const setSOL = (v: string) =>
    !active && NUM_RE.test(v) && setCfg((c) => ({ ...c, stopOnLoss: v }));
  const setLossMult = (v: string) =>
    !active &&
    NUM_RE.test(v) &&
    setCfg((c) => ({ ...c, onLossMultiplier: Math.max(1, Number(v) || 1) }));
  const setWinMult = (v: string) =>
    !active &&
    NUM_RE.test(v) &&
    setCfg((c) => ({ ...c, onWinMultiplier: Math.max(1, Number(v) || 1) }));

  const remainingLabel =
    remaining === INFINITE_REMAINING ? "∞" : String(remaining);

  const startDisabled =
    !active &&
    (!p.baseStake ||
      Number(p.baseStake) <= 0 ||
      Boolean(p.startDisabledReason) ||
      !hasStopCondition);

  return (
    <div
      className="grid gap-3 rounded-2xl border border-border bg-card p-3"
      data-testid="casino-auto-panel"
      aria-busy={active}
    >
      {p.slot}
      {p.children}

      <Row label={t("casino.auto.count")}>
        <input
          inputMode="numeric"
          value={String(cfg.count)}
          onChange={(e) => setCount(e.target.value)}
          disabled={active}
          className={inputCls}
          data-testid="casino-auto-count"
          aria-label={t("casino.auto.count")}
        />
        <span className="px-1 text-[10px] text-muted-foreground">
          {cfg.count === 0 ? t("casino.auto.infinite") : ""}
        </span>
      </Row>

      <Row label={t("casino.auto.stopProfit")}>
        <input
          inputMode="decimal"
          value={cfg.stopOnProfit}
          onChange={(e) => setSOP(e.target.value)}
          disabled={active}
          className={inputCls}
          placeholder="0"
          data-testid="casino-auto-stop-profit"
          aria-label={t("casino.auto.stopProfit")}
        />
        <span className="px-1 text-[10px] text-muted-foreground">{p.currency}</span>
      </Row>

      <Row label={t("casino.auto.stopLoss")}>
        <input
          inputMode="decimal"
          value={cfg.stopOnLoss}
          onChange={(e) => setSOL(e.target.value)}
          disabled={active}
          className={inputCls}
          placeholder="0"
          data-testid="casino-auto-stop-loss"
          aria-label={t("casino.auto.stopLoss")}
        />
        <span className="px-1 text-[10px] text-muted-foreground">{p.currency}</span>
      </Row>

      <div className="grid grid-cols-2 gap-2">
        <ModeRow
          label={t("casino.auto.onLoss")}
          isReset={cfg.onLossReset !== false}
          disabled={active}
          onReset={() =>
            !active &&
            setCfg((c) => ({ ...c, onLossReset: true }))
          }
          onIncrease={() =>
            !active &&
            setCfg((c) => ({ ...c, onLossReset: false }))
          }
          multiplier={cfg.onLossMultiplier}
          onMultiplierChange={setLossMult}
          inputTestId="casino-auto-onloss"
          resetTestId="autobet-on-loss-mode-reset"
          increaseTestId="autobet-on-loss-mode-increase"
        />
        <ModeRow
          label={t("casino.auto.onWin")}
          isReset={cfg.onWinReset !== false}
          disabled={active}
          onReset={() =>
            !active &&
            setCfg((c) => ({ ...c, onWinReset: true }))
          }
          onIncrease={() =>
            !active &&
            setCfg((c) => ({ ...c, onWinReset: false }))
          }
          multiplier={cfg.onWinMultiplier}
          onMultiplierChange={setWinMult}
          inputTestId="casino-auto-onwin"
          resetTestId="autobet-on-win-mode-reset"
          increaseTestId="autobet-on-win-mode-increase"
        />
      </div>

      {active && pendingMs > 0 && p.countdownSlot ? p.countdownSlot(secondsRemaining, pendingMs) : null}

      {active && (
        <div
          className="grid grid-cols-3 gap-2 rounded-md bg-(--color-surface-elev) p-2 text-[10px] tabular-nums"
          data-testid="casino-auto-stats"
        >
          <Stat label={t("casino.auto.remaining")} value={remainingLabel} />
          <Stat label={t("casino.auto.nextStake")} value={runningStake} />
          <Stat
            label={t("casino.auto.profit")}
            value={cumulativeProfit}
            tone={
              Number(cumulativeProfit) > 0
                ? "win"
                : Number(cumulativeProfit) < 0
                  ? "loss"
                  : undefined
            }
          />
        </div>
      )}

      {active && pausedByHidden && (
        <p
          aria-live="polite"
          className="text-center text-[11px] text-(--color-warn)"
          data-testid="casino-auto-paused-hidden"
        >
          {t("casino.auto.pausedHidden")}
        </p>
      )}

      <button
        type="button"
        onClick={active ? handleStop : start}
        disabled={startDisabled || stopping}
        data-testid="casino-auto-toggle"
        aria-busy={stopping}
        className={cn(
          "min-h-12 rounded-lg text-sm font-bold uppercase tracking-wider transition-opacity",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
          "disabled:cursor-not-allowed disabled:opacity-50",
          active
            ? "bg-(--color-warn) text-(--color-primary-foreground) hover:opacity-90"
            : "bg-(--color-primary) text-(--color-primary-foreground) hover:opacity-90",
        )}
      >
        {stopping
          ? t("casino.auto.stoppingAfterCurrent")
          : active
            ? t("casino.auto.stop")
            : t("casino.auto.start")}
      </button>

      {!active && !hasStopCondition && (
        <p
          className="text-center text-[11px] text-(--color-warn)"
          data-testid="casino-auto-requires-stop"
        >
          {t("casino.auto.requiresStop")}
        </p>
      )}

      {!active && p.startDisabledReason && (
        <p
          className="text-center text-[11px] text-(--color-warn)"
          data-testid="casino-auto-start-blocked"
        >
          {p.startDisabledReason}
        </p>
      )}

      {p.errorReason && (
        <p
          className="text-center text-[11px] text-(--color-warn)"
          data-testid="casino-auto-error"
        >
          {p.errorReason}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "min-h-9 w-full rounded-md border border-border bg-(--color-surface) px-2 text-right font-mono text-xs tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) disabled:opacity-60";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "win" | "loss";
}) {
  return (
    <div className="grid gap-0.5">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-mono",
          tone === "win" && "text-(--color-win)",
          tone === "loss" && "text-(--color-loss)",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * P2.0b · per-outcome adjustment row.
 * Segmented control: Reset (safe default) | Increase by %. The %
 * input is preserved (testid `casino-auto-{onwin|onloss}`) for E2E
 * backward compatibility; it is greyed when Reset is active.
 */
function ModeRow({
  label,
  isReset,
  disabled,
  onReset,
  onIncrease,
  multiplier,
  onMultiplierChange,
  inputTestId,
  resetTestId,
  increaseTestId,
}: {
  label: string;
  isReset: boolean;
  disabled: boolean;
  onReset: () => void;
  onIncrease: () => void;
  multiplier: number;
  onMultiplierChange: (v: string) => void;
  inputTestId: string;
  resetTestId: string;
  increaseTestId: string;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div
        role="tablist"
        aria-label={label}
        className="grid grid-cols-2 gap-1 rounded-md bg-(--color-surface-elev) p-0.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isReset}
          onClick={onReset}
          disabled={disabled}
          data-testid={resetTestId}
          className={cn(
            "min-h-7 rounded text-[10px] font-semibold tabular-nums transition-colors",
            isReset
              ? "bg-(--color-surface) text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
            "disabled:opacity-60",
          )}
        >
          {t("casino.auto.modeReset")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isReset}
          onClick={onIncrease}
          disabled={disabled}
          data-testid={increaseTestId}
          className={cn(
            "min-h-7 rounded text-[10px] font-semibold tabular-nums transition-colors",
            !isReset
              ? "bg-(--color-surface) text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
            "disabled:opacity-60",
          )}
        >
          {t("casino.auto.modeIncrease")}
        </button>
      </div>
      <div className="flex items-center gap-1">
        <input
          inputMode="decimal"
          value={String(multiplier)}
          onChange={(e) => onMultiplierChange(e.target.value)}
          disabled={disabled || isReset}
          className={inputCls}
          data-testid={inputTestId}
          aria-label={t("casino.auto.increasePercent")}
        />
        <span className="px-1 text-[10px] text-muted-foreground">×</span>
      </div>
    </div>
  );
}
