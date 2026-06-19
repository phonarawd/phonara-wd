/**
 * TradeRulesSheet + TradeRulesTrigger
 *
 * Mirrors GameRulesSheet (PLATFORM §2.6 pattern) for /trade. All copy comes
 * from i18n `trade.rules.*` — no hardcoded Korean in JSX (LOCK L9).
 * No fairness link block (trade has no PF surface).
 */
import { useMemo } from "react";
import { Drawer } from "vaul";
import { HelpCircle, X } from "lucide-react";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

const BASE = "trade.rules";

function collectKeyedLines(prefix: string, max = 12): string[] {
  const out: string[] = [];
  for (let i = 1; i <= max; i++) {
    const k = `${prefix}${i}`;
    const v = t(k);
    if (v && v !== k) out.push(v);
  }
  return out;
}

export interface TradeRulesSheetProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

export function TradeRulesSheet({ open, onOpenChange }: TradeRulesSheetProps) {
  const title = t(`${BASE}.title`);
  const summary = t(`${BASE}.summary`);
  const payout = t(`${BASE}.payout`);
  const close = t(`${BASE}.close`);

  const steps = useMemo(() => collectKeyedLines(`${BASE}.step`), []);
  const tips = useMemo(() => collectKeyedLines(`${BASE}.tip`, 6), []);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          data-testid="trade-rules-sheet"
          className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[88vh] flex-col rounded-t-2xl border-t border-(--color-border) bg-(--color-surface) outline-none"
        >
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-(--color-border)" />
          <div className="flex items-start justify-between px-5 pt-3 pb-2">
            <div className="grid gap-1">
              <h2 className="text-lg font-semibold leading-tight">{title}</h2>
              {summary && summary !== `${BASE}.summary` && (
                <p className="text-sm text-(--color-muted-foreground)">{summary}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={close}
              className="grid size-9 place-items-center rounded-full text-(--color-muted-foreground) hover:bg-(--color-muted)"
            >
              <X className="size-4" />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto px-5 pt-2"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
          >
            {steps.length > 0 && (
              <ol className="grid gap-3" data-testid="trade-rules-steps">
                {steps.map((line, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-(--color-primary)/15 text-xs font-bold text-(--color-primary) tabular-nums">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-(--color-foreground)/90">
                      {line}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {tips.length > 0 && (
              <div
                className="mt-5 grid gap-2 rounded-xl border border-(--color-border) bg-(--color-muted)/40 p-4"
                data-testid="trade-rules-tips"
              >
                <div className="text-xs font-medium uppercase tracking-wider text-(--color-muted-foreground)">
                  {t(`${BASE}.tipsLabel`)}
                </div>
                <ul className="grid gap-2">
                  {tips.map((line, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {payout && payout !== `${BASE}.payout` && (
              <div className="mt-5 rounded-xl border border-(--color-primary)/30 bg-(--color-primary)/8 p-4">
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-(--color-primary)">
                  {t(`${BASE}.payoutLabel`)}
                </div>
                <p className="text-sm leading-relaxed">{payout}</p>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export interface TradeRulesTriggerProps {
  onClick: () => void;
  className?: string;
}

export function TradeRulesTrigger({ onClick, className }: TradeRulesTriggerProps) {
  const label = t(`${BASE}.cta`);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-testid="trade-rules"
      className={cn(
        "grid size-9 place-items-center rounded-full text-(--color-muted-foreground) hover:bg-(--color-surface-elev) hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
        className,
      )}
    >
      <HelpCircle className="size-4" aria-hidden />
    </button>
  );
}
