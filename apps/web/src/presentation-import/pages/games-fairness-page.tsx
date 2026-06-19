import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, FileLock2, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/i18n";

// L1-13c · Display-only PF verify page.
// Presentation/mock data only — engine-free leaf.

type Outcome = "won" | "lost";

interface SeedRow {
  game: string;
  round: string;
  serverHash: string;
  revealedSeed: string;
  outcome: Outcome;
  settledAt: string;
}

const ROWS: ReadonlyArray<SeedRow> = [
  { game: "crash",     round: "184,221", serverHash: "3f7c…a91b", revealedSeed: "e2c1…04bd", outcome: "won",  settledAt: "2026-06-16 02:11" },
  { game: "dice",      round: "184,220", serverHash: "a1b2…c3d4", revealedSeed: "7799…11aa", outcome: "lost", settledAt: "2026-06-16 02:10" },
  { game: "plinko",    round: "184,219", serverHash: "9090…bbcc", revealedSeed: "dd44…2233", outcome: "won",  settledAt: "2026-06-16 02:08" },
  { game: "limbo",     round: "184,218", serverHash: "cafe…d00d", revealedSeed: "1234…5678", outcome: "lost", settledAt: "2026-06-16 02:05" },
  { game: "mines",     round: "184,217", serverHash: "0bad…f00d", revealedSeed: "feed…face", outcome: "won",  settledAt: "2026-06-16 01:58" },
  { game: "hilo",      round: "184,216", serverHash: "b16b…00b5", revealedSeed: "5e1f…0001", outcome: "won",  settledAt: "2026-06-16 01:51" },
  { game: "blackjack", round: "184,215", serverHash: "5e1d…aa01", revealedSeed: "7e57…d055", outcome: "lost", settledAt: "2026-06-16 01:43" },
  { game: "roulette",  round: "184,214", serverHash: "c001…d09e", revealedSeed: "acdc…2112", outcome: "won",  settledAt: "2026-06-16 01:30" },
];

const STEPS = [
  { Icon: FileLock2,   k: 1 },
  { Icon: KeyRound,    k: 2 },
  { Icon: ShieldCheck, k: 3 },
] as const;

function copyMock(label: string) {
  toast.success(t("games.shared.fairness.copyLabel", { label }));
}

