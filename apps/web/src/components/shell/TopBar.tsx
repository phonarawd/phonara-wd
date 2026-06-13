/**
 * Imported presentation paste target — replace entire file with external TopBar.tsx output.
 * PHONARA app-shell is not used on imported presentation routes.
 */
export function TopBar() {
  return (
    <header className="presentation-import-topbar flex min-h-12 items-center justify-between px-4">
      <span className="text-sm font-semibold">PHONARA</span>
      <span className="text-xs text-muted">TopBar paste zone</span>
    </header>
  );
}
