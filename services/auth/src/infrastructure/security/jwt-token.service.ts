import {
  exportJWK,
  generateKeyPair,
  importPKCS8,
  importSPKI,
  jwtVerify,
  KeyLike,
  SignJWT,
} from 'jose';
import { randomUUID } from 'crypto';
import { AuthSettings } from '../../application/ports/auth-settings';
import {
  AccessTokenPayload,
  IdTokenPayload,
  IssuedToken,
  RefreshTokenPayload,
  TokenService,
  VerifiedToken,
} from '../../application/ports/token-service';
import { Clock } from '../../application/ports/clock';
import { AuthConfig } from '../config/auth.config';

type KeyPair = {
  privateKey: KeyLike;
  publicKey: KeyLike;
};

export class JwtTokenService implements TokenService {
  private keyPromise: Promise<KeyPair> | null = null;
  private jwksPromise: Promise<Record<string, unknown>> | null = null;

  constructor(
    private readonly settings: AuthSettings,
    private readonly clock: Clock,
    private readonly config: AuthConfig,
  ) {}

  getIssuer(): string {
    return this.settings.issuer;
  }

  async issueAccessToken(payload: AccessTokenPayload): Promise<IssuedToken> {
    const nowSeconds = Math.floor(this.clock.now().getTime() / 1000);
    const expiresAt = new Date(
      (nowSeconds + this.settings.accessTokenTtlSeconds) * 1000,
    );
    const jti = randomUUID();
    const { privateKey } = await this.getKeys();

    const token = await new SignJWT({
      ...payload,
      jti,
      scope: payload.scope,
    })
      .setProtectedHeader({ alg: 'RS256', kid: this.config.jwtKeyId, typ: 'JWT' })
      .setIssuedAt(nowSeconds)
      .setIssuer(this.settings.issuer)
      .setSubject(payload.sub)
      .setAudience(payload.clientId)
      .setExpirationTime(expiresAt)
      .sign(privateKey);

    return { token, jti, expiresAt };
  }

  async issueIdToken(payload: IdTokenPayload): Promise<IssuedToken> {
    const nowSeconds = Math.floor(this.clock.now().getTime() / 1000);
    const expiresAt = new Date(
      (nowSeconds + this.settings.accessTokenTtlSeconds) * 1000,
    );
    const jti = randomUUID();
    const { privateKey } = await this.getKeys();

    const token = await new SignJWT({
      ...payload,
      jti,
    })
      .setProtectedHeader({ alg: 'RS256', kid: this.config.jwtKeyId, typ: 'JWT' })
      .setIssuedAt(nowSeconds)
      .setIssuer(this.settings.issuer)
      .setSubject(payload.sub)
      .setAudience(payload.aud)
      .setExpirationTime(expiresAt)
      .sign(privateKey);

    return { token, jti, expiresAt };
  }

  async issueRefreshToken(payload: RefreshTokenPayload): Promise<IssuedToken> {
    const nowSeconds = Math.floor(this.clock.now().getTime() / 1000);
    const expiresAt = new Date(
      (nowSeconds + this.settings.refreshTokenTtlSeconds) * 1000,
    );
    const jti = randomUUID();
    const { privateKey } = await this.getKeys();

    const token = await new SignJWT({
      ...payload,
      jti,
      scope: payload.scope,
    })
      .setProtectedHeader({ alg: 'RS256', kid: this.config.jwtKeyId, typ: 'JWT' })
      .setIssuedAt(nowSeconds)
      .setIssuer(this.settings.issuer)
      .setSubject(payload.sub)
      .setAudience(payload.clientId)
      .setExpirationTime(expiresAt)
      .sign(privateKey);

    return { token, jti, expiresAt };
  }

  async verifyAccessToken(
    token: string,
  ): Promise<VerifiedToken<AccessTokenPayload>> {
    const { publicKey } = await this.getKeys();
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: this.settings.issuer,
    });

    return this.toVerifiedToken<AccessTokenPayload>(payload);
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<VerifiedToken<RefreshTokenPayload>> {
    const { publicKey } = await this.getKeys();
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: this.settings.issuer,
    });

    return this.toVerifiedToken<RefreshTokenPayload>(payload);
  }

  async getJwks(): Promise<Record<string, unknown>> {
    if (!this.jwksPromise) {
      this.jwksPromise = this.buildJwks();
    }

    return this.jwksPromise;
  }

  private async buildJwks(): Promise<Record<string, unknown>> {
    const { publicKey } = await this.getKeys();
    const jwk = await exportJWK(publicKey);

    return {
      keys: [
        {
          ...jwk,
          kid: this.config.jwtKeyId,
          alg: 'RS256',
          use: 'sig',
        },
      ],
    };
  }

  private async getKeys(): Promise<KeyPair> {
    if (!this.keyPromise) {
      this.keyPromise = this.loadKeys();
    }

    return this.keyPromise;
  }

  private async loadKeys(): Promise<KeyPair> {
    if (this.config.jwtPrivateKey && this.config.jwtPublicKey) {
      const privateKey = await importPKCS8(this.config.jwtPrivateKey, 'RS256');
      const publicKey = await importSPKI(this.config.jwtPublicKey, 'RS256');
      return { privateKey, publicKey };
    }

    const { privateKey, publicKey } = await generateKeyPair('RS256');
    return { privateKey, publicKey };
  }

  private toVerifiedToken<TPayload extends Record<string, unknown>>(
    payload: Record<string, unknown>,
  ): VerifiedToken<TPayload> {
    const exp = payload.exp;
    const jti = payload.jti;

    if (typeof exp !== 'number' || typeof jti !== 'string') {
      throw new Error('Token is missing required claims');
    }

    return {
      payload: payload as TPayload,
      jti,
      expiresAt: new Date(exp * 1000),
    };
  }
}
