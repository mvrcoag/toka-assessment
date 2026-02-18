import { DomainError } from '../errors/domain-error';

export class AuditResource {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): AuditResource {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new DomainError('Resource is required');
    }

    return new AuditResource(trimmed);
  }

  get value(): string {
    return this._value;
  }
}
