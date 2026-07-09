import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

/** Enter on amount/margin input triggers ticket submit when enabled (P3-E keyboard path). */
export function handleOrderTicketEnterSubmit(
  event: ReactKeyboardEvent,
  opts: { disabled: boolean; onSubmit: () => void },
): void {
  if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
  if (opts.disabled) return;
  event.preventDefault();
  opts.onSubmit();
}
