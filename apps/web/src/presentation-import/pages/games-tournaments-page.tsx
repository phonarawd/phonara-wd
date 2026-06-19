import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { t } from "@/i18n";

/** Display-only — no Supabase / RPC. */
export function ImportedGamesTournamentsPage() {
  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-3xl gap-4 p-4 md:p-6">
        <header className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-(--color-warn)/15 text-(--color-warn)">
            <Trophy className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-medium">{t("games.tournament.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("games.tournament.subtitle")}</p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("games.tournament.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-5">
            <Row k={t("games.tournament.prize")} v="₩5,000,000" />
            <Row k={t("games.tournament.participants")} v="—" />
            <Row k={t("games.tournament.endsIn")} v="—" />
            <Button size="sm" disabled className="w-fit">
              {t("games.tournament.cta")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium tabular-nums">{v}</span>
    </div>
  );
}
