import { DomainError } from '../errors/domain-error';
import { RefreshToken } from './refresh-token';
import { Scope } from '../value-objects/scope';
import { UserId } from '../value-objects/user-id';

describe('RefreshToken', () => {
  it('issues and validates refresh token', () => {
    const expiresAt = new Date(Date.now() + 1000);
    const token = RefreshToken.issue({
      tokenId: 'token-id',
      userId: UserId.create('user-1'),
      clientId: 'client-1',
      scope: Scope.from('openid'),
      expiresAt,
    });

    expect(token.tokenId).toBe('token-id');
    expect(token.isExpired(new Date(expiresAt.getTime() + 1000))).toBe(true);
  });

  it('throws when token id is missing', () => {
    expect(() =>
      RefreshToken.issue({
        tokenId: '',
        userId: UserId.create('user-1'),
        clientId: 'client-1',
        scope: Scope.from('openid'),
        expiresAt: new Date(),
      }),
    ).toThrow(DomainError);
  });
});
