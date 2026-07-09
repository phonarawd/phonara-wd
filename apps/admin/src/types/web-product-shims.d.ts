/**
 * Type-only shims for shared web primitives — runtime resolves via Vite alias.
 * Avoids pulling web sources into the admin composite rootDir.
 */
declare module '@/product/primitives/button' {
  import type { ButtonHTMLAttributes, ForwardRefExoticComponent, RefAttributes } from 'react';

  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'bet';
    size?: 'sm' | 'md' | 'lg';
    asChild?: boolean;
    loading?: boolean;
  }

  export const Button: ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>>;
}

declare module '@/product/primitives/card' {
  import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react';

  export const Card: ForwardRefExoticComponent<
    HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
  >;
  export const CardHeader: ForwardRefExoticComponent<
    HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
  >;
  export const CardTitle: ForwardRefExoticComponent<
    HTMLAttributes<HTMLHeadingElement> & RefAttributes<HTMLHeadingElement>
  >;
  export const CardDescription: ForwardRefExoticComponent<
    HTMLAttributes<HTMLParagraphElement> & RefAttributes<HTMLParagraphElement>
  >;
  export const CardBody: ForwardRefExoticComponent<
    HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
  >;
}

declare module '@/product/primitives/dialog' {
  import type {
    ComponentPropsWithoutRef,
    ElementRef,
    ForwardRefExoticComponent,
    HTMLAttributes,
    RefAttributes,
  } from 'react';
  import type * as DialogPrimitive from '@radix-ui/react-dialog';

  export const Dialog: typeof DialogPrimitive.Root;
  export const DialogContent: ForwardRefExoticComponent<
    ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
      RefAttributes<ElementRef<typeof DialogPrimitive.Content>>
  >;
  export const DialogDescription: ForwardRefExoticComponent<
    ComponentPropsWithoutRef<typeof DialogPrimitive.Description> &
      RefAttributes<ElementRef<typeof DialogPrimitive.Description>>
  >;
  export const DialogFooter: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>;
  export const DialogHeader: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>;
  export const DialogTitle: ForwardRefExoticComponent<
    ComponentPropsWithoutRef<typeof DialogPrimitive.Title> &
      RefAttributes<ElementRef<typeof DialogPrimitive.Title>>
  >;
}

declare module '@/product/primitives/empty-state' {
  import type { ReactNode } from 'react';

  export interface EmptyStateProps {
    title: string;
    description?: string;
    actionLabel: string;
    onAction: () => void;
    icon?: ReactNode;
    className?: string;
  }

  export function EmptyState(props: EmptyStateProps): JSX.Element;
}

declare module '@/product/primitives/how-it-works' {
  import type { MessageKey } from '@phonara/i18n';
  import type { LucideIcon } from 'lucide-react';

  export interface HowItWorksProps {
    stepKeys: readonly [MessageKey, MessageKey, MessageKey];
    titleKey?: MessageKey;
    persistenceId: string;
    stepIcons?: readonly [LucideIcon, LucideIcon, LucideIcon];
    className?: string;
  }

  export function HowItWorks(props: HowItWorksProps): JSX.Element;
}

declare module '@/product/primitives/input' {
  import type { ForwardRefExoticComponent, InputHTMLAttributes, RefAttributes } from 'react';

  export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    invalid?: boolean;
  }

  export const Input: ForwardRefExoticComponent<InputProps & RefAttributes<HTMLInputElement>>;
}

declare module '@/product/primitives/lib/cn' {
  export function cn(...inputs: Array<string | false | null | undefined>): string;
}

declare module '@/product/primitives/skeleton' {
  import type { HTMLAttributes } from 'react';

  export function Skeleton(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
}

declare module '@/product/primitives/status-badge' {
  export type MoneyStatusState =
    | 'pending'
    | 'reviewing'
    | 'settled'
    | 'failed'
    | 'halted'
    | 'rejected';

  export interface StatusBadgeProps {
    state: MoneyStatusState;
    className?: string;
    label?: string;
  }

  export function StatusBadge(props: StatusBadgeProps): JSX.Element;
}

declare module '@/product/primitives/switch' {
  import type {
    ComponentPropsWithoutRef,
    ElementRef,
    ForwardRefExoticComponent,
    RefAttributes,
  } from 'react';
  import type * as SwitchPrimitive from '@radix-ui/react-switch';

  export const Switch: ForwardRefExoticComponent<
    ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> &
      RefAttributes<ElementRef<typeof SwitchPrimitive.Root>>
  >;
}

declare module '@/product/primitives/tabs' {
  import type {
    ComponentPropsWithoutRef,
    ElementRef,
    ForwardRefExoticComponent,
    RefAttributes,
  } from 'react';
  import type * as TabsPrimitive from '@radix-ui/react-tabs';

  export const Tabs: typeof TabsPrimitive.Root;
  export const TabsList: ForwardRefExoticComponent<
    ComponentPropsWithoutRef<typeof TabsPrimitive.List> &
      RefAttributes<ElementRef<typeof TabsPrimitive.List>>
  >;
  export const TabsTrigger: ForwardRefExoticComponent<
    ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> &
      RefAttributes<ElementRef<typeof TabsPrimitive.Trigger>>
  >;
  export const TabsContent: ForwardRefExoticComponent<
    ComponentPropsWithoutRef<typeof TabsPrimitive.Content> &
      RefAttributes<ElementRef<typeof TabsPrimitive.Content>>
  >;
}

declare module '@/product/primitives/toast-zone' {
  export function ToastZone(): JSX.Element | null;
}

declare module '@/product/layout/content-shell' {
  import type { ElementType, HTMLAttributes } from 'react';

  export type ContentShellProps<T extends ElementType = 'div'> = {
    as?: T;
    bleed?: boolean;
  } & Omit<HTMLAttributes<HTMLElement>, 'as'>;

  export function ContentShell<T extends ElementType = 'div'>(
    props: ContentShellProps<T>,
  ): JSX.Element;

  export type ShellPageProps<T extends ElementType = 'main'> = {
    as?: T;
  } & Omit<HTMLAttributes<HTMLElement>, 'as'>;

  export function ShellPage<T extends ElementType = 'main'>(props: ShellPageProps<T>): JSX.Element;
}
