import { useEffect, useRef, useState } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';
export type RealtimeConnectionStatus = 'disabled' | 'connecting' | 'subscribed' | 'closed' | 'channel_error' | 'timed_out';

export interface UseRealtimeResult {
  status: RealtimeConnectionStatus;
  connected: boolean;
}

interface UseRealtimeOptions {
  /** Public table name to subscribe to. */
  table: string;
  /** PostgREST filter, e.g. `user_id=eq.<uuid>`. */
  filter?: string;
  event?: PostgresEvent;
  /** Query keys to invalidate when a change arrives. */
  invalidate?: QueryKey[];
  /** Imperative side effect on each change. */
  onChange?: (payload: unknown) => void;
  /** Disable the subscription (e.g. while unauthenticated). */
  enabled?: boolean;
}

type Listener = (payload: unknown) => void;
type StatusListener = (status: RealtimeConnectionStatus) => void;

interface PooledChannel {
  channel: RealtimeChannel;
  listeners: Set<Listener>;
  statusListeners: Set<StatusListener>;
  refCount: number;
  currentStatus: RealtimeConnectionStatus;
}

/** Supabase reuses channel instances by name — pool one postgres_changes handler per identity. */
const channelPool = new Map<string, PooledChannel>();

function channelKey(table: string, filter: string | undefined, event: PostgresEvent): string {
  return `rt:${table}:${filter ?? 'all'}:${event}`;
}

function mapSubscribeStatus(nextStatus: string): RealtimeConnectionStatus {
  if (nextStatus === 'SUBSCRIBED') return 'subscribed';
  if (nextStatus === 'CHANNEL_ERROR') return 'channel_error';
  if (nextStatus === 'TIMED_OUT') return 'timed_out';
  if (nextStatus === 'CLOSED') return 'closed';
  return 'connecting';
}

function notifyStatus(entry: PooledChannel, status: RealtimeConnectionStatus): void {
  entry.currentStatus = status;
  for (const listener of entry.statusListeners) {
    listener(status);
  }
}

function getOrCreatePooledChannel(
  key: string,
  table: string,
  filter: string | undefined,
  event: PostgresEvent,
): PooledChannel {
  const existing = channelPool.get(key);
  if (existing) return existing;

  const listeners = new Set<Listener>();
  const statusListeners = new Set<StatusListener>();

  const entry: PooledChannel = {
    channel: null as unknown as RealtimeChannel,
    listeners,
    statusListeners,
    refCount: 0,
    currentStatus: 'connecting',
  };

  entry.channel = supabase
    .channel(key)
    .on(
      'postgres_changes',
      { event, schema: 'public', table, ...(filter ? { filter } : {}) } as never,
      (payload: unknown) => {
        for (const listener of listeners) {
          listener(payload);
        }
      },
    )
    .subscribe((nextStatus) => {
      notifyStatus(entry, mapSubscribeStatus(nextStatus));
    });

  channelPool.set(key, entry);
  return entry;
}

function releasePooledChannel(key: string): void {
  const entry = channelPool.get(key);
  if (!entry) return;
  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    void supabase.removeChannel(entry.channel);
    channelPool.delete(key);
  }
}

/**
 * Subscribe to Supabase Realtime postgres_changes and invalidate the given
 * query keys on each event. Multiple hooks may share the same channel identity
 * (table/filter/event) without re-attaching postgres_changes after subscribe().
 */
export function useRealtime({
  table,
  filter,
  event = '*',
  invalidate,
  onChange,
  enabled = true,
}: UseRealtimeOptions): UseRealtimeResult {
  const qc = useQueryClient();
  const onChangeRef = useRef(onChange);
  const invalidateRef = useRef(invalidate);
  const [status, setStatus] = useState<RealtimeConnectionStatus>(enabled ? 'connecting' : 'disabled');

  useEffect(() => {
    onChangeRef.current = onChange;
    invalidateRef.current = invalidate;
  }, [onChange, invalidate]);

  useEffect(() => {
    if (!enabled) {
      setStatus('disabled');
      return;
    }

    const key = channelKey(table, filter, event);
    const entry = getOrCreatePooledChannel(key, table, filter, event);
    entry.refCount += 1;

    const listener: Listener = (payload) => {
      onChangeRef.current?.(payload);
      invalidateRef.current?.forEach((queryKey) => {
        void qc.invalidateQueries({ queryKey });
      });
    };
    entry.listeners.add(listener);

    const statusListener: StatusListener = (nextStatus) => setStatus(nextStatus);
    entry.statusListeners.add(statusListener);
    setStatus(entry.currentStatus);

    return () => {
      entry.listeners.delete(listener);
      entry.statusListeners.delete(statusListener);
      releasePooledChannel(key);
    };
  }, [qc, table, filter, event, enabled]);

  return { status, connected: status === 'subscribed' };
}
