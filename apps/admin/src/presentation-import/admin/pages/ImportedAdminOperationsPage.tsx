import { OperationsDeskHub } from "@/components/admin/operations/OperationsDeskHub";

// L1-15-H — wired operations desk. Hub owns the title + MOCK chip header.
export function ImportedAdminOperationsPage() {
  return (
    <div data-testid="operations-page">
      <OperationsDeskHub />
    </div>
  );
}
