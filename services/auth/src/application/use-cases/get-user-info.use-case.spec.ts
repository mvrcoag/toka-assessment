import { GetUserInfoUseCase } from './get-user-info.use-case';
import { ApplicationError } from '../errors/application-error';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { RoleId } from '../../domain/value-objects/role-id';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';

describe('GetUserInfoUseCase', () => {
  const user = User.create({
    id: UserId.create('user-1'),
    name: UserName.create('Toka User'),
    email: Email.create('user@toka.local'),
    passwordHash: PasswordHash.create('hash'),
    roleId: RoleId.create('role-1'),
  });

  it('returns user info from access token', async () => {
    const useCase = new GetUserInfoUseCase(
      {
        verifyAccessToken: async () => ({
          payload: {
            sub: user.id.value,
            email: user.email.value,
            name: user.name.value,
            role: user.roleId.value,
            roleAbilities: {
              canView: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            },
            scope: 'openid',
            clientId: 'client-1',
          },
          jti: 'jti-access',
          expiresAt: new Date(Date.now() + 1000),
        }),
        verifyRefreshToken: async () => {
          throw new Error('not used');
        },
        issueAccessToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        issueIdToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        issueRefreshToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        getJwks: async () => ({}),
        getIssuer: () => 'issuer',
      },
      {
        blacklist: async () => undefined,
        isBlacklisted: async () => false,
      },
      {
        findByEmail: async () => user,
        findById: async () => user,
        save: async () => undefined,
      },
    );

    const info = await useCase.execute('access');
    expect(info.email).toBe(user.email.value);
    expect(info.sub).toBe(user.id.value);
    expect(info.roleAbilities?.canView).toBe(true);
  });

  it('rejects blacklisted access token', async () => {
    const useCase = new GetUserInfoUseCase(
      {
        verifyAccessToken: async () => ({
          payload: {
            sub: user.id.value,
            email: user.email.value,
            name: user.name.value,
            role: user.roleId.value,
            roleAbilities: {
              canView: true,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            },
            scope: 'openid',
            clientId: 'client-1',
          },
          jti: 'jti-access',
          expiresAt: new Date(Date.now() + 1000),
        }),
        verifyRefreshToken: async () => {
          throw new Error('not used');
        },
        issueAccessToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        issueIdToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        issueRefreshToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        getJwks: async () => ({}),
        getIssuer: () => 'issuer',
      },
      {
        blacklist: async () => undefined,
        isBlacklisted: async () => true,
      },
      {
        findByEmail: async () => user,
        findById: async () => user,
        save: async () => undefined,
      },
    );

    await expect(useCase.execute('access')).rejects.toBeInstanceOf(ApplicationError);
  });

  it('rejects invalid access token', async () => {
    const useCase = new GetUserInfoUseCase(
      {
        verifyAccessToken: async () => {
          throw new Error('invalid');
        },
        verifyRefreshToken: async () => {
          throw new Error('not used');
        },
        issueAccessToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        issueIdToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        issueRefreshToken: async () => ({ token: '', jti: '', expiresAt: new Date() }),
        getJwks: async () => ({}),
        getIssuer: () => 'issuer',
      },
      {
        blacklist: async () => undefined,
        isBlacklisted: async () => false,
      },
      {
        findByEmail: async () => user,
        findById: async () => user,
        save: async () => undefined,
      },
    );

    await expect(useCase.execute('access')).rejects.toBeInstanceOf(ApplicationError);
  });
});
