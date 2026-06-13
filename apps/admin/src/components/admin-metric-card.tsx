import { Card } from '@phonara/ui';

export interface AdminMetricCardProps {
  label: string;
  value: number;
  testId?: string;
}

/** Compact KPI tile for admin overview/alerts/queues. */
export function AdminMetricCard({ label, value, testId }: AdminMetricCardProps) {
  return (
    <Card elevation="raised" className="p-4" data-testid={testId}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-fg">{value}</p>
    </Card>
  );
}

AdminMetricCard.displayName = 'AdminMetricCard';
