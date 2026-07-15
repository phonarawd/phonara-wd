/**
 * `/announcements` — CMS notice list (P12 · `rpc_list_cms_content` kind=notice).
 * Display RPC rows only — no client CMS invent.
 * E3 GATE (`announcementsFull`) = targeting-aware list path unlocked.
 */

import type { MessageKey } from '@phonara/i18n';

import { LAUNCH_GATES } from '../lib/launch-gates';
import { CMS_LIST_RPC, CMS_TARGETING_COLUMNS } from './cms-banners-display-contract';

export const ANNOUNCEMENTS_ROUTE = '/announcements' as const;
export const ANNOUNCEMENTS_LIST_RPC = CMS_LIST_RPC;
export const ANNOUNCEMENTS_KIND = 'notice' as const;
export const ANNOUNCEMENTS_FULL_UNLOCK_TODO = 'ew-e3-gate-cms-promotions' as const;

export const ANNOUNCEMENTS_SEO_TITLE_KEY =
  'announcements.page.head.title' as const satisfies MessageKey;
export const ANNOUNCEMENTS_SEO_DESCRIPTION_KEY =
  'announcements.page.head.desc' as const satisfies MessageKey;

export type CmsNoticeRpcRow = {
  id: string;
  content_key: string;
  kind: string;
  locale: string;
  title: string;
  body: string | null;
  published_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  /** E3 targeting — optional until admin publishes audience/tier filters. */
  audience?: string | null;
  min_tier?: string | null;
  max_tier?: string | null;
};

export type AnnouncementDisplayRow = {
  id: string;
  contentKey: string;
  title: string;
  body: string | null;
  publishedAt: string | null;
};

export function mapRpcNoticeRow(row: CmsNoticeRpcRow): AnnouncementDisplayRow {
  return {
    id: row.id,
    contentKey: row.content_key,
    title: row.title,
    body: row.body,
    publishedAt: row.published_at,
  };
}

export function isAnnouncementsFullUnlocked(): boolean {
  return LAUNCH_GATES.announcementsFull === true;
}

export function assertAnnouncementsContractSync(): void {
  if (ANNOUNCEMENTS_ROUTE !== '/announcements') {
    throw new Error('announcements: route drift');
  }
  if (ANNOUNCEMENTS_KIND !== 'notice') {
    throw new Error('announcements: kind drift');
  }
  if (ANNOUNCEMENTS_LIST_RPC !== 'rpc_list_cms_content') {
    throw new Error('announcements: RPC drift');
  }
  if (ANNOUNCEMENTS_FULL_UNLOCK_TODO !== 'ew-e3-gate-cms-promotions') {
    throw new Error('announcements: full unlock todo drift');
  }
  if (!isAnnouncementsFullUnlocked()) {
    throw new Error('announcements: E3 GATE full unlock required');
  }
  if (CMS_TARGETING_COLUMNS.length !== 4) {
    throw new Error('announcements: CMS targeting columns required for full unlock');
  }
}
