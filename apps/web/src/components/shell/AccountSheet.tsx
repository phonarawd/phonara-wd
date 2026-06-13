/**
 * Imported presentation paste target — replace entire file with external AccountSheet.tsx output.
 */
type AccountSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AccountSheet({ open, onOpenChange }: AccountSheetProps) {
  if (!open) return null;
  return (
    <div
      className="presentation-import-account-sheet fixed inset-0 z-50 flex justify-end bg-black/50"
      role="presentation"
      onClick={() => onOpenChange(false)}
    >
      <aside
        className="h-dvh w-[88vw] max-w-sm bg-surface p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-muted">AccountSheet paste zone</p>
      </aside>
    </div>
  );
}
