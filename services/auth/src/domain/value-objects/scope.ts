import { DomainError } from '../errors/domain-error';

export class Scope {
  private readonly values: Set<string>;

  private constructor(values: string[]) {
    this.values = new Set(values);
  }

  static from(raw?: string | string[]): Scope {
    if (!raw) {
      return new Scope([]);
    }

    const scopes = Array.isArray(raw)
      ? raw.flatMap((value) => value.split(' '))
      : raw.split(' ');

    const normalized = scopes.map((value) => value.trim()).filter(Boolean);
    const unique = Array.from(new Set(normalized));

    if (unique.length === 0) {
      throw new DomainError('Scope is required');
    }

    return new Scope(unique);
  }

  toString(): string {
    return Array.from(this.values).join(' ');
  }

  has(scope: string): boolean {
    return this.values.has(scope);
  }

  includesOnly(allowed: string[]): boolean {
    return Array.from(this.values).every((scope) => allowed.includes(scope));
  }

  list(): string[] {
    return Array.from(this.values);
  }
}
