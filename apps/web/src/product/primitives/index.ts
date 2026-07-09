/**
 * Phase R primitives — shadcn/Radix vendoring SOT (§25.2 · §25.3 L-B).
 * Import from `@/product/primitives` only — never `components/ui`.
 */

export { Button, buttonVariants, type ButtonProps } from './button';
export { IconButton, type IconButtonProps } from './icon-button';
export {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
  type CardProps,
} from './card';
export { Text, textVariants, type TextProps } from './text';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './dialog';
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from './sheet';
export { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Input, type InputProps } from './input';
export { Field, type FieldProps } from './field';
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
export { Switch } from './switch';
export { Slider } from './slider';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from './popover';
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';
export {
  ToastZone,
  productToast,
  TOAST_ZONE_DURATION_MS,
  type ProductToastOptions,
  type ProductToastTextOptions,
  type ProductToastTone,
  type ToastZoneKind,
} from './toast-zone';
export {
  StatusBadge,
  statusBadgeVariants,
  type MoneyStatusState,
  type StatusBadgeProps,
} from './status-badge';
export { MoneyDisplay, type MoneyDisplayProps } from './money-display';
export {
  FiatHintDisclaimer,
  FiatHintSecondaryLine,
  MoneyDisplayWithFiatHint,
  MoneyDisplayWithFiatHintSlot,
  P4_FIAT_MONEY_DISPLAY_HINT_TODO,
  type FiatHintDisclaimerProps,
  type MoneyDisplayWithFiatHintProps,
  type MoneyDisplayWithFiatHintSlotProps,
} from './money-display-with-fiat-hint';
export { HowItWorks, type HowItWorksProps } from './how-it-works';
export { HelpTip, type HelpTipAction, type HelpTipProps } from './help-tip';
export { howItWorksStepKeys } from './lib/how-it-works-keys';
export { Skeleton } from './skeleton';
export { EmptyState, type EmptyStateProps } from './empty-state';
export { ErrorPanel, type ErrorPanelProps, type ErrorPanelVariant } from './error-panel';
export { ZeroBalanceState, type ZeroBalanceStateProps } from './zero-balance-state';
export { MissionCard, type MissionCardProps } from './mission-card';
export { RoutineCard, type RoutineCardProps, type RoutineStepDisplay } from './routine-card';
export { ProgressRing, type ProgressRingProps } from './progress-ring';
export { cn } from './lib/cn';
export {
  chipMotionTransition,
  dialogContentMotionVariants,
  dialogMotionTransition,
  instantMotionTransition,
  instantMotionVariants,
  overlayMotionTransition,
  overlayMotionVariants,
  sheetContentMotionVariants,
  sheetMotionTransition,
} from './lib/motion-presets';
