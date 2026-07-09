import { useEffect, useRef } from 'react';

import {
  LANDING_ANALYTICS_SCROLL_DEPTHS,
  landingScrollDepthEvent,
  type LandingAnalyticsEvent,
} from '@/domain/landing-analytics-display-contract';
import { trackLandingEvent, trackLandingEventFromElement } from '@/lib/landing-analytics';

function scrollDepthPercent(): number {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  if (scrollHeight <= 0) return 100;
  return Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
}

/** Scroll depth milestones — fires `landing.scroll.25|50|75` once each. */
export function useLandingScrollDepthAnalytics(): void {
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const onScroll = () => {
      const depth = scrollDepthPercent();
      for (const milestone of LANDING_ANALYTICS_SCROLL_DEPTHS) {
        if (depth >= milestone && !firedRef.current.has(milestone)) {
          firedRef.current.add(milestone);
          trackLandingEvent(landingScrollDepthEvent(milestone));
        }
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}

/** Delegated click capture for `data-analytics-event` targets (CTA · FAQ · signup). */
export function useLandingAnalyticsClickCapture(
  rootRef: React.RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onClick = (event: MouseEvent) => {
      trackLandingEventFromElement(event.target);
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [rootRef]);
}

/** Intersection observer — fires a view event once when section enters viewport. */
export function useLandingSectionViewAnalytics(
  ref: React.RefObject<HTMLElement | null>,
  event: LandingAnalyticsEvent,
): void {
  const firedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || firedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (firedRef.current) return;
        const visible = entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio > 0,
        );
        if (visible) {
          firedRef.current = true;
          trackLandingEvent(event);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [event, ref]);
}

/** Landing page analytics bundle — scroll depth + click delegation. */
export function useLandingPageAnalytics(rootRef: React.RefObject<HTMLElement | null>): void {
  useLandingScrollDepthAnalytics();
  useLandingAnalyticsClickCapture(rootRef);
}
