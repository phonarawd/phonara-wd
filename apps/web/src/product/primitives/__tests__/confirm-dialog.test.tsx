import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TRADE_DESK_CONFIRM_DIALOG_TEST_ID } from '@/domain/trade-desk-a11y-display-contract';
import { ConfirmDialog } from '@/product/primitives/confirm-dialog';
import { I18nProvider } from '@/product/i18n';

function renderConfirm(open = true) {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <I18nProvider>
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        contentTestId={TRADE_DESK_CONFIRM_DIALOG_TEST_ID}
        title="Confirm trade"
        description="Review before submit"
        summary={<p>Summary row</p>}
        onConfirm={onConfirm}
      />
    </I18nProvider>,
  );
  return { onConfirm, onOpenChange };
}

describe('ConfirmDialog · P3-E focus trap', () => {
  it('renders modal dialog with trade confirm test id when open', async () => {
    renderConfirm(true);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId(TRADE_DESK_CONFIRM_DIALOG_TEST_ID)).toBeInTheDocument();
  });

  it('keeps keyboard focus inside dialog while tabbing (Radix focus trap)', async () => {
    renderConfirm(true);
    const dialog = await screen.findByTestId(TRADE_DESK_CONFIRM_DIALOG_TEST_ID);
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    for (let i = 0; i < 8; i += 1) {
      fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Tab', code: 'Tab' });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it('does not mount dialog content when closed', () => {
    renderConfirm(false);
    expect(screen.queryByTestId(TRADE_DESK_CONFIRM_DIALOG_TEST_ID)).not.toBeInTheDocument();
  });
});
