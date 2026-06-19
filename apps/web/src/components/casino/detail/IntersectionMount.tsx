import { Suspense, useRef, type ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

/**
 * P1.5-B — Defer mounting heavy panels until they approach the viewport.
 * Uses `content-visibility: auto` for off-screen paint skipping.
 */
type Props = {
  fallback?: ReactNode;
  /** Approx rendered height when not yet painted; prevents CLS. */
  minHeight?: number;
  rootMargin?: string;
  className?: string;
  children: ReactNode;
};

export function IntersectionMount({
  fallback = null,
  minHeight = 320,
  rootMargin = "200px",
  className,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, rootMargin });
  return (
    <div
      ref={ref}
      className={className}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: `${minHeight}px`,
      }}
    >
      {inView ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
}
