import { DomainError } from '../errors/domain-error';

export class RoleId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): RoleId {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new DomainError('Role id is required');
    }

    return new RoleId(trimmed);
  }

  get value(): string {
    return this._value;
  }
}
