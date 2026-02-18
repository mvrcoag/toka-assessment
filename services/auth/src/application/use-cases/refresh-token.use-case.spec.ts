import { RefreshTokenUseCase } from './refresh-token.use-case';
import { ApplicationError } from '../errors/application-error';
import { RefreshToken } from '../../domain/entities/refresh-token';
import { Scope } from '../../domain/value-objects/scope';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { RoleId } from '../../domain/value-objects/role-id';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';

describe('RefreshTokenUseCase', () => {
  const user = User.create({
    id: UserId.create('user-1'),
    name: UserName.create('Toka User'),
    email: Email.create('user@toka.local'),
    passwordHash: PasswordHash.create('hash'),
    roleId: RoleId.create('role-1'),
  });

  it('rotates refresh token and issues new tokens', async () => {
    const token = RefreshToken.issue({
      tokenId: 'refresh-id',
      userId: user.id,
      clientId: 'client-1',
      scope: Scope.from('openid email'),
      expiresAt: new Date(Date.now() + 10000),
    });

    const useCase = new RefreshTokenUseCase(
      {
        save: async () => undefined,
        find: async () => ({ token, revoked: false }),
        revoke: async () => undefined,
      },
      {
        issueAccessToken: async () => ({
          token: 'access',
          jti: 'jti-access',
          expiresAt: new Date(Date.now() + 1000),
        }),
        issueIdToken: async () => ({
          token: 'id',
          jti: 'jti-id',
          expiresAt: new Date(Date.now() + 1000),
        }),
        issueRefreshToken: async () => ({
          token: 'refresh',
          jti: 'jti-refresh',
          expiresAt: new Date(Date.now() + 2000),
        }),
        verifyAccessToken: async () => {
          throw new Error('not used');
        },
        verifyRefreshToken: async () => ({
          payload: { sub: user.id.value, clientId: 'client-1', scope: 'openid email' },
          jti: 'refresh-id',
          expiresAt: new Date(Date.now() + 10000),
        }),
        getJwks: async () => ({}),
        getIssuer: () => 'issuer',
      },
      {
        findById: async () => ({
          clientId: 'client-1',
          clientSecret: 'secret',
          redirectUris: [],
          allowedScopes: ['openid', 'email'],
        }),
      },
      {
        findByEmail: async () => user,
        findById: async () => user,
        save: async () => undefined,
      },
      {
        getRoleAbilities: async () => ({
          canView: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        }),
      },
      {
        blacklist: async () => undefined,
        isBlacklisted: async () => false,
      },
      { now: () => new Date() },
    );

    const tokens = await useCase.execute({
      refreshToken: 'refresh',
      clientId: 'client-1',
      clientSecret: 'secret',
    });

    expect(tokens.accessToken).toBe('access');
    expect(tokens.refreshToken).toBe('refresh');
  });

  it('rejects blacklisted refresh token', async () => {
    const useCase = new RefreshTokenUseCase(
      {
        save: async () => undefined,
        find: async () => null,
        revoke: async () => undefined,
      },
      {
        issueAccessToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        issueIdToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        issueRefreshToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        verifyAccessToken: async () => {
          throw new Error('not used');
        },
        verifyRefreshToken: async () => ({
          payload: { sub: user.id.value, clientId: 'client-1', scope: 'openid' },
          jti: 'refresh-id',
          expiresAt: new Date(Date.now() + 10000),
        }),
        getJwks: async () => ({}),
        getIssuer: () => 'issuer',
      },
      {
        findById: async () => ({
          clientId: 'client-1',
          clientSecret: 'secret',
          redirectUris: [],
          allowedScopes: ['openid'],
        }),
      },
      {
        findByEmail: async () => user,
        findById: async () => user,
        save: async () => undefined,
      },
      {
        getRoleAbilities: async () => ({
          canView: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        }),
      },
      {
        blacklist: async () => undefined,
        isBlacklisted: async () => true,
      },
      { now: () => new Date() },
    );

    await expect(
      useCase.execute({
        refreshToken: 'refresh',
        clientId: 'client-1',
        clientSecret: 'secret',
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it('rejects invalid client credentials', async () => {
    const useCase = new RefreshTokenUseCase(
      {
        save: async () => undefined,
        find: async () => null,
        revoke: async () => undefined,
      },
      {
        issueAccessToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        issueIdToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        issueRefreshToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        verifyAccessToken: async () => {
          throw new Error('not used');
        },
        verifyRefreshToken: async () => {
          throw new Error('not used');
        },
        getJwks: async () => ({}),
        getIssuer: () => 'issuer',
      },
      {
        findById: async () => null,
      },
      {
        findByEmail: async () => user,
        findById: async () => user,
        save: async () => undefined,
      },
      {
        getRoleAbilities: async () => ({
          canView: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        }),
      },
      {
        blacklist: async () => undefined,
        isBlacklisted: async () => false,
      },
      { now: () => new Date() },
    );

    await expect(
      useCase.execute({
        refreshToken: 'refresh',
        clientId: 'client-1',
        clientSecret: 'wrong',
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it('rejects expired refresh token', async () => {
    const token = RefreshToken.issue({
      tokenId: 'refresh-id',
      userId: user.id,
      clientId: 'client-1',
      scope: Scope.from('openid'),
      expiresAt: new Date(Date.now() - 1000),
    });
    const useCase = new RefreshTokenUseCase(
      {
        save: async () => undefined,
        find: async () => ({ token, revoked: false }),
        revoke: async () => undefined,
      },
      {
        issueAccessToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        issueIdToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        issueRefreshToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        verifyAccessToken: async () => {
          throw new Error('not used');
        },
        verifyRefreshToken: async () => ({
          payload: { sub: user.id.value, clientId: 'client-1', scope: 'openid' },
          jti: 'refresh-id',
          expiresAt: new Date(Date.now() - 1000),
        }),
        getJwks: async () => ({}),
        getIssuer: () => 'issuer',
      },
      {
        findById: async () => ({
          clientId: 'client-1',
          clientSecret: 'secret',
          redirectUris: [],
          allowedScopes: ['openid'],
        }),
      },
      {
        findByEmail: async () => user,
        findById: async () => user,
        save: async () => undefined,
      },
      {
        getRoleAbilities: async () => ({
          canView: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        }),
      },
      {
        blacklist: async () => undefined,
        isBlacklisted: async () => false,
      },
      { now: () => new Date() },
    );

    await expect(
      useCase.execute({
        refreshToken: 'refresh',
        clientId: 'client-1',
        clientSecret: 'secret',
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
