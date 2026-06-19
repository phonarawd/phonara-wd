import { Switch } from "@/components/ui/switch";
import { useAdminSports } from "@/hooks/admin/useAdminSports";
import { t } from "@/i18n";

export function FeatureSportsToggle() {
  const { featureEnabled, setFeatureEnabled } = useAdminSports();

  const handleChange = (next: boolean) => {
    setFeatureEnabled(next);
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div className="grid gap-1">
        <div className="text-sm font-semibold">
          {t("admin.operations.feature.sports.title")}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("admin.operations.feature.sports.desc")}
        </p>
      </div>
      <Switch
        checked={featureEnabled}
        onCheckedChange={handleChange}
        aria-label={t("admin.operations.feature.sports.title")}
        data-testid="feature-sports-toggle"
      />
    </div>
  );
}
