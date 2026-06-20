import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, FileLock2, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/i18n";
import { FairnessSheet } from "@/components/games/shared/FairnessSheet";
import type { GameCode } from "@/components/games/shared/types";
import {
  loadFairnessHistory,
  truncateSeed,
  type FairnessHistoryRow,
} from "../casino/load-fairness-history";

const STEPS = [
  { Icon: FileLock2, k: 1 },
  { Icon: KeyRound, k: 2 },
  { Icon: ShieldCheck, k: 3 },
] as const;

export function ImportedGamesFairnessPage() {
  const [rows, setRows] = useState<FairnessHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadFairnessHistory()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-5xl gap-6 p-4 md:p-6">
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

        <section className="grid gap-3" aria-labelledby="fairness-history-heading">
          <h2 id="fairness-history-heading" className="text-lg font-semibold">
            {t("casino.fairness.history.heading")}
          </h2>

          {loading ? (
            <p className="text-sm text-muted-foreground" aria-busy="true">
              {t("common.loading")}
            </p>
          ) : rows.length === 0 ? (
            <div
              className="grid gap-2 rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center"
              data-testid="casino-fairness-empty"
            >
              <ShieldCheck className="mx-auto size-8 text-muted-foreground/50" aria-hidden />
              <p className="text-sm font-medium text-foreground">
                {t("casino.fairness.history.empty")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("casino.fairness.history.emptyHint")}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left">
                        {t("casino.fairness.history.col.game")}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        {t("casino.fairness.history.col.round")}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        {t("casino.fairness.history.col.serverHash")}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        {t("casino.fairness.history.col.revealedSeed")}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        {t("casino.fairness.history.col.outcome")}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        {t("casino.fairness.history.col.settledAt")}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left">
                        {t("games.fair.verify")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <HistoryTableRow key={row.betId} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:hidden">
                {rows.map((row) => (
                  <HistoryMobileCard key={row.betId} row={row} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function HistoryTableRow({ row }: { row: FairnessHistoryRow }) {
  return (
    <tr className="border-t border-border/40 hover:bg-muted/20">
      <td className="px-4 py-3 font-mono text-xs">{row.game}</td>
      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
        {truncateSeed(row.roundId)}
      </td>
      <td className="px-4 py-3">
        <CopyCell value={row.serverSeedHash} full={row.serverSeedHash} />
      </td>
      <td className="px-4 py-3">
        <CopyCell value={truncateSeed(row.serverSeed)} full={row.serverSeed} />
      </td>
      <td className="px-4 py-3">
        <OutcomeBadge outcome={row.outcome} />
      </td>
      <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
        {formatSettledAt(row.settledAt)}
      </td>
      <td className="px-4 py-3">
        <FairnessVerifyTrigger row={row} />
      </td>
    </tr>
  );
}

function HistoryMobileCard({ row }: { row: FairnessHistoryRow }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-mono text-sm">{row.game}</CardTitle>
        <OutcomeBadge outcome={row.outcome} />
      </CardHeader>
      <CardContent className="grid gap-2 text-xs">
        <DetailRow
          label={t("casino.fairness.history.col.round")}
          value={truncateSeed(row.roundId)}
          mono
        />
        <DetailRow
          label={t("casino.fairness.history.col.serverHash")}
          value={truncateSeed(row.serverSeedHash)}
          full={row.serverSeedHash}
          copy
        />
        <DetailRow
          label={t("casino.fairness.history.col.revealedSeed")}
          value={truncateSeed(row.serverSeed)}
          full={row.serverSeed}
          copy
        />
        <DetailRow
          label={t("casino.fairness.history.col.settledAt")}
          value={formatSettledAt(row.settledAt)}
          mono
        />
        <FairnessVerifyTrigger row={row} />
      </CardContent>
    </Card>
  );
}

function FairnessVerifyTrigger({ row }: { row: FairnessHistoryRow }) {
  const [clientSeed, setClientSeed] = useState(row.clientSeed);

  useEffect(() => {
    setClientSeed(row.clientSeed);
  }, [row.clientSeed, row.betId]);

  return (
    <FairnessSheet
      gameCode={row.game as GameCode}
      clientSeed={clientSeed}
      nonce={row.nonce}
      commitment={row.commitment}
      verification={row.sheetVerification}
      onClientSeedChange={setClientSeed}
      trigger={
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <ShieldCheck className="size-3.5" aria-hidden />
          {t("games.fair.verify")}
        </Button>
      }
    />
  );
}

function CopyCell({ value, full }: { value: string; full: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="font-mono text-xs tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => void copyText(full)}
        aria-label={t("games.shared.fairness.copyLabel", { label: value })}
        className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
      >
        <Copy className="size-3" aria-hidden />
      </button>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  full,
  copy = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  full?: string;
  copy?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1.5">
        <span className={`truncate ${mono ? "font-mono tabular-nums" : ""}`}>{value}</span>
        {copy && full ? (
          <button
            type="button"
            onClick={() => void copyText(full)}
            aria-label={t("games.shared.fairness.copyLabel", { label })}
            className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          >
            <Copy className="size-3" aria-hidden />
          </button>
        ) : null}
      </span>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: "won" | "lost" }) {
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

function formatSettledAt(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

async function copyText(text: string) {
  try {
    await navigator.clipboard?.writeText(text);
    toast.success(t("games.shared.copied"));
  } catch {
    toast.error(t("common.retry"));
  }
}
