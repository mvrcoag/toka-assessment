import { Body, Controller, Get, Headers, HttpException, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../../domain/errors/domain-error';
import { AuthorizationRequest } from '../../domain/auth/authorization-request';
import { AuthTokensDto } from '../../application/dto/auth-tokens.dto';
import { ApplicationError } from '../../application/errors/application-error';
import { ExchangeAuthorizationCodeUseCase } from '../../application/use-cases/exchange-authorization-code.use-case';
import { GetUserInfoUseCase } from '../../application/use-cases/get-user-info.use-case';
import { LoginAndIssueCodeUseCase } from '../../application/use-cases/login-and-issue-code.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { ValidateAuthorizationRequestUseCase } from '../../application/use-cases/validate-authorization-request.use-case';
import { AuthorizeBodyDto } from './dto/authorize-body.dto';
import { AuthorizeQueryDto } from './dto/authorize-query.dto';
import { TokenRequestDto } from './dto/token-request.dto';
import { renderLoginForm } from './auth.view';

@Controller()
export class AuthController {
  constructor(
    private readonly validateAuthorizationRequest: ValidateAuthorizationRequestUseCase,
    private readonly loginAndIssueCode: LoginAndIssueCodeUseCase,
    private readonly exchangeAuthorizationCode: ExchangeAuthorizationCodeUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
    private readonly getUserInfo: GetUserInfoUseCase,
  ) {}

  @Get('oauth/authorize')
  async showLogin(@Query() query: AuthorizeQueryDto, @Res() res: Response) {
    try {
      const queryRecord = { ...query } as Record<string, unknown>;
      const request = await this.validateAuthorizationRequest.execute(queryRecord);
      res.type('html').send(
        renderLoginForm({
          clientId: request.clientId,
          redirectUri: request.redirectUri,
          scope: request.scope.toString(),
          state: request.state,
          nonce: request.nonce,
        }),
      );
    } catch (error) {
      this.handleFormError(res, error, undefined, { ...query } as Record<string, unknown>);
    }
  }

  @Post('oauth/authorize')
  async handleLogin(@Body() body: AuthorizeBodyDto, @Res() res: Response) {
    try {
      const bodyRecord = { ...body } as Record<string, unknown>;
      const request = await this.validateAuthorizationRequest.execute(bodyRecord);
      const email = body.email;
      const password = body.password;

      const code = await this.loginAndIssueCode.execute({
        authorizationRequest: request,
        email,
        password,
      });

      const redirectUrl = new URL(request.redirectUri);
      redirectUrl.searchParams.set('code', code);
      if (request.state) {
        redirectUrl.searchParams.set('state', request.state);
      }

      res.redirect(redirectUrl.toString());
    } catch (error) {
      const clientId = body.client_id;
      const redirectUri = body.redirect_uri;
      const scope = body.scope;
      const state = body.state;
      const nonce = body.nonce;

      let fallbackRequest: AuthorizationRequest | undefined;
      if (clientId && redirectUri && scope) {
        try {
          fallbackRequest = AuthorizationRequest.fromQuery({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope,
            state,
            nonce,
          });
        } catch {
          fallbackRequest = undefined;
        }
      }

      this.handleFormError(res, error, fallbackRequest, { ...body } as Record<string, unknown>);
    }
  }

  @Post('oauth/token')
  async token(@Body() body: TokenRequestDto): Promise<Record<string, unknown>> {
    try {
      const grantType = body.grant_type;

      if (grantType === 'authorization_code') {
        const tokens = await this.exchangeAuthorizationCode.execute({
          code: body.code ?? '',
          clientId: body.client_id,
          clientSecret: body.client_secret,
          redirectUri: body.redirect_uri ?? '',
        });

        return this.mapTokenResponse(tokens);
      }

      if (grantType === 'refresh_token') {
        const tokens = await this.refreshToken.execute({
          refreshToken: body.refresh_token ?? '',
          clientId: body.client_id,
          clientSecret: body.client_secret,
        });

        return this.mapTokenResponse(tokens);
      }

      throw new ApplicationError('Unsupported grant_type', 400);
    } catch (error) {
      this.handleApiError(error);
    }
  }

  @Get('oauth/userinfo')
  async userInfo(@Headers('authorization') authorization?: string) {
    try {
      if (!authorization) {
        throw new ApplicationError('Missing Authorization header', 401);
      }

      const token = this.extractBearerToken(authorization);
      return await this.getUserInfo.execute(token);
    } catch (error) {
      this.handleApiError(error);
    }
  }

  private mapTokenResponse(tokens: AuthTokensDto): Record<string, unknown> {
    return {
      access_token: tokens.accessToken,
      id_token: tokens.idToken,
      refresh_token: tokens.refreshToken,
      token_type: tokens.tokenType,
      expires_in: tokens.expiresIn,
    };
  }

  private extractBearerToken(header: string): string {
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new ApplicationError('Invalid Authorization header', 401);
    }

    return token.trim();
  }

  private handleFormError(
    res: Response,
    error: unknown,
    request?: AuthorizationRequest,
    raw?: Record<string, unknown>,
  ): void {
    const errorMessage =
      error instanceof ApplicationError || error instanceof DomainError
        ? error.message
        : 'Unable to process request';
    const statusCode =
      error instanceof ApplicationError ? error.statusCode : 400;

    if (request) {
      res.status(statusCode).type('html').send(
        renderLoginForm({
          clientId: request.clientId,
          redirectUri: request.redirectUri,
          scope: request.scope.toString(),
          state: request.state,
          nonce: request.nonce,
          email: this.readOptionalString(raw?.email),
          error: errorMessage,
        }),
      );
      return;
    }

    res.status(statusCode).json({ error: errorMessage });
  }

  private handleApiError(error: unknown): never {
    if (error instanceof ApplicationError) {
      throw new HttpException({ error: error.message }, error.statusCode);
    }

    if (error instanceof DomainError) {
      throw new HttpException({ error: error.message }, 400);
    }

    throw new HttpException({ error: 'Internal server error' }, 500);
  }

  private readOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
}
