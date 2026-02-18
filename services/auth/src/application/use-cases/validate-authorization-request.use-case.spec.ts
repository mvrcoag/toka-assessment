import { ValidateAuthorizationRequestUseCase } from './validate-authorization-request.use-case';
import { ApplicationError } from '../errors/application-error';
import { OAuthClientRepository } from '../ports/oauth-client-repository';

describe('ValidateAuthorizationRequestUseCase', () => {
  it('accepts valid authorization request', async () => {
    const repo: OAuthClientRepository = {
      findById: async () => ({
        clientId: 'client-1',
        clientSecret: 'secret',
        redirectUris: ['http://localhost/callback'],
        allowedScopes: ['openid', 'email'],
      }),
    };
    const useCase = new ValidateAuthorizationRequestUseCase(repo);

    const request = await useCase.execute({
      response_type: 'code',
      client_id: 'client-1',
      redirect_uri: 'http://localhost/callback',
      scope: 'openid email',
    });

    expect(request.clientId).toBe('client-1');
    expect(request.scope.has('openid')).toBe(true);
  });

  it('rejects missing client and invalid scope', async () => {
    const repo: OAuthClientRepository = {
      findById: async () => null,
    };
    const useCase = new ValidateAuthorizationRequestUseCase(repo);

    await expect(
      useCase.execute({
        response_type: 'code',
        client_id: 'missing',
        redirect_uri: 'http://localhost/callback',
        scope: 'openid',
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it('rejects when openid scope is missing', async () => {
    const repo: OAuthClientRepository = {
      findById: async () => ({
        clientId: 'client-1',
        clientSecret: 'secret',
        redirectUris: ['http://localhost/callback'],
        allowedScopes: ['email'],
      }),
    };
    const useCase = new ValidateAuthorizationRequestUseCase(repo);

    await expect(
      useCase.execute({
        response_type: 'code',
        client_id: 'client-1',
        redirect_uri: 'http://localhost/callback',
        scope: 'email',
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
