import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@phonara/shared-types';
import type { AdminAuditEvent } from '@/shared-types';

import {
  ADMIN_SUPPORT_OPEN_STATUSES,
  ADMIN_SUPPORT_TICKET_CATEGORIES,
  ADMIN_SUPPORT_TICKET_PRIORITIES,
  ADMIN_SUPPORT_TICKET_STATUSES,
  isAdminSupportOpenStatus,
  type AdminSupportTicketCategory,
  type AdminSupportTicketPriority,
  type AdminSupportTicketStatus,
} from '@/domain/admin-support-desk-display-contract';
import { supabase } from '../../lib/supabase';
import { useAuditLogs } from '../use-audit-logs';
import { useAdminMfaReady } from '../use-admin-mfa-ready';

const MIN_REASON = 4;

export type AdminSupportTicketRow = {
  id: string;
  userId: string;
  category: AdminSupportTicketCategory;
  subject: string;
  status: AdminSupportTicketStatus;
  priority: AdminSupportTicketPriority;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  body?: string;
};

export type SupportDeskFilters = {
  search: string;
  status: AdminSupportTicketStatus | 'open_queue' | 'all';
  priority: AdminSupportTicketPriority | 'all';
};

export type UseAdminSupportDesk = {
  tickets: AdminSupportTicketRow[];
  filteredTickets: AdminSupportTicketRow[];
  openQueueTickets: AdminSupportTicketRow[];
  openCount: number;
  highPriorityOpenCount: number;
  filters: SupportDeskFilters;
  setFilters: (
    next: SupportDeskFilters | ((prev: SupportDeskFilters) => SupportDeskFilters),
  ) => void;
  loading: boolean;
  isError: boolean;
  busy: boolean;
  auditEvents: AdminAuditEvent[];
  refresh: () => Promise<void>;
  loadTicketDetail: (ticketId: string) => Promise<AdminSupportTicketRow | null>;
  resolveTicket: (args: {
    ticketId: string;
    reason: string;
    resolutionNote?: string;
  }) => Promise<void>;
  canResolve: (row: AdminSupportTicketRow) => boolean;
};

function isRecord(value: unknown): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asCategory(value: unknown): AdminSupportTicketCategory | null {
  return typeof value === 'string' &&
    (ADMIN_SUPPORT_TICKET_CATEGORIES as readonly string[]).includes(value)
    ? (value as AdminSupportTicketCategory)
    : null;
}

function asStatus(value: unknown): AdminSupportTicketStatus | null {
  return typeof value === 'string' &&
    (ADMIN_SUPPORT_TICKET_STATUSES as readonly string[]).includes(value)
    ? (value as AdminSupportTicketStatus)
    : null;
}

function asPriority(value: unknown): AdminSupportTicketPriority | null {
  return typeof value === 'string' &&
    (ADMIN_SUPPORT_TICKET_PRIORITIES as readonly string[]).includes(value)
    ? (value as AdminSupportTicketPriority)
    : null;
}

function mapTicketRow(row: Json): AdminSupportTicketRow | null {
  if (!isRecord(row)) return null;
  const id = typeof row['id'] === 'string' ? row['id'] : null;
  const userId = typeof row['user_id'] === 'string' ? row['user_id'] : null;
  const category = asCategory(row['category']);
  const subject = typeof row['subject'] === 'string' ? row['subject'] : null;
  const status = asStatus(row['status']);
  const priority = asPriority(row['priority']);
  if (!id || !userId || !category || !subject || !status || !priority) return null;
  return {
    id,
    userId,
    category,
    subject,
    status,
    priority,
    createdAt: String(row['created_at'] ?? new Date().toISOString()),
    updatedAt: String(row['updated_at'] ?? new Date().toISOString()),
    resolvedAt: typeof row['resolved_at'] === 'string' ? row['resolved_at'] : null,
    body: typeof row['body'] === 'string' ? row['body'] : undefined,
  };
}

function filterTickets(
  rows: AdminSupportTicketRow[],
  filters: SupportDeskFilters,
): AdminSupportTicketRow[] {
  const query = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.status === 'open_queue') {
      if (!isAdminSupportOpenStatus(row.status)) return false;
    } else if (filters.status !== 'all' && row.status !== filters.status) {
      return false;
    }
    if (filters.priority !== 'all' && row.priority !== filters.priority) return false;
    if (!query) return true;
    return (
      row.subject.toLowerCase().includes(query) ||
      row.category.toLowerCase().includes(query) ||
      row.userId.toLowerCase().includes(query) ||
      row.id.toLowerCase().includes(query)
    );
  });
}

