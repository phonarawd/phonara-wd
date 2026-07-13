import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  canSubmitSupportTicket,
  parseSupportTicketCreate,
  parseSupportTicketList,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_CREATE_RPC,
  SUPPORT_TICKET_ERROR_KEY,
  SUPPORT_TICKET_LIST_RPC,
  type SupportTicketCategory,
  type SupportTicketRowView,
} from '@/domain/support-ticket-display-contract';
import { callRpc } from '@/lib/rpc';
import { translateError } from '@/lib/translate-error';
import { useT } from '@/product/i18n';

export const supportTicketKeys = {
  list: (userId: string | null) => ['support-tickets', userId] as const,
};

async function fetchSupportTickets(): Promise<SupportTicketRowView[]> {
  const data = await callRpc(SUPPORT_TICKET_LIST_RPC, { p_limit: 50 });
  return parseSupportTicketList(data);
}

export type SupportTicketControllerView = {
  t: ReturnType<typeof useT>;
  live: boolean;
  categories: readonly SupportTicketCategory[];
  category: SupportTicketCategory;
  setCategory: (value: SupportTicketCategory) => void;
  subject: string;
  setSubject: (value: string) => void;
  body: string;
  setBody: (value: string) => void;
  confirmOpen: boolean;
  openConfirm: () => void;
  closeConfirm: () => void;
  submitting: boolean;
  submitErrorKey: MessageKey | null;
  submitSuccess: boolean;
  tickets: SupportTicketRowView[];
  ticketsLoading: boolean;
  submitTicket: () => Promise<void>;
  refreshTickets: () => void;
};

export function useSupportTicketController(): SupportTicketControllerView {
  const t = useT();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const qc = useQueryClient();
  const live = canSubmitSupportTicket();

  const [category, setCategory] = useState<SupportTicketCategory>('account');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitErrorKey, setSubmitErrorKey] = useState<MessageKey | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const ticketsQuery = useQuery({
    queryKey: supportTicketKeys.list(userId),
    queryFn: fetchSupportTickets,
    enabled: live && Boolean(userId),
  });

  const canOpenConfirm = useMemo(() => {
    const subj = subject.trim();
    const text = body.trim();
    return subj.length >= 3 && text.length >= 10;
  }, [subject, body]);

  const mutation = useMutation({
    mutationFn: async () => {
      const clientRequestId = crypto.randomUUID();
      const data = await callRpc(SUPPORT_TICKET_CREATE_RPC, {
        p_category: category,
        p_subject: subject.trim(),
        p_body: body.trim(),
        p_client_request_id: clientRequestId,
      });
      const parsed = parseSupportTicketCreate(data);
      if (!parsed) {
        throw new Error('SUPPORT_TICKET_PARSE');
      }
      return parsed;
    },
    onSuccess: async () => {
      setSubject('');
      setBody('');
      setSubmitSuccess(true);
      setConfirmOpen(false);
      await qc.invalidateQueries({ queryKey: supportTicketKeys.list(userId) });
    },
    onError: (error) => {
      setSubmitErrorKey(translateError(error, SUPPORT_TICKET_ERROR_KEY));
    },
  });

  const openConfirm = useCallback(() => {
    if (!canOpenConfirm) return;
    setSubmitErrorKey(null);
    setSubmitSuccess(false);
    setConfirmOpen(true);
  }, [canOpenConfirm]);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  const submitTicket = useCallback(async () => {
    setSubmitErrorKey(null);
    await mutation.mutateAsync();
  }, [mutation]);

  return {
    t,
    live,
    categories: SUPPORT_TICKET_CATEGORIES,
    category,
    setCategory,
    subject,
    setSubject,
    body,
    setBody,
    confirmOpen,
    openConfirm,
    closeConfirm,
    submitting: mutation.isPending,
    submitErrorKey,
    submitSuccess,
    tickets: ticketsQuery.data ?? [],
    ticketsLoading: ticketsQuery.isLoading,
    submitTicket,
    refreshTickets: () => {
      void ticketsQuery.refetch();
    },
  };
}
