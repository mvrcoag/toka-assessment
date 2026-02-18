import { ApplicationError } from '../errors/application-error';
import { EventBus } from '../ports/event-bus';
import { RefreshTokenRepository } from '../ports/refresh-token-repository';
import { TokenBlacklist } from '../ports/token-blacklist';
import { TokenService } from '../ports/token-service';
import { UserLoggedOutEvent } from '../../domain/events/user-logged-out.event';

export interface LogoutInput {
  accessToken: string;
  refreshToken?: string;
}

export class LogoutUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenBlacklist: TokenBlacklist,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    let verifiedAccess;
    try {
      verifiedAccess = await this.tokenService.verifyAccessToken(input.accessToken);
    } catch {
      throw new ApplicationError('Invalid access token', 401);
    }

    await this.tokenBlacklist.blacklist(
      verifiedAccess.jti,
      verifiedAccess.expiresAt,
    );

    if (input.refreshToken) {
      try {
        const verifiedRefresh = await this.tokenService.verifyRefreshToken(
          input.refreshToken,
        );
        await this.refreshTokenRepository.revoke(verifiedRefresh.jti);
      } catch {
        throw new ApplicationError('Invalid refresh token', 400);
      }
    }

    const userId = String(verifiedAccess.payload.sub ?? '');
    const event = new UserLoggedOutEvent(userId);
    event.actorId = userId;
    event.actorRole =
      typeof verifiedAccess.payload.role === 'string'
        ? verifiedAccess.payload.role
        : undefined;
    await this.eventBus.publish(event);
  }
}
