import { UserId } from '../../domain/value-objects/user-id';
import { UserInfoDto } from '../dto/user-info.dto';
import { ApplicationError } from '../errors/application-error';
import { TokenBlacklist } from '../ports/token-blacklist';
import { TokenService } from '../ports/token-service';
import { UserRepository } from '../ports/user-repository';

export class GetUserInfoUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly tokenBlacklist: TokenBlacklist,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(accessToken: string): Promise<UserInfoDto> {
    let verified;
    try {
      verified = await this.tokenService.verifyAccessToken(accessToken);
    } catch {
      throw new ApplicationError('Access token is invalid', 401);
    }
    const isBlacklisted = await this.tokenBlacklist.isBlacklisted(verified.jti);

    if (isBlacklisted) {
      throw new ApplicationError('Token is revoked', 401);
    }

    const user = await this.userRepository.findById(
      UserId.create(verified.payload.sub),
    );

    if (!user) {
      throw new ApplicationError('User not found', 404);
    }

    return {
      sub: user.id.value,
      name: user.name.value,
      email: user.email.value,
      roleId: user.roleId.value,
      roleAbilities: verified.payload.roleAbilities,
    };
  }
}
