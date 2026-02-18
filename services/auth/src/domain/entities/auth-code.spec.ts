import { DomainError } from '../errors/domain-error';
import { AuthCode } from './auth-code';
import { Scope } from '../value-objects/scope';
import { UserId } from '../value-objects/user-id';

describe('AuthCode', () => {
  it('issues and validates auth code', () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1000);
    const code = AuthCode.issue({
      code: 'code123',
      userId: UserId.create('user-1'),
      clientId: 'client-1',
      redirectUri: 'http://localhost/callback',
      scope: Scope.from('openid'),
      expiresAt,
    });

    expect(code.code).toBe('code123');
    expect(code.matches('client-1', 'http://localhost/callback')).toBe(true);
    expect(code.isExpired(new Date(expiresAt.getTime() + 1000))).toBe(true);
  });

  it('throws when code is missing', () => {
    expect(() =>
      AuthCode.issue({
        code: '',
        userId: UserId.create('user-1'),
        clientId: 'client-1',
        redirectUri: 'http://localhost/callback',
        scope: Scope.from('openid'),
        expiresAt: new Date(),
      }),
    ).toThrow(DomainError);
  });
});
