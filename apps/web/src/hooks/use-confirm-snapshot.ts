import { useEffect, useRef, useState } from 'react';

/**
 * Locks a fingerprint when a confirm dialog opens. If inputs drift while the
 * dialog stays open, `canConfirm` becomes false until the user dismisses and
 * re-opens with the new values.
 */
export function useConfirmSnapshot({
  open,
  fingerprint,
  onDrift,
}: {
  open: boolean;
  fingerprint: string;
  onDrift?: () => void;
}) {
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const driftNotifiedRef = useRef(false);
  const fingerprintRef = useRef(fingerprint);
  fingerprintRef.current = fingerprint;

  useEffect(() => {
    if (open) {
      setSnapshot(fingerprintRef.current);
      driftNotifiedRef.current = false;
    } else {
      setSnapshot(null);
    }
  }, [open]);

  const isDrifted = open && snapshot !== null && snapshot !== fingerprint;
  // When the dialog opens, treat the current fingerprint as locked immediately
  // (useEffect still persists snapshot for drift detection on the next frame).
  const lockedSnapshot = open ? (snapshot ?? fingerprint) : null;

  useEffect(() => {
    if (isDrifted && !driftNotifiedRef.current) {
      driftNotifiedRef.current = true;
      onDrift?.();
    }
  }, [isDrifted, onDrift]);

  return {
    canConfirm: open && lockedSnapshot !== null && lockedSnapshot === fingerprint,
    isDrifted,
  };
}
