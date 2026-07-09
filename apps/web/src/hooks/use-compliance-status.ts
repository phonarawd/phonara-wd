import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

export type ComplianceBlock = {
  code: string;
  until?: string;
};

export type ComplianceSteps = {
  account: boolean;
  kyc_submit: boolean;
  kyc_review: boolean;
  sanctions: boolean;
  withdraw: boolean;
};

export type ComplianceStatus = {
  ok: boolean;
  kyc_tier: string | null;
  kyc_status: string | null;
  sanctions_status: string | null;
  activity_frozen: boolean;
  withdrawal_ready: boolean;
  steps: ComplianceSteps;
  blocks: ComplianceBlock[];
};

export const complianceKeys = {
  status: (userId: string | null) => ['compliance-status', userId] as const,
};

type ComplianceStatusRow = {
  ok?: boolean;
  kyc_tier?: string;
  kyc_status?: string;
  sanctions_status?: string;
  activity_frozen?: boolean;
  withdrawal_ready?: boolean;
  steps?: Partial<ComplianceSteps>;
  blocks?: Array<{ code?: string; until?: string }>;
};

function parseCompliance(data: unknown): ComplianceStatus {
  const row = data as ComplianceStatusRow;
  const stepsRaw = row.steps ?? {};
  const blocksRaw = row.blocks ?? [];

  return {
    ok: Boolean(row.ok),
    kyc_tier: row.kyc_tier ?? null,
    kyc_status: row.kyc_status ?? null,
    sanctions_status: row.sanctions_status ?? null,
    activity_frozen: Boolean(row.activity_frozen),
    withdrawal_ready: Boolean(row.withdrawal_ready),
    steps: {
      account: Boolean(stepsRaw.account),
      kyc_submit: Boolean(stepsRaw.kyc_submit),
      kyc_review: Boolean(stepsRaw.kyc_review),
      sanctions: Boolean(stepsRaw.sanctions),
      withdraw: Boolean(stepsRaw.withdraw),
    },
    blocks: blocksRaw.map((block) => ({
      code: block.code ?? '',
      until: block.until,
    })),
  };
}

export function useComplianceStatus() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  return useQuery({
    queryKey: complianceKeys.status(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_get_compliance_status');
      if (error) throw error;
      return parseCompliance(data);
    },
    staleTime: 15_000,
    refetchInterval: 60_000,
    refetchOnMount: 'always',
  });
}
