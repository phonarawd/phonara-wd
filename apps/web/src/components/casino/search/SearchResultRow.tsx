import { t } from "@/i18n";
import { normalize, type SearchIndexEntry } from "@/data/casino-search-index";

/**
 * P1.4 — Single search result row.
 *
 * Layout: 32px poster · name (with <mark> match highlight) · RTP · live count · ⌘N hint.
 * <mark> uses semantic accent tokens — no color literals.
 */

type Props = {
  entry: SearchIndexEntry;
  query: string;
  shortcutIndex?: number;
};

export function SearchResultRow({ entry, query, shortcutIndex }: Props) {
  const displayName = t(entry.nameKey);
  return (
    <div className="flex w-full items-center gap-3">
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md ring-1 ring-border/40">
        <img
          src={entry.poster}
          alt=""
          aria-hidden
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-medium">
          {highlight(displayName, query)}
        </span>
        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-500/30">
          {entry.rtp.toFixed(1)}%
        </span>
      </div>
      <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        {entry.live.toLocaleString("en-US")}
      </span>
      {shortcutIndex !== undefined && shortcutIndex >= 1 && shortcutIndex <= 9 && (
        <kbd className="ml-1 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
          ⌘{shortcutIndex}
        </kbd>
      )}
    </div>
  );
}

/** Wrap matched substring of `text` with <mark>. Case-insensitive, single match. */
function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const nText = normalize(text);
  const nQ = normalize(q);
  if (!nQ) return text;
  const idx = nText.indexOf(nQ);
  if (idx === -1) return text;
  // Map normalized index back to original by walking chars.
  let pos = 0;
  let start = -1;
  let end = -1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i] ?? "";
    const skip = /[\s\-_.]/.test(c);
    if (!skip) {
      if (pos === idx && start === -1) start = i;
      pos++;
      if (pos === idx + nQ.length) {
        end = i + 1;
        break;
      }
    }
  }
  if (start === -1 || end === -1) return text;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-accent/30 px-0.5 text-foreground">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}
