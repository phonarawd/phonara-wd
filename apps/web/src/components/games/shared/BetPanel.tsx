import { type ReactNode, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { formatStakeStep } from "@/lib/money-input";
import type { Currency } from "./types";
import { useHaptics } from "./hooks/useHaptics";
import { useSound } from "./hooks/useSound";
import "./motion-tokens.css";

export interface BetPanelProps {
  stake: string;
  currency: Currency;
  availableBalance: string | null;
  busy: boolean;
  /** Whether the round commitment is ready (after prepare). */
  ready: boolean;
  /** Min/max stake (decimal strings). Display-only guards. */
  minStake?: string;
  maxStake?: string;
  /** Above-the-button section (game-specific selection UI). */
  children?: ReactNode;
  /** Optional auto-bet block; renders inside a collapsible row. */
  autoBet?: ReactNode;
  /** Primary CTA label, e.g. "베팅", "캐시아웃 2.10×". */
  primaryLabel: string;
  /** Secondary CTA label, e.g. "라운드 준비". Omit to hide. */
  secondaryLabel?: string;
  onStakeChange: (v: string) => void;
  onCurrencyChange: (c: Currency) => void;
  onPrimary: () => void;
  onSecondary?: () => void;
  disabledReason?: string | null;
  /** Primary CTA visual size. `"xl"` opt-in (crash). Default = compact. */
  primarySize?: "default" | "xl";
}

const CHIPS: { label: string; fn: (n: number) => number }[] = [
  { label: "½", fn: (n) => n / 2 },
  { label: "2×", fn: (n) => n * 2 },
  { label: "MAX", fn: () => Number.POSITIVE_INFINITY },
];

/** Sanitize a decimal string input. Allows leading 0, one dot, digits. */
function clean(input: string): string {
  let v = input.replace(/[^\d.]/g, "");
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
  }
  if (v.startsWith(".")) v = "0" + v;
  // cap fractional to 6 digits
  const [a, b] = v.split(".");
  return b !== undefined ? `${a ?? ""}.${b.slice(0, 6)}` : (a ?? "");
}

export function BetPanel({
  stake,
  currency,
  availableBalance,
  busy,
  ready,
  minStake,
  maxStake,
  children,
  autoBet,
  primaryLabel,
  secondaryLabel,
  onStakeChange,
  onCurrencyChange,
  onPrimary,
  onSecondary,
  disabledReason,
  primarySize = "default",
}: BetPanelProps) {
  const haptics = useHaptics();
  const { play, muted, setMuted } = useSound();

  const applyChip = useCallback(
    (chip: (typeof CHIPS)[number]) => {
      const cur = Number(stake) || 0;
      const max = maxStake ? Number(maxStake) : Number(availableBalance ?? "0");
      let next = chip.fn(cur);
      if (!Number.isFinite(next)) next = max || cur;
      if (next < 0) next = 0;
      if (max && next > max) next = max;
      onStakeChange(formatStakeStep(next));
      play("tick");
    },
    [stake, maxStake, availableBalance, onStakeChange, play],
  );

  const primaryDisabled = busy || Boolean(disabledReason);

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-3">
      {/* Currency toggle + sound mute */}
      <div className="flex min-w-0 items-center gap-2">
        <div
          role="tablist"
          aria-label="통화"
          className="grid min-w-0 flex-1 grid-cols-2 gap-1 rounded-lg bg-(--color-surface-elev) p-1"
        >
          {(["PHON", "USDT"] as Currency[]).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={currency === c}
              type="button"
              onClick={() => onCurrencyChange(c)}
              className={cn(
                "min-h-9 rounded-md text-xs font-semibold tabular-nums transition-colors",
                currency === c
                  ? "bg-(--color-surface) text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setMuted(!muted)}
          aria-label={muted ? "sound on" : "sound off"}
          aria-pressed={!muted}
          data-testid="casino-sound-toggle"
          className="game-press-feedback grid size-9 shrink-0 place-items-center rounded-md border border-border bg-(--color-surface-elev) text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
        >
          {muted ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
        </button>
      </div>

      {/* Stake input */}
      <div>
        <div className="mb-1 flex items-baseline justify-between text-[11px] text-muted-foreground">
          <span>베팅 금액</span>
          <span className="tabular-nums">
            잔고 {availableBalance ?? "—"} {currency}
          </span>
        </div>
        <input
          inputMode="decimal"
          value={stake}
          onChange={(e) => onStakeChange(clean(e.target.value))}
          className="min-h-11 w-full rounded-md border border-border bg-(--color-surface) px-3 text-right font-mono text-base tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          placeholder="0.00"
          aria-label="베팅 금액"
          data-testid="casino-stake-input"
        />
        <div className="mt-1 grid grid-cols-3 gap-1">
          {CHIPS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => applyChip(c)}
              className="min-h-10 rounded-md border border-border bg-(--color-surface) text-xs font-semibold hover:bg-(--color-surface-elev)"
              aria-label={`stake ${c.label}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {(minStake || maxStake) && (
          <div className="mt-1 text-[10px] tabular-nums text-muted-foreground">
            {minStake && <>min {minStake}</>}
            {minStake && maxStake && " · "}
            {maxStake && <>max {maxStake}</>}
          </div>
        )}

      </div>

      {/* Selection slot */}
      {children}

      {/* CTAs */}
      <div className="grid gap-2">
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={() => {
              haptics("soft");
              onSecondary();
            }}
            disabled={busy || ready}
            data-testid="casino-prepare-hash"
            className="min-h-10 rounded-md border border-border bg-(--color-surface) text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {ready ? t("casino.action.hash_committed") : secondaryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            haptics("tap");
            play("click");
            onPrimary();
          }}
          disabled={primaryDisabled}
          data-testid="casino-place-bet"
          className={cn(
            "game-press-feedback rounded-lg bg-(--color-primary) font-bold uppercase tracking-wider text-(--color-primary-foreground)",
            primarySize === "xl"
              ? "min-h-14 text-base"
              : "min-h-12 text-sm",
            "hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {busy ? "처리 중..." : primaryLabel}
        </button>
        {disabledReason && (
          <p className="text-center text-[11px] text-(--color-warn)" data-testid="casino-error">
            {disabledReason}
          </p>
        )}
      </div>

      {autoBet}
    </div>
  );
}
