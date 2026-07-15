import { supabase } from '@/lib/supabase';

import {
  buildKrwDepositProofPath,
  KRW_DEPOSIT_PROOF_STORAGE_BUCKET,
  validateKrwDepositProofFile,
} from './krw-deposit-proof-display-contract';

/**
 * Upload transfer receipt to owner path in `krw-deposit-proofs`.
 * Does not call attach RPC — caller wires `rpc_attach_krw_deposit_proof`.
 */
export async function uploadKrwDepositProof(userId: string, file: File): Promise<string> {
  const validation = validateKrwDepositProofFile(file);
  if (validation) throw new Error(validation);

  const path = buildKrwDepositProofPath(userId, file.type);
  const { error } = await supabase.storage
    .from(KRW_DEPOSIT_PROOF_STORAGE_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
  if (error) throw error;
  return path;
}
