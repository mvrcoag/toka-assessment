export interface DomainEvent {
  name: string;
  occurredAt: Date;
  actorId?: string;
  actorRole?: string;
}
