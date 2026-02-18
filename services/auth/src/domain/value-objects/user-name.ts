import { DomainError } from '../errors/domain-error';

export class UserName {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): UserName {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new DomainError('User name is required');
    }

    if (trimmed.length < 2) {
      throw new DomainError('User name is too short');
    }

    return new UserName(trimmed);
  }

  get value(): string {
    return this._value;
  }
}
