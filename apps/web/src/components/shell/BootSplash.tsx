import { useEffect, useState } from "react";
import { t } from "@/i18n";

/**
 * Stake-style boot splash.
 * SSR-safe twin lives inline in __root.tsx <body> (id="boot-splash-static")
 * for first paint. This React overlay fades both out together once hydrated.
 */
export function BootSplash() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const hold = reduce ? 0 : 600;
    const fade = reduce ? 0 : 400;

    const t1 = window.setTimeout(() => setPhase("out"), hold);
    const t2 = window.setTimeout(() => {
      setPhase("gone");
      document.getElementById("boot-splash-static")?.remove();
    }, hold + fade);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-[400ms] ease-out"
      style={{ opacity: phase === "out" ? 0 : 1 }}
    >
      <div className="font-display text-3xl font-black tracking-tight text-foreground">
        {t("brand.wordmark")}
      </div>
      <div className="mt-5 flex gap-1.5">
        <span
          className="h-2 w-2 rounded-full bg-primary"
          style={{ animation: "splash-dot 1.2s ease-in-out 0s infinite" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-primary"
          style={{ animation: "splash-dot 1.2s ease-in-out 0.16s infinite" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-primary"
          style={{ animation: "splash-dot 1.2s ease-in-out 0.32s infinite" }}
        />
      </div>
    </div>
  );
}
