import { Navigate } from '@tanstack/react-router';

/** Lovable deprecated /games → /casino redirect (presentation-only). */
export function ImportedGamesCatalogPage() {
  return <Navigate to="/casino" replace />;
}
