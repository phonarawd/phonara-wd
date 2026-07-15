import { useEffect, useState } from 'react';

import { DA_W4_REDUCED_MOTION_MEDIA_QUERY } from '../../../domain/da-w4-gate-motion-display-contract';

function readPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(DA_W4_REDUCED_MOTION_MEDIA_QUERY).matches;
}

/** OS a11y setting — avoids motion/react `useReducedMotion` dev console noise. */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(readPrefersReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(DA_W4_REDUCED_MOTION_MEDIA_QUERY);
    const sync = () => setPrefersReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return prefersReduced;
}
