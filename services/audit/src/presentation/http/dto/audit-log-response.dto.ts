export interface AuditLogResponseDto {
  id: string;
  action: string;
  resource: string;
  actorId?: string;
  actorRole?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}
