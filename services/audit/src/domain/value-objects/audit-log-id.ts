import { DomainError } from '../errors/domain-error';

export class AuditLogId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): AuditLogId {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new DomainError('Audit log id is required');
    }

    return new AuditLogId(trimmed);
  }

  get value(): string {
    return this._value;
  }
}
