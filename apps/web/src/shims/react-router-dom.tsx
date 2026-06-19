/**
 * react-router-dom compatibility shim for imported presentation UI.
 * Maps to TanStack Router — do not use in engine/hooks code.
 */
import {
  Link as TanLink,
  Navigate as TanNavigate,
  Outlet as TanOutlet,
  useNavigate as useTanNavigate,
  useRouterState,
  type LinkProps as TanLinkProps,
} from '@tanstack/react-router';
import {
  forwardRef,
  useCallback,
  useMemo,
  type AnchorHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';

type RouterDomLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string;
  replace?: boolean;
  state?: unknown;
  reloadDocument?: boolean;
  params?: Record<string, string>;
  hash?: string;
  preload?: false | 'intent' | 'render' | 'viewport';
};

function resolveToPath(to: string, params?: Record<string, string>, hash?: string): string {
  let resolved = to;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      resolved = resolved.replace(`$${key}`, value);
    }
  }
  if (hash) {
    resolved += hash.startsWith('#') ? hash : `#${hash}`;
  }
  return resolved;
}

export const Link = forwardRef(function ImportedPresentationLink(
  { to, replace, className, children, onClick, params, hash, preload, ...rest }: RouterDomLinkProps,
  ref: Ref<HTMLAnchorElement>,
) {
  const resolvedTo = resolveToPath(to, params, hash);
  return (
    <TanLink
      to={resolvedTo as '/'}
      replace={replace}
      preload={preload}
      className={className}
      onClick={onClick}
      ref={ref}
      {...(rest as Omit<TanLinkProps, 'to' | 'replace' | 'className' | 'children' | 'onClick' | 'ref'>)}
    >
      {children}
    </TanLink>
  );
});
Link.displayName = 'Link';

export function useNavigate() {
  const navigate = useTanNavigate();
  return (
    to: string | number | { to: string; replace?: boolean; state?: unknown },
    options?: { replace?: boolean; state?: unknown },
  ) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }
    if (typeof to === 'object') {
      void navigate({ to: to.to as '/', replace: to.replace });
      return;
    }
    void navigate({ to: to as '/', replace: options?.replace });
  };
}

export function useLocation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  return {
    pathname,
    search: searchStr,
    hash: '',
    state: null as unknown,
    key: 'default',
  };
}

export function useParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>(): T {
  const params = useRouterState({
    select: (s) => s.matches[s.matches.length - 1]?.params ?? {},
  });
  return params as T;
}

type NavLinkProps = Omit<RouterDomLinkProps, 'className'> & {
  end?: boolean;
  className?: string | ((props: { isActive: boolean }) => string | undefined);
};

export function NavLink({ to, className, children, end, ...rest }: NavLinkProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = end ? pathname === to : pathname.startsWith(to);
  const resolvedClass =
    typeof className === 'function' ? className({ isActive }) : (className ?? undefined);

  return (
    <Link
      to={to}
      className={resolvedClass}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  return <TanNavigate to={to as '/'} replace={replace} />;
}

export function Outlet() {
  return <TanOutlet />;
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | Record<string, string>) => void,
] {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const navigate = useTanNavigate();

  const params = useMemo(() => new URLSearchParams(searchStr), [searchStr]);

  const setSearchParams = useCallback(
    (next: URLSearchParams | Record<string, string>) => {
      const nextParams =
        next instanceof URLSearchParams ? next : new URLSearchParams(Object.entries(next));
      const qs = nextParams.toString();
      const target = qs ? `${pathname}?${qs}` : pathname;
      void navigate({ to: target as '/', replace: true });
    },
    [navigate, pathname],
  );

  return [params, setSearchParams];
}

/** Passthrough — TanStack Router owns the tree. */
export function BrowserRouter({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** Passthrough — TanStack Router owns route matching. */
export function Routes({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** Passthrough — TanStack Router owns route matching. */
export function Route({ element }: { path?: string; element?: ReactNode }) {
  return <>{element}</>;
}

/** Route tree introspection — read-only passthrough for presentation shell. */
export { useRouterState, useRouter } from '@tanstack/react-router';
