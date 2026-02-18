import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AccessTokenVerifier } from '../../../application/ports/access-token-verifier';
import { ACCESS_TOKEN_VERIFIER } from '../../../application/ports/tokens';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(ACCESS_TOKEN_VERIFIER) private readonly verifier: AccessTokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = (request as any).headers?.authorization as string | undefined;
    if (!authorization) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    try {
      (request as any).user = await this.verifier.verify(token.trim());
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
