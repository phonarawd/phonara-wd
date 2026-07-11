import { useQuery } from '@tanstack/react-query';
import {
  CMS_BANNER_KIND,
  CMS_BANNER_SURFACE_HOME,
  CMS_BANNER_SURFACE_LANDING,
  CMS_LIST_RPC,
  filterVisibleCmsBanners,
  mapRpcBannerRow,
  type CmsBannerDisplayRow,
  type CmsBannerRpcRow,
  type CmsBannerSurface,
} from '../domain/cms-banners-display-contract';
import { supabase } from '../lib/supabase';

type LooseRpcResult = PromiseLike<{ data: unknown; error: { message: string } | null }>;
type RpcCall = (name: string, args: Record<string, unknown>) => LooseRpcResult;
const rpc = supabase.rpc.bind(supabase) as RpcCall;

/** @deprecated Prefer `CmsBannerDisplayRow` from cms-banners-display-contract. */
export type CmsBanner = CmsBannerDisplayRow;

export function useCmsBanners(surface: CmsBannerSurface, locale = 'ko') {
  return useQuery({
    queryKey: ['cms-banners', surface, locale],
    queryFn: async () => {
      const { data, error } = await rpc(CMS_LIST_RPC, {
        p_kind: CMS_BANNER_KIND,
        p_surface: surface,
        p_locale: locale,
      });
      if (error) throw error;
      return ((data ?? []) as CmsBannerRpcRow[]).map(mapRpcBannerRow);
    },
    staleTime: 60_000,
  });
}

export function useHomeCmsBanners(locale = 'ko') {
  return useCmsBanners(CMS_BANNER_SURFACE_HOME, locale);
}

export function useLandingCmsBanners(locale = 'ko') {
  return useCmsBanners(CMS_BANNER_SURFACE_LANDING, locale);
}

/** Kill-switch-aware banner list for route surfaces (E16). */
export function useVisibleCmsBanners(params: {
  surface: CmsBannerSurface;
  locale?: string;
  systemHalted: boolean;
}) {
  const query = useCmsBanners(params.surface, params.locale ?? 'ko');
  const visible = filterVisibleCmsBanners({
    rows: query.data ?? [],
    surface: params.surface,
    systemHalted: params.systemHalted,
  });
  return { ...query, visibleBanners: visible };
}

export function useCmsNotices(locale = 'ko') {
  return useQuery({
    queryKey: ['cms-notices', locale],
    queryFn: async () => {
      const { data, error } = await rpc('rpc_list_cms_content', {
        p_kind: 'notice',
        p_surface: null,
        p_locale: locale,
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}
