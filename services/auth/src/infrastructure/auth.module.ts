import { Module } from '@nestjs/common';
import {
  AUTH_CODE_GENERATOR,
  AUTH_CODE_REPOSITORY,
  AUTH_SETTINGS,
  CLOCK,
  OAUTH_CLIENT_REPOSITORY,
  PASSWORD_HASHER,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_BLACKLIST,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../application/ports/tokens';
import { ExchangeAuthorizationCodeUseCase } from '../application/use-cases/exchange-authorization-code.use-case';
import { GetJwksUseCase } from '../application/use-cases/get-jwks.use-case';
import { GetOpenIdConfigurationUseCase } from '../application/use-cases/get-openid-configuration.use-case';
import { GetUserInfoUseCase } from '../application/use-cases/get-user-info.use-case';
import { LoginAndIssueCodeUseCase } from '../application/use-cases/login-and-issue-code.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { ValidateAuthorizationRequestUseCase } from '../application/use-cases/validate-authorization-request.use-case';
import { AuthController } from '../presentation/http/auth.controller';
import { WellKnownController } from '../presentation/http/well-known.controller';
import { SystemClock } from './clock/system-clock';
import { AuthConfig } from './config/auth.config';
import { PostgresUserRepository } from './persistence/postgres-user.repository';
import { RedisAuthCodeRepository } from './persistence/redis-auth-code.repository';
import { RedisRefreshTokenRepository } from './persistence/redis-refresh-token.repository';
import { RedisTokenBlacklist } from './persistence/redis-token-blacklist';
import { StaticOAuthClientRepository } from './persistence/static-client.repository';
import { PostgresClient } from './postgres/postgres.client';
import { RedisClient } from './redis/redis.client';
import { BcryptPasswordHasher } from './security/bcrypt-password-hasher';
import { JwtTokenService } from './security/jwt-token.service';
import { RandomAuthCodeGenerator } from './security/random-auth-code.generator';

@Module({
  controllers: [AuthController, WellKnownController],
  providers: [
    AuthConfig,
    RedisClient,
    PostgresClient,
    {
      provide: AUTH_SETTINGS,
      useExisting: AuthConfig,
    },
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
    {
      provide: AUTH_CODE_GENERATOR,
      useClass: RandomAuthCodeGenerator,
    },
    {
      provide: PASSWORD_HASHER,
      useFactory: () => new BcryptPasswordHasher(10),
    },
    {
      provide: USER_REPOSITORY,
      useFactory: (postgres: PostgresClient) => new PostgresUserRepository(postgres),
      inject: [PostgresClient],
    },
    {
      provide: OAUTH_CLIENT_REPOSITORY,
      useFactory: (config: AuthConfig) => new StaticOAuthClientRepository(config),
      inject: [AuthConfig],
    },
    {
      provide: AUTH_CODE_REPOSITORY,
      useFactory: (redis: RedisClient) => new RedisAuthCodeRepository(redis),
      inject: [RedisClient],
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useFactory: (redis: RedisClient) => new RedisRefreshTokenRepository(redis),
      inject: [RedisClient],
    },
    {
      provide: TOKEN_BLACKLIST,
      useFactory: (redis: RedisClient) => new RedisTokenBlacklist(redis),
      inject: [RedisClient],
    },
    {
      provide: TOKEN_SERVICE,
      useFactory: (settings: AuthConfig, clock: SystemClock, config: AuthConfig) =>
        new JwtTokenService(settings, clock, config),
      inject: [AUTH_SETTINGS, CLOCK, AuthConfig],
    },
    {
      provide: ValidateAuthorizationRequestUseCase,
      useFactory: (clientRepository: StaticOAuthClientRepository) =>
        new ValidateAuthorizationRequestUseCase(clientRepository),
      inject: [OAUTH_CLIENT_REPOSITORY],
    },
    {
      provide: LoginAndIssueCodeUseCase,
      useFactory: (
        userRepository: PostgresUserRepository,
        hasher: BcryptPasswordHasher,
        authCodeRepository: RedisAuthCodeRepository,
        authCodeGenerator: RandomAuthCodeGenerator,
        clock: SystemClock,
        settings: AuthConfig,
      ) =>
        new LoginAndIssueCodeUseCase(
          userRepository,
          hasher,
          authCodeRepository,
          authCodeGenerator,
          clock,
          settings,
        ),
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        AUTH_CODE_REPOSITORY,
        AUTH_CODE_GENERATOR,
        CLOCK,
        AUTH_SETTINGS,
      ],
    },
    {
      provide: ExchangeAuthorizationCodeUseCase,
      useFactory: (
        authCodeRepository: RedisAuthCodeRepository,
        refreshTokenRepository: RedisRefreshTokenRepository,
        userRepository: PostgresUserRepository,
        tokenService: JwtTokenService,
        clientRepository: StaticOAuthClientRepository,
        clock: SystemClock,
      ) =>
        new ExchangeAuthorizationCodeUseCase(
          authCodeRepository,
          refreshTokenRepository,
          userRepository,
          tokenService,
          clientRepository,
          clock,
        ),
      inject: [
        AUTH_CODE_REPOSITORY,
        REFRESH_TOKEN_REPOSITORY,
        USER_REPOSITORY,
        TOKEN_SERVICE,
        OAUTH_CLIENT_REPOSITORY,
        CLOCK,
      ],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (
        refreshTokenRepository: RedisRefreshTokenRepository,
        tokenService: JwtTokenService,
        clientRepository: StaticOAuthClientRepository,
        userRepository: PostgresUserRepository,
        tokenBlacklist: RedisTokenBlacklist,
        clock: SystemClock,
      ) =>
        new RefreshTokenUseCase(
          refreshTokenRepository,
          tokenService,
          clientRepository,
          userRepository,
          tokenBlacklist,
          clock,
        ),
      inject: [
        REFRESH_TOKEN_REPOSITORY,
        TOKEN_SERVICE,
        OAUTH_CLIENT_REPOSITORY,
        USER_REPOSITORY,
        TOKEN_BLACKLIST,
        CLOCK,
      ],
    },
    {
      provide: GetUserInfoUseCase,
      useFactory: (
        tokenService: JwtTokenService,
        tokenBlacklist: RedisTokenBlacklist,
        userRepository: PostgresUserRepository,
      ) => new GetUserInfoUseCase(tokenService, tokenBlacklist, userRepository),
      inject: [TOKEN_SERVICE, TOKEN_BLACKLIST, USER_REPOSITORY],
    },
    {
      provide: GetOpenIdConfigurationUseCase,
      useFactory: (settings: AuthConfig) =>
        new GetOpenIdConfigurationUseCase(settings),
      inject: [AUTH_SETTINGS],
    },
    {
      provide: GetJwksUseCase,
      useFactory: (tokenService: JwtTokenService) => new GetJwksUseCase(tokenService),
      inject: [TOKEN_SERVICE],
    },
  ],
})
export class AuthModule {}
