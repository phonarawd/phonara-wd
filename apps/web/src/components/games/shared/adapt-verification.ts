/**
 * PHONARA × Lovable — fairness verification adapter.
 *
 * Dual-shape passthrough. PHONARA adapter may pass either snake_case
 * (`server_seed`) or already-normalized camelCase (`serverSeed`).
 * FairnessSheet consumes the camelCase shape.
 */
import type { FairnessUiEvidence, PhonaraVerificationEvidence } from "./types";

type AnyEvidence = FairnessUiEvidence | PhonaraVerificationEvidence;

function isFairnessUi(v: AnyEvidence): v is FairnessUiEvidence {
  return "serverSeed" in (v as object);
}

export function toFairnessUi(
  v: AnyEvidence | null | undefined,
): FairnessUiEvidence | null {
  if (!v) return null;
  if (isFairnessUi(v)) return v;
  const p = v as PhonaraVerificationEvidence;
  return {
    ok: p.ok,
    hmac: p.hmac,
    cursor: p.cursor,
    serverSeed: p.server_seed,
  };
}
