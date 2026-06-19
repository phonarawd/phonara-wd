import { Link } from "@/shims/react-router-dom";
import { ChevronRight } from "lucide-react";
import { t } from "@/i18n";

export interface CategoryCard {
  id: string;
  to: string;
  title: string;
  badge?: string;
  poster: string;
}



export interface HomeCategoryRowProps {
  titleKey: string;
  seeAllTo: string;
  cards: ReadonlyArray<CategoryCard>;
  testId: string;
  /** Aspect ratio / size variant. */
  variant?: "wide" | "tile";
}

export function HomeCategoryRow({
  titleKey,
  seeAllTo,
  cards,
  testId,
  variant = "tile",
}: HomeCategoryRowProps) {
  const dims =
    variant === "wide"
      ? "h-28 w-56"
      : "h-28 w-32";
  return (
    <section
      data-hub-id={`home-row-${testId}`}
      data-testid={testId}
      className="flex min-w-0 max-w-full flex-col gap-2"
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-foreground">{t(titleKey)}</h2>
        <Link
          to={seeAllTo}
          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          {t("home.row.seeAll")} <ChevronRight className="size-3" aria-hidden />
        </Link>
      </div>
      <div className="-mx-3 flex min-w-0 max-w-full snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-1 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards.map((card) => (
          <Link
            key={card.id}
            to={card.to}
            className={`group relative flex ${dims} shrink-0 snap-start flex-col justify-end overflow-hidden rounded-xl border border-border/60 bg-card p-2.5 transition hover:border-(--color-primary)/60`}
          >
            <img
              src={card.poster}
              alt=""
              aria-hidden
              loading="lazy"
              width={512}
              height={512}
              className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
            />
            {card.badge && (
              <span className="absolute right-2 top-2 z-10 rounded-full bg-(--color-warn) px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black shadow-md">
                {card.badge}
              </span>
            )}
            <p className="relative z-10 truncate text-xs font-semibold text-white drop-shadow">
              {card.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
