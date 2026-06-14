/**
 * shadcn-style toast shim → sonner (imported presentation zone only).
 */
import { toast as sonnerToast } from 'sonner';

export type ToastInput = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function toast(input: ToastInput | string) {
  if (typeof input === 'string') {
    sonnerToast.message(input);
    return;
  }
  const message = input.title ?? input.description ?? '';
  if (input.variant === 'destructive') {
    sonnerToast.error(message, { description: input.title ? input.description : undefined });
    return;
  }
  sonnerToast.message(message, { description: input.title ? input.description : undefined });
}

export function useToast() {
  return {
    toast,
    dismiss: () => {
      sonnerToast.dismiss();
    },
  };
}
