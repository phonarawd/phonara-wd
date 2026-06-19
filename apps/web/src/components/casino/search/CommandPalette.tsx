import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/shims/react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useRecentPlays, pushRecentPlay } from "@/hooks/useRecentPlays";
import {
  CATEGORY_ORDER,
  SEARCH_INDEX,
  categoryLabelKey,
  type SearchCategory,
  type SearchIndexEntry,
} from "@/data/casino-search-index";
import { getGameMeta, type CasinoGameId } from "@/data/casino-game-meta";
import { SearchResultRow } from "./SearchResultRow";
import { t } from "@/i18n";

/**
 * P1.4 ??Global Command Palette.
 *
 * Mounted once at __root.tsx so ?�K works everywhere. cmdk performs the
 * fuzzy match against each item's `value` prop, which we build as a single
 * ASCII+i18n string: name + id + resolved aliasKeys + asciiAliases.
 * Category chip filters the rendered set BEFORE cmdk sees it.
 *
 * Closed state cost: zero ??only renders CommandDialog mount when `open`.
 */
export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();
  const { ids: recent } = useRecentPlays();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<SearchCategory>("all");

  // Reset query/category each time the dialog closes.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setCat("all");
    }
  }, [open]);

  const filtered = useMemo<readonly SearchIndexEntry[]>(() => {
    if (cat === "all") return SEARCH_INDEX;
    return SEARCH_INDEX.filter((e) => e.categories.includes(cat));
  }, [cat]);

  // Build search-string per entry: name (i18n) + nameAscii + id + aliasKeys (resolved) + asciiAliases.
  const valueFor = (e: SearchIndexEntry) => {
    const parts: string[] = [
      t(e.nameKey),
      e.nameAscii,
      e.id,
      e.id.replace("-", " "),
      ...e.asciiAliases,
      ...e.aliasKeys.map((k) => t(k)),
    ];
    return parts.join(" ");
  };

  const go = (id: CasinoGameId, to: string) => {
    pushRecentPlay(id);
    setOpen(false);
    navigate({ to });
  };

  // ??~9 jump to result N (only when palette open + query non-empty).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const n = parseInt(e.key, 10);
      if (Number.isNaN(n) || n < 1 || n > 9) return;
      const target = filtered[n - 1];
      if (!target) return;
      e.preventDefault();
      go(target.id, target.to);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
     
  }, [open, filtered]);

  const recentEntries = recent
    .map((id) => SEARCH_INDEX.find((e) => e.id === id))
    .filter((x): x is SearchIndexEntry => Boolean(x));

  const popular = [...SEARCH_INDEX].sort((a, b) => b.live - a.live).slice(0, 5);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      {open && (
        <>
          <CommandInput
            placeholder={t("casino.search.input.placeholder")}
            value={query}
            onValueChange={setQuery}
          />
          <div className="flex flex-wrap gap-1.5 border-b border-border/60 px-3 pb-2 pt-1">
            {CATEGORY_ORDER.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  cat === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent/40"
                }`}
              >
                {t(categoryLabelKey(c))}
              </button>
            ))}
          </div>
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>
              <div className="grid gap-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("casino.search.empty.title")}
                </p>
                <div className="mx-auto flex flex-wrap justify-center gap-2">
                  {popular.slice(0, 3).map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => go(e.id, e.to)}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium hover:bg-accent/40"
                    >
                      {t(e.nameKey)}
                    </button>
                  ))}
                </div>
              </div>
            </CommandEmpty>

            {query.trim() === "" && recentEntries.length > 0 && (
              <CommandGroup heading={t("casino.search.recent.title")}>
                {recentEntries.map((e, idx) => (
                  <CommandItem
                    key={`recent-${e.id}`}
                    value={`recent ${valueFor(e)}`}
                    onSelect={() => go(e.id, e.to)}
                  >
                    <SearchResultRow entry={e} query="" shortcutIndex={idx + 1} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {query.trim() === "" && (
              <CommandGroup heading={t("casino.search.popular.title")}>
                {popular.map((e, idx) => (
                  <CommandItem
                    key={`popular-${e.id}`}
                    value={`popular ${valueFor(e)}`}
                    onSelect={() => go(e.id, e.to)}
                  >
                    <SearchResultRow entry={e} query="" shortcutIndex={idx + 1} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {query.trim() !== "" && (
              <CommandGroup heading={t("casino.search.results.title")}>
                {filtered.map((e, idx) => (
                  <CommandItem
                    key={`r-${e.id}`}
                    value={valueFor(e)}
                    onSelect={() => go(e.id, e.to)}
                  >
                    <SearchResultRow
                      entry={e}
                      query={query}
                      shortcutIndex={idx + 1}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
            <span>{t("casino.search.hint.nav")}</span>
            <span>{t("casino.search.hint.quickJump")}</span>
          </div>
          <span className="sr-only">
            {getGameMeta("crash").nameAscii /* ensure tree-shake-safe meta link */}
          </span>
        </>
      )}
    </CommandDialog>
  );
}
