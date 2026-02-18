import { DomainError } from '../errors/domain-error';

export class UserId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): UserId {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new DomainError('User id is required');
    }

    return new UserId(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }
}
