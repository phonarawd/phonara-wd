export {
  LEGACY_TRADE_SECTION_REDIRECTS,
  ROUTE_REDIRECT_RULES,
  type ExactRouteRedirect,
  type PrefixRouteRedirect,
  type QueryRouteRedirect,
  type RouteRedirectRule,
  type RouteRedirectSearch,
} from './route-redirect-registry';
export {
  formatRedirectHref,
  isForbiddenTradeSectionSearch,
  isRedirectOnlyPath,
  resolveRouteRedirect,
  type RouteRedirectTarget,
} from './resolve-route-redirect';
