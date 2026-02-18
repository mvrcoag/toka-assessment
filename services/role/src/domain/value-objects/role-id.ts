import { DomainError } from '../errors/domain-error';
import { randomUUID } from 'crypto';

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

  static generate(): RoleId {
    return new RoleId(randomUUID());
  }

  get value(): string {
    return this._value;
  }
}
