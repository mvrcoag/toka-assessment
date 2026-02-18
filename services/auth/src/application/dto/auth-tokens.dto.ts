export interface AuthTokensDto {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
