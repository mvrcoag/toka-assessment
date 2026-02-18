import { LoginAndIssueCodeUseCase } from './login-and-issue-code.use-case';
import { ApplicationError } from '../errors/application-error';
import { AuthorizationRequest } from '../../domain/auth/authorization-request';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { Role } from '../../domain/value-objects/role';
import { UserId } from '../../domain/value-objects/user-id';
import { UserName } from '../../domain/value-objects/user-name';

describe('LoginAndIssueCodeUseCase', () => {
  const user = User.create({
    id: UserId.create('user-1'),
    name: UserName.create('Toka User'),
    email: Email.create('user@toka.local'),
    passwordHash: PasswordHash.create('hash'),
    role: Role.create('user'),
  });

  it('issues authorization code for valid credentials', async () => {
    const authRequest = AuthorizationRequest.fromQuery({
      response_type: 'code',
      client_id: 'client-1',
      redirect_uri: 'http://localhost/callback',
      scope: 'openid email',
    });

    const useCase = new LoginAndIssueCodeUseCase(
      {
        findByEmail: async () => user,
        findById: async () => user,
        save: async () => undefined,
      },
      {
        hash: async () => PasswordHash.create('hash'),
        compare: async () => true,
      },
      {
        save: async () => undefined,
        consume: async () => null,
      },
      { generate: () => 'code-123' },
      { now: () => new Date('2025-01-01T00:00:00Z') },
      {
        authCodeTtlSeconds: 60,
        issuer: '',
        authorizationEndpoint: '',
        tokenEndpoint: '',
        userinfoEndpoint: '',
        jwksUri: '',
        supportedScopes: [],
        responseTypes: [],
        subjectTypes: [],
        idTokenSigningAlgorithms: [],
        tokenEndpointAuthMethods: [],
        accessTokenTtlSeconds: 0,
        refreshTokenTtlSeconds: 0,
      },
    );

    const code = await useCase.execute({
      authorizationRequest: authRequest,
      email: 'user@toka.local',
      password: 'password',
    });

    expect(code).toBe('code-123');
  });

  it('rejects invalid credentials', async () => {
    const authRequest = AuthorizationRequest.fromQuery({
      response_type: 'code',
      client_id: 'client-1',
      redirect_uri: 'http://localhost/callback',
      scope: 'openid',
    });

    const useCase = new LoginAndIssueCodeUseCase(
      {
        findByEmail: async () => null,
        findById: async () => null,
        save: async () => undefined,
      },
      {
        hash: async () => PasswordHash.create('hash'),
        compare: async () => false,
      },
      {
        save: async () => undefined,
        consume: async () => null,
      },
      { generate: () => 'code-123' },
      { now: () => new Date() },
      {
        authCodeTtlSeconds: 60,
        issuer: '',
        authorizationEndpoint: '',
        tokenEndpoint: '',
        userinfoEndpoint: '',
        jwksUri: '',
        supportedScopes: [],
        responseTypes: [],
        subjectTypes: [],
        idTokenSigningAlgorithms: [],
        tokenEndpointAuthMethods: [],
        accessTokenTtlSeconds: 0,
        refreshTokenTtlSeconds: 0,
      },
    );

    await expect(
      useCase.execute({
        authorizationRequest: authRequest,
        email: 'bad@toka.local',
        password: 'bad',
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it('rejects missing credentials', async () => {
    const authRequest = AuthorizationRequest.fromQuery({
      response_type: 'code',
      client_id: 'client-1',
      redirect_uri: 'http://localhost/callback',
      scope: 'openid',
    });

    const useCase = new LoginAndIssueCodeUseCase(
      {
        findByEmail: async () => user,
        findById: async () => user,
        save: async () => undefined,
      },
      {
        hash: async () => PasswordHash.create('hash'),
        compare: async () => true,
      },
      {
        save: async () => undefined,
        consume: async () => null,
      },
      { generate: () => 'code-123' },
      { now: () => new Date() },
      {
        authCodeTtlSeconds: 60,
        issuer: '',
        authorizationEndpoint: '',
        tokenEndpoint: '',
        userinfoEndpoint: '',
        jwksUri: '',
        supportedScopes: [],
        responseTypes: [],
        subjectTypes: [],
        idTokenSigningAlgorithms: [],
        tokenEndpointAuthMethods: [],
        accessTokenTtlSeconds: 0,
        refreshTokenTtlSeconds: 0,
      },
    );

    await expect(
      useCase.execute({
        authorizationRequest: authRequest,
        email: '',
        password: '',
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