export function ImportedGamesFairnessPage() {
  const onVerify = () => toast.success(t("casino.fairness.verify.toast"));

  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-5xl gap-6 p-4 md:p-6">
        {/* Hero */}
        <header className="grid gap-2">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-(--color-primary)/15 text-(--color-primary)">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <h1 className="text-2xl font-semibold md:text-3xl">{t("games.fair.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground md:text-base">
            {t("casino.fairness.subtitle")}
          </p>
        </header>

        {/* P1 · 3-step explainer */}
        <ol className="grid gap-3 md:grid-cols-3" aria-label={t("games.fair.verify")}>
          {STEPS.map(({ Icon, k }) => (
            <li
              key={k}
              className="grid gap-2 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-lg bg-(--color-primary)/15 text-(--color-primary)">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  0{k}
                </span>
              </div>
              <div className="text-sm font-semibold">
                {t(`casino.fairness.step.${k}.title`)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t(`casino.fairness.step.${k}.body`)}
              </p>
            </li>
          ))}
        </ol>

        {/* P2 · Manual verify panel — display-only */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("games.fair.verify")}</CardTitle>
            <span className="rounded-full bg-(--color-warn)/15 px-2 py-0.5 text-[10px] font-semibold text-(--color-warn)">
              {t("casino.fairness.verify.mockNote")}
            </span>
          </CardHeader>
          <CardContent className="grid gap-3 p-5 text-sm">
            <Field label={t("games.fair.serverSeed")} value="3f7c2a8f9b0e4d1c6a5f8e3b2d7c9a91b" mono />
            <Field label={t("games.fair.clientSeed")} value="user-demo-seed" mono />
            <Field label={t("games.fair.nonce")}      value="1" mono />
            <Field label={t("casino.fairness.verify.outcome")} value="won" />

            <button
              type="button"
              onClick={onVerify}
              className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-(--color-primary) px-4 text-sm font-semibold text-(--color-primary-foreground) transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            >
              <Check className="size-4" aria-hidden />
              {t("casino.fairness.verify.cta")}
            </button>
          </CardContent>
        </Card>

        {/* P3 · Seed history (mock) */}
        <section className="grid gap-3" aria-labelledby="fairness-history-heading">
          <h2 id="fairness-history-heading" className="text-lg font-semibold">
            {t("casino.fairness.history.heading")}
          </h2>

          {/* desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">{t("casino.fairness.history.col.game")}</th>
                  <th scope="col" className="px-4 py-3 text-right">{t("casino.fairness.history.col.round")}</th>
                  <th scope="col" className="px-4 py-3 text-left">{t("casino.fairness.history.col.serverHash")}</th>
                  <th scope="col" className="px-4 py-3 text-left">{t("casino.fairness.history.col.revealedSeed")}</th>
                  <th scope="col" className="px-4 py-3 text-left">{t("casino.fairness.history.col.outcome")}</th>
                  <th scope="col" className="px-4 py-3 text-left">{t("casino.fairness.history.col.settledAt")}</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.round} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{row.game}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{row.round}</td>
                    <td className="px-4 py-3">
                      <CopyCell value={row.serverHash} label={t("casino.fairness.history.col.serverHash")} />
                    </td>
                    <td className="px-4 py-3">
                      <CopyCell value={row.revealedSeed} label={t("casino.fairness.history.col.revealedSeed")} />
                    </td>
                    <td className="px-4 py-3">
                      <OutcomeBadge outcome={row.outcome} />
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">{row.settledAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="grid gap-3 md:hidden">
            {ROWS.map((row) => (
              <Card key={row.round}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="font-mono text-sm">{row.game}</CardTitle>
                  <OutcomeBadge outcome={row.outcome} />
                </CardHeader>
                <CardContent className="grid gap-1.5 text-xs">
                  <Row label={t("casino.fairness.history.col.round")} value={row.round} mono />
                  <Row label={t("casino.fairness.history.col.serverHash")} value={row.serverHash} mono copy />
                  <Row label={t("casino.fairness.history.col.revealedSeed")} value={row.revealedSeed} mono copy />
                  <Row label={t("casino.fairness.history.col.settledAt")} value={row.settledAt} mono />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`flex items-center justify-between gap-2 rounded border border-border bg-(--color-surface) px-3 py-2 text-xs ${
          mono ? "font-mono tabular-nums" : "font-medium"
        }`}
      >
        <span className="truncate">{value}</span>
        <button
          type="button"
          onClick={() => copyMock(label)}
          aria-label={t("games.shared.fairness.copyLabel", { label })}
          className="grid size-7 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
        >
          <Copy className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function CopyCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="font-mono text-xs tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => copyMock(label)}
        aria-label={t("games.shared.fairness.copyLabel", { label })}
        className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
      >
        <Copy className="size-3" aria-hidden />
      </button>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const label =
    outcome === "won"
      ? t("casino.fairness.history.outcome.won")
      : t("casino.fairness.history.outcome.lost");
  const cls =
    outcome === "won"
      ? "bg-(--color-ok)/15 text-(--color-ok)"
      : "bg-(--color-danger)/15 text-(--color-danger)";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

function Row({
  label,
  value,
  mono = false,
  copy = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copy?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1.5">
        <span className={`truncate ${mono ? "font-mono tabular-nums" : ""}`}>{value}</span>
        {copy && (
          <button
            type="button"
            onClick={() => copyMock(label)}
            aria-label={t("games.shared.fairness.copyLabel", { label })}
            className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          >
            <Copy className="size-3" aria-hidden />
          </button>
        )}
      </span>
    </div>
  );
}
