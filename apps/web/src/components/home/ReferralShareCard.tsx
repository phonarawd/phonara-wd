import { useState } from "react";
import { Copy, Check, Share2, Users } from "lucide-react";
import { t } from "@/i18n";
import { useReducedMotionGuard } from "@/games/shared/hooks/useReducedMotionGuard";

/**
 * L1-07 Phase 7 viral v0.1 — Referral share card (mock display only).
 * Engine/RPC 0. Mock SHARE_CODE constant. Web Share + clipboard fallback.
 */
const SHARE_CODE = "PHN-A1B2";
const INVITED_THIS_WEEK = 42;

export function ReferralShareCard() {
  const [copied, setCopied] = useState(false);
  const reduced = useReducedMotionGuard();

  const shareUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${SHARE_CODE}`
      : `/?ref=${SHARE_CODE}`;

  const flash = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_CODE);
      flash();
    } catch {
      /* clipboard unavailable */
    }
  };

  const onShare = async () => {
    const data = {
      title: t("referral.share.title"),
      text: t("referral.share.text", { code: SHARE_CODE }),
      url: shareUrl(),
    };
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    const canShare = !!nav && typeof (nav as Navigator & { share?: unknown }).share === "function";
    try {
      if (canShare) {
        await (nav as Navigator & { share: (d: ShareData) => Promise<void> }).share(data);
      } else if (nav) {
        await nav.clipboard.writeText(`${data.text} ${data.url}`);
        flash();
      }
    } catch {
      /* user cancelled or share failed */
    }
  };

  return (
    <section
      data-testid="referral-share-card"
      data-hub-id="home-referral-share"
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/40 p-4 backdrop-blur-sm md:p-5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="relative grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-center">
        {/* LEFT — title + subtitle + reward chip + social proof */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-gold tabular-nums ${
                reduced ? "" : "animate-pulse"
              }`}
            >
              {t("referral.share.card.reward")}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
              <Users className="h-3 w-3" />
              {t("referral.share.card.invitedThisWeek", { count: INVITED_THIS_WEEK })}
            </span>
          </div>
          <h3 className="text-base font-bold leading-tight text-foreground md:text-lg">
            {t("referral.share.card.title")}
          </h3>
          <p className="text-xs text-muted-foreground md:text-sm">
            {t("referral.share.card.subtitle")}
          </p>
        </div>

        {/* RIGHT — code + CTAs */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3 py-2">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("referral.share.card.codeLabel")}
              </span>
              <span className="font-mono text-sm font-semibold tracking-wider text-foreground tabular-nums">
                {SHARE_CODE}
              </span>
            </div>
            <button
              type="button"
              onClick={onCopy}
              data-testid="referral-share-copy"
              aria-label={t("referral.share.card.copy")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-gold" />
                  {t("referral.share.card.copied")}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  {t("referral.share.card.copy")}
                </>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={onShare}
            data-testid="referral-share-cta"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4" />
            {t("referral.share.card.share")}
          </button>
        </div>
      </div>
    </section>
  );
}
