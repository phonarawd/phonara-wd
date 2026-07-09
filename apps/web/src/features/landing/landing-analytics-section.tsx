import { useCallback, useRef, type ReactNode } from 'react';

import {
  LANDING_ANALYTICS_ATTR_EVENT,
  type LandingAnalyticsEvent,
} from '@/domain/landing-analytics-display-contract';
import { useLandingSectionViewAnalytics } from '@/features/landing/use-landing-analytics';
import { cn } from '@/product/primitives/lib/cn';

export type LandingAnalyticsSectionProps = {
  event: LandingAnalyticsEvent;
  children: ReactNode;
  className?: string;
  testId?: string;
  as?: 'section' | 'div';
};

/** Viewport-gated section wrapper — fires analytics view event once (ADR-003 §6). */
export function LandingAnalyticsSection({
  event,
  children,
  className,
  testId,
  as: Tag = 'section',
}: LandingAnalyticsSectionProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  useLandingSectionViewAnalytics(containerRef, event);

  const setRef = useCallback((node: HTMLDivElement | HTMLElement | null) => {
    containerRef.current = node;
  }, []);

  return (
    <Tag
      ref={setRef}
      className={cn(className)}
      data-testid={testId}
      {...{ [LANDING_ANALYTICS_ATTR_EVENT]: event }}
    >
      {children}
    </Tag>
  );
}
