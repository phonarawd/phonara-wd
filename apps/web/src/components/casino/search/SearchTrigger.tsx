import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { t } from "@/i18n";

/**
 * P1.4 — Search Trigger pill.
 *
 * Desktop: full pill with placeholder + ⌘K hint.
 * Mobile: icon-only button.
 * Opens the global CommandPalette (mounted in __root.tsx).
 */
export function SearchTrigger({ className = "" }: { className?: string }) {
  const { setOpen } = useCommandPalette();
  const isMac = useIsMac();

  return (
    <>
      {/* Mobile icon */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={t("casino.search.trigger.aria")}
        onClick={() => setOpen(true)}
        className={`sm:hidden ${className}`}
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* Desktop pill */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`hidden w-full max-w-md items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-left text-sm text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:bg-background/80 sm:inline-flex ${className}`}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">
          {t("casino.search.trigger.placeholder")}
        </span>
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {isMac ? "⌘" : "Ctrl"}+K
        </kbd>
      </button>
    </>
  );
}

function useIsMac() {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setMac(/Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent));
  }, []);
  return mac;
}
