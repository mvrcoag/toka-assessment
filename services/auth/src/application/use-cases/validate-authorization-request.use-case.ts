import { AuthorizationRequest } from '../../domain/auth/authorization-request';
import { ApplicationError } from '../errors/application-error';
import { OAuthClientRepository } from '../ports/oauth-client-repository';

export class ValidateAuthorizationRequestUseCase {
  constructor(private readonly clientRepository: OAuthClientRepository) {}

  async execute(query: Record<string, unknown>): Promise<AuthorizationRequest> {
    const request = AuthorizationRequest.fromQuery(query);
    const client = await this.clientRepository.findById(request.clientId);

    if (!client) {
      throw new ApplicationError('OAuth client not found', 400);
    }

    if (!client.redirectUris.includes(request.redirectUri)) {
      throw new ApplicationError('Redirect URI is not allowed', 400);
    }

    if (!request.scope.includesOnly(client.allowedScopes)) {
      throw new ApplicationError('Requested scope is not allowed', 400);
    }

    if (!request.scope.has('openid')) {
      throw new ApplicationError('openid scope is required', 400);
    }

    return request;
  }
}
