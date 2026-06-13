import { forwardRef, useId, type SVGAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const iconPaths = {
  activity: (
    <path d="M4 13h3l2-6 4 10 2-6h5" />
  ),
  alert: (
    <>
      <path d="M12 4 3.5 18.5h17L12 4Z" />
      <path d="M12 9v4" />
      <path d="M12 16.5h.01" />
    </>
  ),
  arrowDown: (
    <>
      <path d="M12 4v16" />
      <path d="m6 14 6 6 6-6" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 20V4" />
      <path d="m6 10 6-6 6 6" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </>
  ),
  casino: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
      <path d="M12 12h.01" />
      <path d="M9 15h.01" />
      <path d="M15 15h.01" />
    </>
  ),
  check: (
    <path d="m5 12 4 4 10-10" />
  ),
  chevronDown: (
    <path d="m6 9 6 6 6-6" />
  ),
  chevronRight: (
    <path d="m9 6 6 6-6 6" />
  ),
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </>
  ),
  earn: (
    <>
      <path d="M12 3v18" />
      <path d="M17 7.5C16.2 6.1 14.4 5 12 5 9.2 5 7 6.4 7 8.5s2 3 5 3 5 1 5 3S14.8 19 12 19c-2.4 0-4.2-1.1-5-2.5" />
    </>
  ),
  externalLink: (
    <>
      <path d="M14 5h5v5" />
      <path d="m10 14 9-9" />
      <path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" />
    </>
  ),
  games: (
    <>
      <path d="M8 13H6a4 4 0 0 0-4 4v1a2 2 0 0 0 3.5 1.3L8 16h8l2.5 3.3A2 2 0 0 0 22 18v-1a4 4 0 0 0-4-4h-2" />
      <path d="M8 13V9a4 4 0 0 1 8 0v4" />
      <path d="M7 17h.01" />
      <path d="M17 17h.01" />
    </>
  ),
  home: (
    <>
      <path d="m4 11 8-7 8 7" />
      <path d="M6 10.5V20h12v-9.5" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
  ledger: (
    <>
      <path d="M6 3h12v18H6z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
      <path d="M14 16l4-4-4-4" />
      <path d="M18 12H9" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  minus: (
    <path d="M5 12h14" />
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a8 8 0 0 0 .1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L15 6.5h-6L8.6 9a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 1l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h6l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2.2-1.5Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  staking: (
    <>
      <path d="M12 3 4 8l8 5 8-5-8-5Z" />
      <path d="m4 13 8 5 8-5" />
      <path d="m4 17 8 5 8-5" />
    </>
  ),
  trade: (
    <>
      <path d="M4 17 10 9l4 4 6-8" />
      <path d="M4 21h16" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
      <path d="M16 12h4" />
      <path d="M7 9h7" />
    </>
  ),
  x: (
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>
  ),
} as const;

export type IconName = keyof typeof iconPaths;

export const iconVariants = cva('inline-block shrink-0 align-middle', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-7 w-7',
    },
    tone: {
      current: 'text-current',
      muted: 'text-muted',
      primary: 'text-primary',
      up: 'text-up',
      down: 'text-down',
      warning: 'text-warning',
      danger: 'text-[var(--color-danger)]',
      trust: 'text-[var(--color-trust)]',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'current',
  },
});

export interface IconProps
  extends Omit<SVGAttributes<SVGSVGElement>, 'children'>,
    VariantProps<typeof iconVariants> {
  name: IconName;
  title?: string;
  strokeWidth?: number;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, title, size, tone, strokeWidth = 1.8, className, ...props },
  ref,
) {
  const generatedTitleId = useId();
  const titleId = title ? generatedTitleId : undefined;

  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-labelledby={titleId}
      className={cn(iconVariants({ size, tone }), className)}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {iconPaths[name]}
    </svg>
  );
});

Icon.displayName = 'Icon';