function mapAudit(row: {
  id: string;
  created_at: string;
  action: string;
  entity_id: string | null;
  payload: unknown;
}): AdminAuditEvent | null {
  if (row.action !== 'support_ticket_resolve') return null;
  const payload =
    row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    at: row.created_at,
    actorKey: 'admin.primitive.audit.actor.operator',
    actionKey: 'admin.support.audit.resolve',
    subject:
      typeof payload['ticket_id'] === 'string' ? payload['ticket_id'] : (row.entity_id ?? ''),
    reason: typeof payload['reason'] === 'string' ? payload['reason'] : undefined,
  };
}

/** Member inquiry desk — list/resolve E9 support tickets (§29.2 R0·R2). */
export function useAdminSupportDesk(): UseAdminSupportDesk {
  const qc = useQueryClient();
  const mfaReady = useAdminMfaReady();
  const { data: auditLogs = [] } = useAuditLogs(30);
  const [filters, setFilters] = useState<SupportDeskFilters>({
    search: '',
    status: 'open_queue',
    priority: 'all',
  });
  const [busy, setBusy] = useState(false);

  const ticketsQuery = useQuery({
    queryKey: ['admin', 'support', 'tickets'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'rpc_admin_list_support_tickets' as 'rpc_admin_list_casino_catalog',
        { p_status: null, p_limit: 100 } as never,
      );
      if (error) throw error;
      return isRecord(data) && Array.isArray(data['tickets']) ? (data['tickets'] as Json[]) : [];
    },
    enabled: mfaReady,
  });

  const tickets = useMemo(
    () =>
      (ticketsQuery.data ?? [])
        .map(mapTicketRow)
        .filter((row): row is AdminSupportTicketRow => row != null),
    [ticketsQuery.data],
  );

  const openQueueTickets = useMemo(
    () => tickets.filter((row) => isAdminSupportOpenStatus(row.status)),
    [tickets],
  );

  const openCount = openQueueTickets.length;
  const highPriorityOpenCount = useMemo(
    () => openQueueTickets.filter((row) => row.priority === 'high').length,
    [openQueueTickets],
  );

  const filteredTickets = useMemo(() => filterTickets(tickets, filters), [tickets, filters]);

  const auditEvents = useMemo(
    () =>
      auditLogs
        .map(mapAudit)
        .filter((event): event is AdminAuditEvent => event != null)
        .slice(0, 10),
    [auditLogs],
  );

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] });
  }, [qc]);

  const resolveMutation = useMutation({
    mutationFn: async (args: { ticketId: string; reason: string; resolutionNote?: string }) => {
      const { error } = await supabase.rpc(
        'rpc_admin_resolve_support_ticket' as 'rpc_admin_set_casino_game_status',
        {
          p_ticket_id: args.ticketId,
          p_reason: args.reason,
          p_resolution_note: args.resolutionNote ?? null,
        } as never,
      );
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const refresh = useCallback(async () => {
    await ticketsQuery.refetch();
  }, [ticketsQuery]);

  const loadTicketDetail = useCallback(async (ticketId: string) => {
    const { data, error } = await supabase.rpc(
      'rpc_get_support_ticket' as 'rpc_admin_list_casino_catalog',
      { p_ticket_id: ticketId } as never,
    );
    if (error) throw error;
    if (!isRecord(data) || !isRecord(data['ticket'])) return null;
    return mapTicketRow(data['ticket'] as Json);
  }, []);

  const resolveTicket = useCallback(
    async (args: { ticketId: string; reason: string; resolutionNote?: string }) => {
      if (args.reason.trim().length < MIN_REASON) throw new Error('reason_required');
      setBusy(true);
      try {
        await resolveMutation.mutateAsync({
          ticketId: args.ticketId,
          reason: args.reason.trim(),
          resolutionNote: args.resolutionNote?.trim(),
        });
      } finally {
        setBusy(false);
      }
    },
    [resolveMutation],
  );

  const canResolve = useCallback(
    (row: AdminSupportTicketRow) =>
      (ADMIN_SUPPORT_OPEN_STATUSES as readonly string[]).includes(row.status),
    [],
  );

  return {
    tickets,
    filteredTickets,
    openQueueTickets,
    openCount,
    highPriorityOpenCount,
    filters,
    setFilters,
    loading: ticketsQuery.isLoading,
    isError: ticketsQuery.isError,
    busy: busy || resolveMutation.isPending,
    auditEvents,
    refresh,
    loadTicketDetail,
    resolveTicket,
    canResolve,
  };
}
