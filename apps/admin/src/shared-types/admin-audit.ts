/** Admin inline audit trail event — presentation hooks consume this, not UI primitives. */
export interface AdminAuditEvent {
  id: string;
  at: string;
  actorKey: string;
  actionKey: string;
  subject?: string;
  reason?: string;
}
