/**
 * GameRulesSheet + GameRulesTrigger
 *
 * Per-game rules UI mandated by PLATFORM MANIFEST §2.6. Each of the 10
 * casino games must wire `GameRulesTrigger` (HUD "?" button) to a
 * `GameRulesSheet` (vaul bottom sheet) and source ALL copy from i18n
 * (`casino.rules.{gameCode}.*`). No hardcoded Korean in JSX.
 *
 * Required catalog keys per game (ko + en mirror):
 *   casino.rules.{gameCode}.title
 *   casino.rules.{gameCode}.summary
 *   casino.rules.{gameCode}.step1..stepN     (N ≥ 4)
 *   casino.rules.{gameCode}.tip1..tipM       (M ≥ 2)
 *   casino.rules.{gameCode}.payout
 *   casino.rules.{gameCode}.fairnessLink
 * Shared:
 *   casino.rules.common.cta   ("게임 방법" / "How to play")
 *   casino.rules.common.close ("닫기"     / "Close")
 *
 * Tone: 초등학생도 이해할 수 있도록 친절·구어체. Step/tip 안의 이모지는
 * 문단당 0–1개 허용 (베팅 토스트의 emoji-0 규칙과 별개).
 *
 * Testid: `casino-game-rules` on the trigger button.
 */
import { useMemo } from "react";
import { Drawer } from "vaul";
import { HelpCircle, X, ShieldCheck } from "lucide-react";
import { t } from "@/i18n";
import type { GameCode } from "./types";

export interface GameRulesSheetProps {
  gameCode: GameCode;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Optional callback when user taps the "Provably Fair" link inside the sheet. */
  onOpenFairness?: () => void;
}

function collectKeyedLines(prefix: string, max = 12): string[] {
  // Pull keys casino.rules.{gameCode}.{prefix}{1..max} that have a translation.
  const out: string[] = [];
  for (let i = 1; i <= max; i++) {
    const k = `${prefix}${i}`;
    const v = t(k);
    if (v && v !== k) out.push(v);
  }
  return out;
}

export function GameRulesSheet({
  gameCode,
  open,
  onOpenChange,
  onOpenFairness,
}: GameRulesSheetProps) {
  const base = `casino.rules.${gameCode}`;
  const title = t(`${base}.title`);
  const summary = t(`${base}.summary`);
  const payout = t(`${base}.payout`);
  const fairnessLink = t(`${base}.fairnessLink`);
  const close = t("casino.rules.common.close");

  const steps = useMemo(() => collectKeyedLines(`${base}.step`), [base]);
  const tips = useMemo(() => collectKeyedLines(`${base}.tip`, 6), [base]);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          data-testid="casino-game-rules-sheet"
          className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[88vh] flex-col rounded-t-2xl border-t border-(--color-border) bg-(--color-surface) outline-none"
        >
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-(--color-border)" />
          <div className="flex items-start justify-between px-5 pt-3 pb-2">
            <div className="grid gap-1">
              <h2 className="text-lg font-semibold leading-tight">{title}</h2>
              {summary && summary !== `${base}.summary` && (
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
            className="flex-1 overflow-y-auto px-5 pb-[env(safe-area-inset-bottom)] pt-2"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
          >
            {steps.length > 0 && (
              <ol className="grid gap-3" data-testid="casino-game-rules-steps">
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
                data-testid="casino-game-rules-tips"
              >
                <div className="text-xs font-medium uppercase tracking-wider text-(--color-muted-foreground)">
                  {t("casino.rules.common.tipsLabel")}
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

            {payout && payout !== `${base}.payout` && (
              <div className="mt-5 rounded-xl border border-(--color-primary)/30 bg-(--color-primary)/8 p-4">
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-(--color-primary)">
                  {t("casino.rules.common.payoutLabel")}
                </div>
                <p className="text-sm leading-relaxed">{payout}</p>
              </div>
            )}

            {fairnessLink && fairnessLink !== `${base}.fairnessLink` && (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onOpenFairness?.();
                }}
                className="mt-5 flex w-full items-center justify-between rounded-xl border border-(--color-border) px-4 py-3 text-sm hover:bg-(--color-muted)"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-(--color-primary)" />
                  {fairnessLink}
                </span>
                <span className="text-(--color-muted-foreground)">→</span>
              </button>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export interface GameRulesTriggerProps {
  onOpen: () => void;
  /** Optional override; defaults to `casino.rules.common.cta`. */
  label?: string;
  className?: string;
}

/**
 * HUD-top-right "?" button. Always carries `casino-game-rules` testid for
 * the Phase 2–4 game gates.
 */
export function GameRulesTrigger({ onOpen, label, className }: GameRulesTriggerProps) {
  const cta = label ?? t("casino.rules.common.cta");
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="casino-game-rules"
      aria-label={cta}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-muted)/30 px-3 py-1.5 text-xs font-medium text-(--color-foreground)/90 hover:bg-(--color-muted)"
      }
    >
      <HelpCircle className="size-3.5" />
      <span>{cta}</span>
    </button>
  );
}
