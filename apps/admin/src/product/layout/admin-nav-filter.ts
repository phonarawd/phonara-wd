import { canAccessAdminSupportDesk } from '@/domain/admin-support-desk-display-contract';
import {
  canAccessAdminTeamDesk,
  isAdminNavRouteAllowed,
} from '@/domain/admin-team-desk-display-contract';
import type { AdminRbacRole } from '@/hooks/admin/useAdminOperatorRbac';
import type { MessageKey } from '@phonara/i18n';

export type NavLeaf = {
  kind: 'leaf';
  labelKey: MessageKey;
  to: string;
  end?: boolean;
};

export type NavGroup = {
  kind: 'group';
  labelKey: MessageKey;
  to?: string;
  end?: boolean;
  children: NavLeaf[];
};

export type NavEntry = NavLeaf | NavGroup;

/**
 * H-07 — single RBAC predicate for desktop leaves, group children, and mobile quick links.
 * Team/support desk helpers remain for explicit owner/support pin; route allowlist is authoritative.
 */
export function filterAdminNavEntries(entries: NavEntry[], role: AdminRbacRole): NavEntry[] {
  const showTeam = canAccessAdminTeamDesk(role);
  const showSupport = canAccessAdminSupportDesk(role);

  const out: NavEntry[] = [];
  for (const entry of entries) {
    if (entry.kind === 'leaf') {
      if (entry.to === '/team' && !showTeam) continue;
      if (entry.to === '/support' && !showSupport) continue;
      if (!isAdminNavRouteAllowed(role, entry.to)) continue;
      out.push(entry);
      continue;
    }

    const children = entry.children.filter((child) => {
      if (child.to === '/team' && !showTeam) return false;
      if (child.to === '/support' && !showSupport) return false;
      return isAdminNavRouteAllowed(role, child.to);
    });
    const groupRouteAllowed = entry.to ? isAdminNavRouteAllowed(role, entry.to) : false;
    if (children.length === 0 && !groupRouteAllowed) continue;
    out.push({
      ...entry,
      to: groupRouteAllowed ? entry.to : undefined,
      children,
    });
  }
  return out;
}

/** Flatten filtered nav into mobile quick links (group header + children). */
export function flattenAdminNavLeaves(entries: NavEntry[]): NavLeaf[] {
  const leaves: NavLeaf[] = [];
  for (const entry of entries) {
    if (entry.kind === 'leaf') {
      leaves.push(entry);
      continue;
    }
    if (entry.to) {
      leaves.push({
        kind: 'leaf',
        labelKey: entry.labelKey,
        to: entry.to,
        end: entry.end,
      });
    }
    for (const child of entry.children) {
      leaves.push(child);
    }
  }
  return leaves;
}
