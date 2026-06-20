import { useReducedMotionGuard } from "@/components/games/shared/hooks/useReducedMotionGuard";

type GoldenEarthGlobeProps = {
  className?: string;
};

export function GoldenEarthGlobe({ className }: GoldenEarthGlobeProps) {
  const reducedMotion = useReducedMotionGuard();

  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden
      className={
        "mx-auto size-[min(100%,140px)] drop-shadow-[var(--shadow-glow-cta)] " +
        (reducedMotion ? "" : "animate-[spin_24s_linear_infinite] ") +
        (className ?? "")
      }
    >
      <defs>
        <radialGradient id="golden-earth-fill" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="var(--color-rocket-gold)" />
          <stop offset="55%" stopColor="oklch(0.78 0.16 72)" />
          <stop offset="100%" stopColor="oklch(0.55 0.14 58)" />
        </radialGradient>
        <linearGradient id="golden-earth-shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.95 0.12 95 / 0.55)" />
          <stop offset="100%" stopColor="oklch(0.95 0.12 95 / 0)" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="url(#golden-earth-fill)" />
      <circle cx="60" cy="60" r="52" fill="url(#golden-earth-shine)" />
      <ellipse cx="60" cy="60" rx="52" ry="18" fill="none" stroke="oklch(0.92 0.1 88 / 0.35)" strokeWidth="1.2" />
      <ellipse cx="60" cy="60" rx="18" ry="52" fill="none" stroke="oklch(0.92 0.1 88 / 0.25)" strokeWidth="1" />
      <path
        d="M 12 60 Q 36 42 60 60 T 108 60"
        fill="none"
        stroke="oklch(0.88 0.12 80 / 0.45)"
        strokeWidth="1.5"
      />
      <path
        d="M 12 60 Q 36 78 60 60 T 108 60"
        fill="none"
        stroke="oklch(0.88 0.12 80 / 0.35)"
        strokeWidth="1.2"
      />
    </svg>
  );
}

GoldenEarthGlobe.displayName = "GoldenEarthGlobe";
