import { RefreshToken } from '../../domain/entities/refresh-token';
import { UserId } from '../../domain/value-objects/user-id';
import { AuthTokensDto } from '../dto/auth-tokens.dto';
import { ApplicationError } from '../errors/application-error';
import { Clock } from '../ports/clock';
import { OAuthClientRepository } from '../ports/oauth-client-repository';
import { RefreshTokenRepository } from '../ports/refresh-token-repository';
import { TokenBlacklist } from '../ports/token-blacklist';
import { TokenService } from '../ports/token-service';
import { UserRepository } from '../ports/user-repository';
import { RoleLookup } from '../ports/role-lookup';

export interface RefreshTokenInput {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly clientRepository: OAuthClientRepository,
    private readonly userRepository: UserRepository,
    private readonly roleLookup: RoleLookup,
    private readonly tokenBlacklist: TokenBlacklist,
    private readonly clock: Clock,
  ) {}

  async execute(input: RefreshTokenInput): Promise<AuthTokensDto> {
    if (!input.refreshToken || !input.clientId || !input.clientSecret) {
      throw new ApplicationError('Missing required parameters', 400);
    }

    const client = await this.clientRepository.findById(input.clientId);
    if (!client || client.clientSecret !== input.clientSecret) {
      throw new ApplicationError('Invalid client credentials', 401);
    }

    let verified;
    try {
      verified = await this.tokenService.verifyRefreshToken(input.refreshToken);
    } catch {
      throw new ApplicationError('Refresh token is invalid', 401);
    }
    const isBlacklisted = await this.tokenBlacklist.isBlacklisted(verified.jti);
    if (isBlacklisted) {
      throw new ApplicationError('Refresh token is revoked', 401);
    }
    const record = await this.refreshTokenRepository.find(verified.jti);

    if (!record || record.revoked) {
      throw new ApplicationError('Refresh token is invalid', 401);
    }

    if (record.token.isExpired(this.clock.now())) {
      throw new ApplicationError('Refresh token has expired', 401);
    }

    if (record.token.clientId !== input.clientId) {
      throw new ApplicationError('Refresh token is not valid for this client', 401);
    }

    const user = await this.userRepository.findById(UserId.create(verified.payload.sub));
    if (!user) {
      throw new ApplicationError('User not found', 404);
    }

    const roleAbilities = await this.resolveRoleAbilities(user.roleId.value);

    await this.refreshTokenRepository.revoke(verified.jti);
    await this.tokenBlacklist.blacklist(verified.jti, record.token.expiresAt);

    const accessToken = await this.tokenService.issueAccessToken({
      sub: user.id.value,
      email: user.email.value,
      name: user.name.value,
      role: user.roleId.value,
      roleAbilities,
      scope: record.token.scope.toString(),
      clientId: input.clientId,
    });

    const idToken = await this.tokenService.issueIdToken({
      sub: user.id.value,
      email: user.email.value,
      name: user.name.value,
      role: user.roleId.value,
      roleAbilities,
      aud: input.clientId,
    });

    const refreshTokenIssued = await this.tokenService.issueRefreshToken({
      sub: user.id.value,
      clientId: input.clientId,
      scope: record.token.scope.toString(),
    });

    const refreshToken = RefreshToken.issue({
      tokenId: refreshTokenIssued.jti,
      userId: user.id,
      clientId: input.clientId,
      scope: record.token.scope,
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

  private async resolveRoleAbilities(roleId: string) {
    try {
      const abilities = await this.roleLookup.getRoleAbilities(roleId);
      if (!abilities) {
        throw new ApplicationError('Role not found', 404);
      }
      return abilities;
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError('Unable to load role abilities', 502);
    }
  }
}
