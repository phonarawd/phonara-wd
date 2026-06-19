/**
 * PHONARA L1-09 Phase 6 polish · toast variants (additive).
 *
 * Re-exports sonner's `toast` augmented with PHONARA-specific variants:
 *   - `toast.reward(text, opts?)` — gold accent · longer dwell · for points/EXP gains
 *   - `toast.errorSharp(text, opts?)` — destructive ring · sharper dwell
 *
 * LOCK F10: existing `import { toast } from "sonner"` callsites are NOT
 * migrated. Default success/error already inherit PHONARA classNames via
 * the Toaster shell (`src/components/ui/sonner.tsx`). Import from this
 * module only when you need the new variants.
 */
import { toast as sonnerToast, type ExternalToast } from "sonner";

type RewardOpts = ExternalToast & { amount?: string | number };

function reward(text: string, opts?: RewardOpts) {
  return sonnerToast(text, {
    duration: 4200,
    className:
      "border-gold/60 text-gold tabular-nums shadow-[var(--shadow-glow-gold)]",
    ...opts,
  });
}

function errorSharp(text: string, opts?: ExternalToast) {
  return sonnerToast.error(text, {
    duration: 3600,
    ...opts,
  });
}

export const toast = Object.assign(sonnerToast, { reward, errorSharp }) as typeof sonnerToast & {
  reward: typeof reward;
  errorSharp: typeof errorSharp;
};
