import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { PartnerLovableSurface } from '../presentation-import/partner/partner-lovable-surface';

function parsePartnerGate(raw: unknown): boolean {
  if (raw === undefined || raw === null || raw === '') return true;
  const s = String(raw);
  return s !== '1' && s !== 'true';
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/partner',
  validateSearch: (search: Record<string, unknown>) => ({
    partner: search['partner'],
  }),
  component: PartnerRoute,
});

function PartnerRoute() {
  const { partner } = Route.useSearch();
  const gated = parsePartnerGate(partner);
  return (
    <PresentationRoot>
      <PartnerLovableSurface gated={gated} />
    </PresentationRoot>
  );
}
