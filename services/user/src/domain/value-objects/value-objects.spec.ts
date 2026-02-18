import { DomainError } from '../errors/domain-error';
import { Email } from './email';
import { PasswordHash } from './password-hash';
import { Role } from './role';
import { UserId } from './user-id';
import { UserName } from './user-name';

describe('ValueObjects', () => {
  it('creates and validates email', () => {
    const email = Email.create('User@Example.com');
    expect(email.value).toBe('user@example.com');
    expect(() => Email.create('bad')).toThrow(DomainError);
  });

  it('creates user name and enforces min length', () => {
    const name = UserName.create('Toka User');
    expect(name.value).toBe('Toka User');
    expect(() => UserName.create('')).toThrow(DomainError);
    expect(() => UserName.create('A')).toThrow(DomainError);
  });

  it('creates user id and role', () => {
    const id = UserId.create(' user-1 ');
    const role = Role.create('admin');
    expect(id.value).toBe('user-1');
    expect(role.value).toBe('admin');
    expect(() => UserId.create('')).toThrow(DomainError);
    expect(() => Role.create('')).toThrow(DomainError);
  });

  it('creates password hash', () => {
    const hash = PasswordHash.create('hashed');
    expect(hash.value).toBe('hashed');
    expect(() => PasswordHash.create('')).toThrow(DomainError);
  });
});
