/**
 * Set `VITE_LOVABLE_CASINO_SURFACE=true` in `.env.local` after Lovable ZIP paste
 * to render `CasinoLovableSurface` instead of legacy `@phonara/ui` casino chrome.
 */
export const USE_LOVABLE_CASINO_SURFACE =
  import.meta.env['VITE_LOVABLE_CASINO_SURFACE'] === 'true';
