import { DomainError } from '../errors/domain-error';
import { Email } from './email';
import { PasswordHash } from './password-hash';
import { Role } from './role';
import { Scope } from './scope';
import { UserId } from './user-id';
import { UserName } from './user-name';

describe('ValueObjects', () => {
  it('creates and validates email', () => {
    const email = Email.create('User@Example.com');
    expect(email.value).toBe('user@example.com');
    expect(() => Email.create('not-an-email')).toThrow(DomainError);
  });

  it('creates user name with min length', () => {
    const name = UserName.create('Toka User');
    expect(name.value).toBe('Toka User');
    expect(() => UserName.create('')).toThrow(DomainError);
    expect(() => UserName.create('A')).toThrow(DomainError);
  });

  it('creates user id and compares', () => {
    const id1 = UserId.create(' user-1 ');
    const id2 = UserId.create('user-1');
    const id3 = UserId.create('user-2');
    expect(id1.value).toBe('user-1');
    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });

  it('creates role and password hash', () => {
    const role = Role.create('admin');
    expect(role.value).toBe('admin');
    const hash = PasswordHash.create('hashed');
    expect(hash.value).toBe('hashed');
    expect(() => Role.create('')).toThrow(DomainError);
    expect(() => PasswordHash.create('')).toThrow(DomainError);
  });

  it('parses scope and enforces allowed scopes', () => {
    const scope = Scope.from('openid email profile');
    expect(scope.has('openid')).toBe(true);
    expect(scope.includesOnly(['openid', 'email', 'profile'])).toBe(true);
    expect(scope.includesOnly(['openid'])).toBe(false);
    expect(scope.toString()).toBe('openid email profile');
    const emptyScope = Scope.from('');
    expect(emptyScope.list()).toEqual([]);
  });

  it('handles array scope input', () => {
    const scope = Scope.from(['openid', 'email']);
    expect(scope.list()).toEqual(['openid', 'email']);
  });
});
