import { DomainError } from '../errors/domain-error';

export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Email {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new DomainError('Email is required');
    }

    const normalized = trimmed.toLowerCase();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
    if (!isValid) {
      throw new DomainError('Email is invalid');
    }

    return new Email(normalized);
  }

  get value(): string {
    return this._value;
  }
}
