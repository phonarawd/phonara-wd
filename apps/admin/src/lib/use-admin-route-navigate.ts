import { useNavigate } from '@tanstack/react-router';

/** Client-side admin route changes without full-page reload (§12.19 · p2-closeout-router-navigate). */
export function useAdminRouteNavigate() {
  const navigate = useNavigate();
  return (to: string) => {
    void navigate({ to });
  };
}
