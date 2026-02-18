import { ExchangeAuthorizationCodeUseCase } from './exchange-authorization-code.use-case';
import { ApplicationError } from '../errors/application-error';
import { AuthCode } from '../../domain/entities/auth-code';
import { Scope } from '../../domain/value-objects/scope';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { RoleId } from '../../domain/value-objects/role-id';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';

describe('ExchangeAuthorizationCodeUseCase', () => {
  const user = User.create({
    id: UserId.create('user-1'),
    name: UserName.create('Toka User'),
    email: Email.create('user@toka.local'),
    passwordHash: PasswordHash.create('hash'),
    roleId: RoleId.create('role-1'),
  });

  it('exchanges auth code for tokens', async () => {
    const authCode = AuthCode.issue({
      code: 'code-123',
      userId: user.id,
      clientId: 'client-1',
      redirectUri: 'http://localhost/callback',
      scope: Scope.from('openid email'),
      expiresAt: new Date(Date.now() + 10000),
    });

    const useCase = new ExchangeAuthorizationCodeUseCase(
      {
        save: async () => undefined,
        consume: async () => authCode,
      },
      {
        save: async () => undefined,
        find: async () => null,
        revoke: async () => undefined,
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
        verifyRefreshToken: async () => {
          throw new Error('not used');
        },
        getJwks: async () => ({}),
        getIssuer: () => 'issuer',
      },
      {
        findById: async () => ({
          clientId: 'client-1',
          clientSecret: 'secret',
          redirectUris: ['http://localhost/callback'],
          allowedScopes: ['openid', 'email'],
        }),
      },
      { now: () => new Date() },
    );

    const tokens = await useCase.execute({
      code: 'code-123',
      clientId: 'client-1',
      clientSecret: 'secret',
      redirectUri: 'http://localhost/callback',
    });

    expect(tokens.accessToken).toBe('access');
    expect(tokens.refreshToken).toBe('refresh');
  });

  it('rejects invalid client credentials', async () => {
    const useCase = new ExchangeAuthorizationCodeUseCase(
      {
        save: async () => undefined,
        consume: async () => null,
      },
      {
        save: async () => undefined,
        find: async () => null,
        revoke: async () => undefined,
      },
      {
        findByEmail: async () => null,
        findById: async () => null,
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
      { now: () => new Date() },
    );

    await expect(
      useCase.execute({
        code: 'code-123',
        clientId: 'client-1',
        clientSecret: 'bad',
        redirectUri: 'http://localhost/callback',
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it('rejects when code is expired or mismatched', async () => {
    const expiredCode = AuthCode.issue({
      code: 'code-123',
      userId: user.id,
      clientId: 'client-1',
      redirectUri: 'http://localhost/callback',
      scope: Scope.from('openid'),
      expiresAt: new Date(Date.now() - 1000),
    });

    const useCase = new ExchangeAuthorizationCodeUseCase(
      {
        save: async () => undefined,
        consume: async () => expiredCode,
      },
      {
        save: async () => undefined,
        find: async () => null,
        revoke: async () => undefined,
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
        findById: async () => ({
          clientId: 'client-1',
          clientSecret: 'secret',
          redirectUris: ['http://localhost/callback'],
          allowedScopes: ['openid'],
        }),
      },
      { now: () => new Date() },
    );

    await expect(
      useCase.execute({
        code: 'code-123',
        clientId: 'client-1',
        clientSecret: 'secret',
        redirectUri: 'http://localhost/callback',
      }),
    ).rejects.toBeInstanceOf(ApplicationError);

    await expect(
      useCase.execute({
        code: 'code-123',
        clientId: 'client-1',
        clientSecret: 'secret',
        redirectUri: 'http://localhost/other',
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it('rejects missing parameters', async () => {
    const useCase = new ExchangeAuthorizationCodeUseCase(
      {
        save: async () => undefined,
        consume: async () => null,
      },
      {
        save: async () => undefined,
        find: async () => null,
        revoke: async () => undefined,
      },
      {
        findByEmail: async () => null,
        findById: async () => null,
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
      { now: () => new Date() },
    );

    await expect(
      useCase.execute({
        code: '',
        clientId: '',
        clientSecret: '',
        redirectUri: '',
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
