import { forwardRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button, type ButtonProps } from './button';
import { Icon, type IconName } from './icon';

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'size'> {
  icon: IconName;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  iconTitle?: string;
  badge?: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, size = 'md', iconTitle, badge, className, ...props },
  ref,
) {
  const iconSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';

  return (
    <Button
      ref={ref}
      size="icon"
      aria-label={label}
      className={cn(
        size === 'sm' && 'h-9 min-h-9 w-9 min-w-9',
        size === 'md' && 'h-10 min-h-10 w-10 min-w-10',
        size === 'lg' && 'h-12 min-h-12 w-12 min-w-12',
        'relative rounded-[var(--radius-lg)]',
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={iconSize} title={iconTitle} aria-hidden={iconTitle ? undefined : true} />
      {badge ? (
        <span className="absolute right-1 top-1 flex min-h-2 min-w-2 items-center justify-center rounded-full bg-primary text-[0.625rem] font-[var(--font-weight-label)] text-primary-fg">
          {badge}
        </span>
      ) : null}
    </Button>
  );
});

IconButton.displayName = 'IconButton';
