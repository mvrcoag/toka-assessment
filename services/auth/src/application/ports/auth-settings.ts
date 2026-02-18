export interface AuthSettings {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  jwksUri: string;
  supportedScopes: string[];
  responseTypes: string[];
  subjectTypes: string[];
  idTokenSigningAlgorithms: string[];
  tokenEndpointAuthMethods: string[];
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  authCodeTtlSeconds: number;
}
