import { t } from "@/i18n";

export function SportsEmptyState({ labelKey }: { labelKey?: string }) {
  return (
    <div
      className="grid place-items-center rounded-xl border border-dashed border-border bg-(--color-surface)/40 py-12 text-center"
      role="status"
    >
      <p className="text-sm text-muted-foreground">
        {t(labelKey ?? "sports.fixture.empty")}
      </p>
    </div>
  );
}
