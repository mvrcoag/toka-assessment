import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { RoleConfig } from '../../../infrastructure/config/role.config';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(private readonly config: RoleConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = (request.headers['x-service-token'] ?? '') as string;
    if (!token || token !== this.config.internalServiceToken) {
      throw new UnauthorizedException('Invalid service token');
    }

    return true;
  }
}
