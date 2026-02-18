import { DomainError } from '../errors/domain-error';

export class PasswordHash {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): PasswordHash {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new DomainError('Password hash is required');
    }

    return new PasswordHash(trimmed);
  }

  get value(): string {
    return this._value;
  }
}
