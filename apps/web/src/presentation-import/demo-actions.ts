import { toast } from '../hooks/use-toast';

/** Demo-only presentation actions — no engine / RPC / ledger side effects. */
export function presentationDemoToast(message: string) {
  toast(message);
}

export function presentationDemoShare(payload: { title: string; text: string; url?: string }) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    void navigator.share(payload).catch(() => undefined);
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(payload.url ?? payload.text);
    toast('Link copied');
  }
}
