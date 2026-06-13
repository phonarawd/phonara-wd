/**
 * Pre-wires Lovable / shadcn packages before pasted UI imports them directly.
 * Imported from PresentationRoot so `check:deps` stays green during import.
 * Safe to slim down once `components/ui/*` is fully populated from Lovable.
 */
export { AnimatePresence, motion } from 'framer-motion';
export * as LucideIcons from 'lucide-react';
export { toast } from 'sonner';
export { default as confetti } from 'canvas-confetti';
export { cva } from 'class-variance-authority';
export { clsx } from 'clsx';
export { twMerge } from 'tailwind-merge';
export { Drawer } from 'vaul';
export { Command } from 'cmdk';
export { useForm } from 'react-hook-form';
export { zodResolver } from '@hookform/resolvers/zod';
export { OTPInput } from 'input-otp';
export { DayPicker } from 'react-day-picker';
export { format } from 'date-fns';
export { ko } from 'date-fns/locale';
export { default as useEmblaCarousel } from 'embla-carousel-react';
export { useVirtualizer } from '@tanstack/react-virtual';
export { useReactTable, getCoreRowModel } from '@tanstack/react-table';
export { toPng } from 'html-to-image';
export { wrap } from 'comlink';
export { createChart } from 'lightweight-charts';
export { useGesture } from '@use-gesture/react';
export { Helmet, HelmetProvider } from 'react-helmet-async';
export { QRCodeSVG } from 'qrcode.react';
export { AdvancedBloomFilter, BloomFilter } from 'pixi-filters';
export { NoiseFilter } from 'pixi.js';

export type { Application as PixiApplication } from 'pixi.js';
export type { Engine as MatterEngine } from 'matter-js';

export * as Accordion from '@radix-ui/react-accordion';
export * as AlertDialog from '@radix-ui/react-alert-dialog';
export * as AspectRatio from '@radix-ui/react-aspect-ratio';
export * as Avatar from '@radix-ui/react-avatar';
export * as Checkbox from '@radix-ui/react-checkbox';
export * as Collapsible from '@radix-ui/react-collapsible';
export * as ContextMenu from '@radix-ui/react-context-menu';
export * as Dialog from '@radix-ui/react-dialog';
export * as DropdownMenu from '@radix-ui/react-dropdown-menu';
export * as HoverCard from '@radix-ui/react-hover-card';
export * as Label from '@radix-ui/react-label';
export * as Menubar from '@radix-ui/react-menubar';
export * as NavigationMenu from '@radix-ui/react-navigation-menu';
export * as Popover from '@radix-ui/react-popover';
export * as Progress from '@radix-ui/react-progress';
export * as RadioGroup from '@radix-ui/react-radio-group';
export * as ScrollArea from '@radix-ui/react-scroll-area';
export * as Select from '@radix-ui/react-select';
export * as Separator from '@radix-ui/react-separator';
export * as Slider from '@radix-ui/react-slider';
export * as Slot from '@radix-ui/react-slot';
export * as Switch from '@radix-ui/react-switch';
export * as Tabs from '@radix-ui/react-tabs';
export * as Toggle from '@radix-ui/react-toggle';
export * as ToggleGroup from '@radix-ui/react-toggle-group';
export * as Tooltip from '@radix-ui/react-tooltip';

export const presentationStackReady = true as const;
