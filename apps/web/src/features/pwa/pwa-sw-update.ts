import type { MessageKey } from '@phonara/i18n';

import { productToast } from '@/product/primitives/toast-zone';

/** §3.4 single toast path for SW update prompts. */
export const PWA_SW_UPDATE_TOAST_KEY = 'toast.pwa.updateAvailable' as const satisfies MessageKey;
export const PWA_SW_UPDATE_ACTION_KEY =
  'toast.pwa.updateAvailable.action' as const satisfies MessageKey;

let updateToastVisible = false;
let pendingApplyUpdate: (() => void) | null = null;
let deferSwUpdateToast = false;

/** Bet sessions / open confirm dialogs can defer the update toast (§25.10). */
export function setPwaSwUpdateToastDeferred(deferred: boolean): void {
  deferSwUpdateToast = deferred;
  if (!deferred) {
    flushDeferredPwaSwUpdateToast();
  }
}

export function shouldDeferPwaSwUpdateToast(): boolean {
  return deferSwUpdateToast;
}

export function hasPendingPwaSwUpdate(): boolean {
  return pendingApplyUpdate !== null;
}

export function resetPwaSwUpdateStateForTests(): void {
  updateToastVisible = false;
  pendingApplyUpdate = null;
  deferSwUpdateToast = false;
  productToast.dismiss();
}

function showUpdateToast(applyUpdate: () => void): void {
  if (updateToastVisible) return;

  updateToastVisible = true;
  productToast.show({
    zone: 'strict',
    key: PWA_SW_UPDATE_TOAST_KEY,
    action: {
      labelKey: PWA_SW_UPDATE_ACTION_KEY,
      onClick: () => {
        updateToastVisible = false;
        pendingApplyUpdate = null;
        productToast.dismiss();
        applyUpdate();
      },
    },
  });
}

/** Called from vite-plugin-pwa `onNeedRefresh` — user must confirm reload. */
export function notifyPwaSwUpdateReady(applyUpdate: () => void): void {
  pendingApplyUpdate = applyUpdate;

  if (shouldDeferPwaSwUpdateToast()) return;

  showUpdateToast(applyUpdate);
}

export function flushDeferredPwaSwUpdateToast(): void {
  if (!pendingApplyUpdate || shouldDeferPwaSwUpdateToast() || updateToastVisible) return;
  showUpdateToast(pendingApplyUpdate);
}
