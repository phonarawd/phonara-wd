import { ImportedPartnerPage } from '../pages/partner-page';

type PartnerLovableSurfaceProps = {
  gated?: boolean;
};

/** Display-only partner hub — affiliate RPC wire deferred to L3. */
export function PartnerLovableSurface({ gated = true }: PartnerLovableSurfaceProps) {
  return (
    <ImportedPartnerPage
      gated={gated}
      partnerLink={gated ? '' : 'https://phonara.app/r/partner-preview'}
      commissionTotal="0 PHON"
      commissionPending="0 PHON"
      commissionPaid="0 PHON"
      commissionRate="—"
      commissionMtd="0 PHON"
      downlineCount="0"
      downlineLevel="1"
    />
  );
}
