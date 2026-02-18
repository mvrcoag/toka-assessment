import { DomainError } from '../errors/domain-error';

export class RoleName {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): RoleName {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new DomainError('Role name is required');
    }

    if (trimmed.length < 2) {
      throw new DomainError('Role name is too short');
    }

    return new RoleName(trimmed);
  }

  get value(): string {
    return this._value;
  }
}
