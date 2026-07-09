import { translate, type Locale, type MessageKey } from '@phonara/i18n';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Toaster as Sonner, toast as sonnerToast, type ExternalToast } from 'sonner';

import { cn } from '@/product/primitives/lib/cn';

export type ToastZoneKind = 'warm' | 'strict';

const ZONE_DURATION: Record<ToastZoneKind, number> = {
  warm: 4500,
  strict: 3500,
};

/** Fixed zone durations for §3.2 grammar contract tests. */
export const TOAST_ZONE_DURATION_MS = ZONE_DURATION;

const LOCALE_STORAGE_KEY = 'phonara.locale';

function readLocale(): Locale {
  if (typeof window === 'undefined') return 'ko';
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === 'en' ? 'en' : 'ko';
}

export interface ProductToastOptions {
  zone: ToastZoneKind;
  key: MessageKey;
  values?: Record<string, string | number>;
  id?: string;
  action?: {
    labelKey: MessageKey;
    onClick: () => void;
  };
}

export type ProductToastTone = 'default' | 'success' | 'warning' | 'error';

export interface ProductToastTextOptions {
  zone: ToastZoneKind;
  title: string;
  description?: string;
  tone?: ProductToastTone;
  id?: string;
}

function zoneToastOptions(zone: ToastZoneKind): ExternalToast {
  return {
    duration: ZONE_DURATION[zone],
    icon:
      zone === 'warm' ? (
        <Sparkles className="size-4 text-accent" aria-hidden />
      ) : (
        <CheckCircle2 className="size-4 text-foreground" aria-hidden />
      ),
    classNames: {
      toast: cn(
        zone === 'warm'
          ? 'border-accent/30 bg-surface-raised'
          : 'border-line bg-surface font-medium',
      ),
    },
  };
}

/** §25.2 ToastZone — sonner wrapper with fixed zone tone (§3.2). */
export const productToast = {
  show({ zone, key, values, action, id }: ProductToastOptions) {
    const locale = readLocale();
    const message = translate(locale, key, values);
    const options: ExternalToast = {
      ...zoneToastOptions(zone),
      ...(id ? { id } : {}),
    };
    if (action) {
      options.action = {
        label: translate(locale, action.labelKey),
        onClick: action.onClick,
      };
    }
    return sonnerToast(message, options);
  },
  /** Engine-provided title/body (notifications store) — still routes through ToastZone. */
  showText({ zone, title, description, tone = 'default', id }: ProductToastTextOptions) {
    const options: ExternalToast = {
      ...zoneToastOptions(zone),
      id,
      description,
    };
    if (tone === 'error') return sonnerToast.error(title, options);
    if (tone === 'success') return sonnerToast.success(title, options);
    if (tone === 'warning') return sonnerToast.warning(title, options);
    return sonnerToast(title, options);
  },
  dismiss: sonnerToast.dismiss,
};

export function ToastZone({ className }: { className?: string }) {
  return (
    <div data-testid="trade-toast">
      <Sonner
        className={cn('pointer-events-none', className)}
        toastOptions={{
          classNames: {
            toast:
              'pointer-events-auto border border-line bg-surface-overlay text-foreground shadow-overlay',
          },
        }}
        closeButton
        richColors={false}
        position="top-center"
      />
    </div>
  );
}
