import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";

export function HomeWelcomeCard() {
  return (
    <Card data-hub-id="home-welcome">
      <CardContent className="grid gap-1 p-5">
        <h2 className="text-base font-semibold">
          {t("home.hub.hero.title")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("home.hub.hero.desc")}
        </p>
        <p className="mt-2 text-sm font-medium">
          {t("home.section.welcome.title")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("home.section.welcome.desc")}
        </p>
      </CardContent>
    </Card>
  );
}
