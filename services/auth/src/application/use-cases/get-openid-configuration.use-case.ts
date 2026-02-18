import { OpenIdConfigurationDto } from '../dto/openid-configuration.dto';
import { AuthSettings } from '../ports/auth-settings';

export class GetOpenIdConfigurationUseCase {
  constructor(private readonly settings: AuthSettings) {}

  execute(): OpenIdConfigurationDto {
    return {
      issuer: this.settings.issuer,
      authorization_endpoint: this.settings.authorizationEndpoint,
      token_endpoint: this.settings.tokenEndpoint,
      userinfo_endpoint: this.settings.userinfoEndpoint,
      jwks_uri: this.settings.jwksUri,
      response_types_supported: this.settings.responseTypes,
      subject_types_supported: this.settings.subjectTypes,
      id_token_signing_alg_values_supported: this.settings.idTokenSigningAlgorithms,
      scopes_supported: this.settings.supportedScopes,
      token_endpoint_auth_methods_supported: this.settings.tokenEndpointAuthMethods,
    };
  }
}
