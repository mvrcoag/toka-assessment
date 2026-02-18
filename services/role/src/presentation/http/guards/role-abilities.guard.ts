import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AccessTokenClaims } from '../../../application/ports/access-token-verifier';

const abilityMap: Record<string, keyof NonNullable<AccessTokenClaims['roleAbilities']>> = {
  GET: 'canView',
  POST: 'canCreate',
  PUT: 'canUpdate',
  PATCH: 'canUpdate',
  DELETE: 'canDelete',
};

@Injectable()
export class RoleAbilitiesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method?.toUpperCase?.() ?? '';
    if (method === 'OPTIONS' || method === 'HEAD') {
      return true;
    }

    const abilityKey = abilityMap[method];
    if (!abilityKey) {
      return true;
    }

    const user = (request as any).user as AccessTokenClaims | undefined;
    if (!user) {
      throw new UnauthorizedException('Missing access token');
    }

    const abilities = user.roleAbilities;
    if (!abilities || abilities[abilityKey] !== true) {
      throw new ForbiddenException('Insufficient role permissions');
    }

    return true;
  }
}
