import { UsersDeskHub } from "@/components/admin/users/UsersDeskHub";
import { t } from "@/i18n";

// L1-15-C C4 — Admin Users Desk page wire.
// Search SOT lives in UsersDeskHub's AdminFilterBar — no duplicate input here.
export function ImportedAdminUsersPage() {
  return (
    <>
      <header className="mb-4">
        <h1 className="text-2xl font-medium">{t("admin.users.title")}</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("admin.users.subtitle")}
        </p>
      </header>
      <UsersDeskHub />
    </>
  );
}
