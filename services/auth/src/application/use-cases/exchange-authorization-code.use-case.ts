import { RefreshToken } from '../../domain/entities/refresh-token';
import { AuthTokensDto } from '../dto/auth-tokens.dto';
import { ApplicationError } from '../errors/application-error';
import { AuthCodeRepository } from '../ports/auth-code-repository';
import { Clock } from '../ports/clock';
import { OAuthClientRepository } from '../ports/oauth-client-repository';
import { RefreshTokenRepository } from '../ports/refresh-token-repository';
import { TokenService } from '../ports/token-service';
import { UserRepository } from '../ports/user-repository';

export interface ExchangeAuthorizationCodeInput {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class ExchangeAuthorizationCodeUseCase {
  constructor(
    private readonly authCodeRepository: AuthCodeRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly clientRepository: OAuthClientRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ExchangeAuthorizationCodeInput): Promise<AuthTokensDto> {
    if (!input.code || !input.clientId || !input.clientSecret || !input.redirectUri) {
      throw new ApplicationError('Missing required parameters', 400);
    }

    const client = await this.clientRepository.findById(input.clientId);
    if (!client || client.clientSecret !== input.clientSecret) {
      throw new ApplicationError('Invalid client credentials', 401);
    }

    const authCode = await this.authCodeRepository.consume(input.code);
    if (!authCode) {
      throw new ApplicationError('Authorization code is invalid', 400);
    }

    if (authCode.isExpired(this.clock.now())) {
      throw new ApplicationError('Authorization code has expired', 400);
    }

    if (!authCode.matches(input.clientId, input.redirectUri)) {
      throw new ApplicationError('Authorization code does not match client', 400);
    }

    const user = await this.userRepository.findById(authCode.userId);
    if (!user) {
      throw new ApplicationError('User not found', 404);
    }

    const accessToken = await this.tokenService.issueAccessToken({
      sub: user.id.value,
      email: user.email.value,
      name: user.name.value,
      role: user.role.value,
      scope: authCode.scope.toString(),
      clientId: input.clientId,
    });

    const idToken = await this.tokenService.issueIdToken({
      sub: user.id.value,
      email: user.email.value,
      name: user.name.value,
      role: user.role.value,
      aud: input.clientId,
    });

    const refreshTokenIssued = await this.tokenService.issueRefreshToken({
      sub: user.id.value,
      clientId: input.clientId,
      scope: authCode.scope.toString(),
    });

    const refreshToken = RefreshToken.issue({
      tokenId: refreshTokenIssued.jti,
      userId: user.id,
      clientId: input.clientId,
      scope: authCode.scope,
      expiresAt: refreshTokenIssued.expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);

    const expiresIn = Math.max(
      0,
      Math.floor(
        (accessToken.expiresAt.getTime() - this.clock.now().getTime()) / 1000,
      ),
    );

    return {
      accessToken: accessToken.token,
      idToken: idToken.token,
      refreshToken: refreshTokenIssued.token,
      tokenType: 'Bearer',
      expiresIn,
    };
  }
}
