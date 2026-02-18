import { GetOpenIdConfigurationUseCase } from './get-openid-configuration.use-case';

describe('GetOpenIdConfigurationUseCase', () => {
  it('maps settings to configuration document', () => {
    const useCase = new GetOpenIdConfigurationUseCase({
      issuer: 'http://issuer',
      authorizationEndpoint: 'http://issuer/oauth/authorize',
      tokenEndpoint: 'http://issuer/oauth/token',
      userinfoEndpoint: 'http://issuer/oauth/userinfo',
      jwksUri: 'http://issuer/.well-known/jwks.json',
      supportedScopes: ['openid', 'email'],
      responseTypes: ['code'],
      subjectTypes: ['public'],
      idTokenSigningAlgorithms: ['RS256'],
      tokenEndpointAuthMethods: ['client_secret_post'],
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 86400,
      authCodeTtlSeconds: 600,
    });

    const config = useCase.execute();
    expect(config.issuer).toBe('http://issuer');
    expect(config.jwks_uri).toContain('jwks');
  });
});
