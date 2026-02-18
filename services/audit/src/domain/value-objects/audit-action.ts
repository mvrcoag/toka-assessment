import { DomainError } from '../errors/domain-error';

export class AuditAction {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): AuditAction {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new DomainError('Action is required');
    }

    return new AuditAction(trimmed);
  }

  get value(): string {
    return this._value;
  }
}
