import { cn } from "@/lib/utils";
import { Copy, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/i18n";

export interface ReferralQuickCardProps {
  code: string;
  inviteUrl: string;
  /** Localized display string only — e.g. "Friends 0/5 invited". */
  progressLabel: string;
  /** Localized display string only — e.g. "+10,000P / friend". */
  rewardLabel: string;

  className?: string;
}

export function ReferralQuickCard({
  code,
  inviteUrl,
  progressLabel,
  rewardLabel,
  className,
}: ReferralQuickCardProps) {
  const share = async () => {
    // Wave 3R — KakaoTalk mock deep link first; SDK NOT integrated.
    try {
      if (typeof window !== "undefined") {
        const kakaoUrl = `kakaolink://send?url=${encodeURIComponent(inviteUrl)}`;
        // Best-effort attempt; ignore failures and fall through.
        window.location.href = kakaoUrl;
      }
    } catch {
      // ignore — fall through to Web Share / clipboard
    }
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share({
          title: t("referral.share.title"),
          text: t("referral.share.text", { code }),
          url: inviteUrl,
        });
        return;
      }
    } catch (err) {
      // User-cancelled share — respect intent, no toast, no clipboard fallback.
      if (err instanceof Error && err.name === "AbortError") return;
      // Other share failures fall through to clipboard.
    }
    try {
      await navigator.clipboard?.writeText(inviteUrl);
      toast.success(t("referral.toast.linkCopied"));
    } catch {
      toast(t("referral.toast.clipboardUnavailable"));
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard?.writeText(code);
      toast.success(t("referral.toast.codeCopied"));
    } catch {
      toast(t("referral.toast.clipboardUnavailable"));
    }
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4 text-(--color-primary)" aria-hidden />
          {t("referral.card.title")}
        </div>
      </div>

      <div className="grid gap-2 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{progressLabel}</span>
          <span className="text-(--color-gold)">{rewardLabel}</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-(--color-surface) px-3 py-2">
          <code className="flex-1 truncate text-xs">{inviteUrl}</code>
          <button
            type="button"
            onClick={copyCode}
            aria-label={t("referral.aria.copyCode")}
            className="grid h-10 w-10 place-items-center rounded text-muted-foreground hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          >
            <Copy className="size-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={share}
        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-(--color-primary) text-sm font-semibold text-(--color-primary-foreground) transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
      >
        <Share2 className="size-4" aria-hidden />
        {t("referral.btn.share")} · {t("earn.referral.kakao")}
      </button>
      <p className="mt-2 text-[10px] text-muted-foreground/80">
        {t("earn.referral.disclosure")}
      </p>
    </div>
  );
}
