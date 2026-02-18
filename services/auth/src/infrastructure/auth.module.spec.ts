import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from './auth.module';
import {
  AUTH_CODE_GENERATOR,
  AUTH_CODE_REPOSITORY,
  AUTH_SETTINGS,
  CLOCK,
  EVENT_BUS,
  OAUTH_CLIENT_REPOSITORY,
  PASSWORD_HASHER,
  ROLE_LOOKUP,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_BLACKLIST,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../application/ports/tokens';
import { AuthConfig } from './config/auth.config';
import { SystemClock } from './clock/system-clock';
import { RandomAuthCodeGenerator } from './security/random-auth-code.generator';
import { BcryptPasswordHasher } from './security/bcrypt-password-hasher';
import { RedisAuthCodeRepository } from './persistence/redis-auth-code.repository';
import { RedisRefreshTokenRepository } from './persistence/redis-refresh-token.repository';
import { RedisTokenBlacklist } from './persistence/redis-token-blacklist';
import { StaticOAuthClientRepository } from './persistence/static-client.repository';
import { JwtTokenService } from './security/jwt-token.service';
import { RedisClient } from './redis/redis.client';
import { HttpUserRepository } from './http/http-user.repository';
import { HttpRoleLookup } from './http/http-role-lookup';
import { RabbitMqEventBus } from './rabbitmq/rabbitmq.event-bus';
import { ValidateAuthorizationRequestUseCase } from '../application/use-cases/validate-authorization-request.use-case';
import { LoginAndIssueCodeUseCase } from '../application/use-cases/login-and-issue-code.use-case';
import { ExchangeAuthorizationCodeUseCase } from '../application/use-cases/exchange-authorization-code.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { GetUserInfoUseCase } from '../application/use-cases/get-user-info.use-case';
import { GetOpenIdConfigurationUseCase } from '../application/use-cases/get-openid-configuration.use-case';
import { GetJwksUseCase } from '../application/use-cases/get-jwks.use-case';

describe('AuthModule providers', () => {
  it('builds provider factories', async () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuthModule) as any[];
    const byToken = (token: unknown) => providers.find((provider) => provider.provide === token);

    const config = new AuthConfig();
    const clock = new SystemClock();
    const authCodeGenerator = new RandomAuthCodeGenerator();
    const passwordHasher = new BcryptPasswordHasher(4);
    const redis = {
      getClient: () => ({
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        exists: jest.fn(),
      }),
    } as unknown as RedisClient;

    const userRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as HttpUserRepository;
    const roleLookup = {
      getRoleAbilities: jest.fn(),
    } as unknown as HttpRoleLookup;
    const clientRepo = byToken(OAUTH_CLIENT_REPOSITORY).useFactory(config);
    const authCodeRepo = byToken(AUTH_CODE_REPOSITORY).useFactory(redis);
    const refreshTokenRepo = byToken(REFRESH_TOKEN_REPOSITORY).useFactory(redis);
    const blacklist = byToken(TOKEN_BLACKLIST).useFactory(redis);
    const tokenService = byToken(TOKEN_SERVICE).useFactory(config, clock, config);
    expect(byToken(EVENT_BUS).useExisting).toBe(RabbitMqEventBus);

    expect(byToken(USER_REPOSITORY).useExisting).toBe(HttpUserRepository);
    expect(byToken(ROLE_LOOKUP).useExisting).toBe(HttpRoleLookup);
    expect(clientRepo).toBeInstanceOf(StaticOAuthClientRepository);
    expect(authCodeRepo).toBeInstanceOf(RedisAuthCodeRepository);
    expect(refreshTokenRepo).toBeInstanceOf(RedisRefreshTokenRepository);
    expect(blacklist).toBeInstanceOf(RedisTokenBlacklist);
    expect(tokenService).toBeInstanceOf(JwtTokenService);

    const validateAuth = byToken(ValidateAuthorizationRequestUseCase).useFactory(clientRepo);
    const login = byToken(LoginAndIssueCodeUseCase).useFactory(
      userRepo,
      passwordHasher,
      authCodeRepo,
      authCodeGenerator,
      clock,
      config,
    );
    const exchange = byToken(ExchangeAuthorizationCodeUseCase).useFactory(
      authCodeRepo,
      refreshTokenRepo,
      userRepo,
      roleLookup,
      tokenService,
      clientRepo,
      clock,
    );
    const refresh = byToken(RefreshTokenUseCase).useFactory(
      refreshTokenRepo,
      tokenService,
      clientRepo,
      userRepo,
      roleLookup,
      blacklist,
      clock,
    );
    const userInfo = byToken(GetUserInfoUseCase).useFactory(tokenService, blacklist, userRepo);
    const openid = byToken(GetOpenIdConfigurationUseCase).useFactory(config);
    const jwks = byToken(GetJwksUseCase).useFactory(tokenService);

    expect(validateAuth).toBeInstanceOf(ValidateAuthorizationRequestUseCase);
    expect(login).toBeInstanceOf(LoginAndIssueCodeUseCase);
    expect(exchange).toBeInstanceOf(ExchangeAuthorizationCodeUseCase);
    expect(refresh).toBeInstanceOf(RefreshTokenUseCase);
    expect(userInfo).toBeInstanceOf(GetUserInfoUseCase);
    expect(openid).toBeInstanceOf(GetOpenIdConfigurationUseCase);
    expect(jwks).toBeInstanceOf(GetJwksUseCase);

    const passwordHasherProvider = byToken(PASSWORD_HASHER).useFactory();
    const authCodeGeneratorProvider = byToken(AUTH_CODE_GENERATOR);
    const clockProvider = byToken(CLOCK);
    const settingsProvider = byToken(AUTH_SETTINGS);

    expect(passwordHasherProvider).toBeInstanceOf(BcryptPasswordHasher);
    expect(authCodeGeneratorProvider.useClass).toBe(RandomAuthCodeGenerator);
    expect(clockProvider.useClass).toBe(SystemClock);
    expect(settingsProvider.useExisting).toBe(AuthConfig);
  });
});
