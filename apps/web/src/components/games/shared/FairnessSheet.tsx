import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, Copy, ShieldCheck } from "lucide-react";
import { t } from "@/i18n";
import { toFairnessUi } from "./adapt-verification";
import type {
  FairnessUiEvidence,
  GameCode,
  PhonaraVerificationEvidence,
  RoundCommitment,
} from "./types";

export interface FairnessSheetProps {
  gameCode: GameCode;
  clientSeed: string;
  /** Current nonce; defaults to 1. */
  nonce?: number;
  commitment: RoundCommitment | null;
  /** Accepts PHONARA snake_case or Lovable camelCase; normalized via toFairnessUi. */
  verification: FairnessUiEvidence | PhonaraVerificationEvidence | null;
  onClientSeedChange: (v: string) => void;
  trigger?: React.ReactNode;
}

const VERIFY_SNIPPET = `// PHONARA fairness verification (node / browser)
import { verifyRound } from '@phonara/game-engine';

await verifyRound({
  game,                // GameCode
  serverSeed,          // revealed after round
  serverSeedHash,      // commitment.server_seed_hash
  clientSeed,
  nonce: 1,
  selection,
  expectedResult,      // from bet result
});
// HMAC-SHA256(key=serverSeed, msg=\`\${clientSeed}:\${nonce}:\${cursor}\`)
`;

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
          className="flex items-center gap-1 text-foreground/70 hover:text-foreground"
          aria-label={t("games.shared.fairness.copyLabel", { label })}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? t("games.shared.copied") : t("games.shared.copy")}
        </button>
      </div>
      <div
        className={`break-all rounded border border-border bg-(--color-surface) p-2 text-[11px] ${mono ? "font-mono" : ""}`}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export function FairnessSheet({
  gameCode,
  clientSeed,
  nonce = 1,
  commitment,
  verification,
  onClientSeedChange,
  trigger,
}: FairnessSheetProps) {
  // #P2.0c-T5 — single normalization site for verification evidence.
  const ui = toFairnessUi(verification);
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <ShieldCheck className="size-3.5" />
            Provably Fair
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        data-testid="casino-fairness-verifier"
        className="w-full max-w-md overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-(--color-primary)" />
            {t("games.shared.verify.title", { game: gameCode })}
          </SheetTitle>
          <SheetDescription>
            {t("games.shared.verify.desc")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 grid gap-4 px-4">
          <Row label={t("games.shared.verify.serverSeedHash")} value={commitment?.server_seed_hash ?? ""} />
          <Row
            label={t("games.shared.verify.serverSeed")}
            value={ui?.serverSeed ?? t("games.shared.verify.serverSeedAfter")}
          />

          <div className="grid gap-1">
            <label
              htmlFor="cs"
              className="text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              {t("games.shared.verify.clientSeed")}
            </label>
            <input
              id="cs"
              value={clientSeed}
              onChange={(e) => onClientSeedChange(e.target.value.slice(0, 64))}
              data-testid="casino-client-seed-input"
              className="min-h-10 rounded border border-border bg-(--color-surface) px-2 font-mono text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            />
          </div>

          <Row label={t("games.shared.verify.nonce")} value={String(nonce)} />
          <Row label={t("games.shared.verify.cursor")} value={String(ui?.cursor ?? 0)} />
          <Row label={t("games.shared.verify.hmac")} value={ui?.hmac ?? "—"} />

          {ui && (
            <div
              className={`rounded-md border p-3 text-xs ${
                ui.ok
                  ? "border-(--color-up)/40 bg-(--color-up)/10 text-(--color-up)"
                  : "border-(--color-down)/40 bg-(--color-down)/10 text-(--color-down)"
              }`}
            >
              {ui.ok
                ? t("games.shared.verify.ok")
                : t("games.shared.verify.fail")}
            </div>
          )}

          <details className="rounded-md border border-border bg-(--color-surface)/60 p-3">
            <summary className="cursor-pointer text-xs font-medium">{t("games.shared.fairness.snippetTitle")}</summary>
            <pre className="mt-2 overflow-x-auto rounded bg-(--color-surface-elev) p-2 text-[10px] leading-relaxed">
              {VERIFY_SNIPPET}
            </pre>
          </details>
        </div>
      </SheetContent>
    </Sheet>
  );
}
