import { DomainError } from '../errors/domain-error';

export class Role {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Role {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new DomainError('Role is required');
    }

    return new Role(trimmed);
  }

  get value(): string {
    return this._value;
  }
}
