import { Link } from "@/shims/react-router-dom";
import { t } from "@/i18n";

const LINKS = [
  { to: "/signup", labelKey: "footer.signup" },
  { to: "/about", labelKey: "footer.about" },
  { to: "/terms", labelKey: "footer.terms" },
  { to: "/privacy", labelKey: "footer.privacy" },
  { to: "/responsible-gaming", labelKey: "footer.risk" },
  { to: "/casino/fairness", labelKey: "footer.fairness" },
  { to: "/support", labelKey: "footer.support" },
] as const satisfies ReadonlyArray<{
  to:
    | "/signup"
    | "/about"
    | "/terms"
    | "/privacy"
    | "/responsible-gaming"
    | "/casino/fairness"
    | "/support";
  labelKey: `footer.${string}`;
}>;

const TRUST_BADGES = [
  "footer.trust.license",
  "footer.trust.rng",
  "footer.trust.age18",
  "footer.trust.ssl",
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-(--color-surface)/60">
      <div className="border-b border-border/40 px-6 py-4">
        <ul
          aria-label={t("footer.trust.aria")}
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          {TRUST_BADGES.map((key) => (
            <li
              key={key}
              className="rounded-full border border-border bg-(--color-surface) px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground"
            >
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-10 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-(--color-primary)">◆</span>
          <span className="font-semibold text-foreground">PHONARA</span>
        </div>
        <nav aria-label={t("footer.legalNav")} className="flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            >
              {t(l.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="tabular-nums">© {year} PHONARA</div>
      </div>
    </footer>
  );
}
