import { randomUUID } from 'crypto';
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

  static generate(): UserId {
    return new UserId(randomUUID());
  }

  get value(): string {
    return this._value;
  }
}
