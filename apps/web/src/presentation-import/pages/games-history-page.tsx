import { Link } from "@/shims/react-router-dom";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { t } from "@/i18n";

// Display-only — no Supabase / RPC.
export function ImportedGamesHistoryPage() {
  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-3xl gap-4 p-4 md:p-6">
        <header>
          <h1 className="text-2xl font-medium">{t("games.history.title")}</h1>
        </header>
        <Card>
          <CardContent className="grid place-items-center gap-3 p-12 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-(--color-surface-elev)">
              <History className="size-5 text-muted-foreground" aria-hidden />
            </span>
            <div className="text-base font-medium">{t("games.history.empty.title")}</div>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("games.history.empty.desc")}
            </p>
            <Link to="/casino">
              <Button size="sm">{t("games.history.empty.cta")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
