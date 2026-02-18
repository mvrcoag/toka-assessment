import { Injectable } from '@nestjs/common';
import { RoleLookup } from '../../application/ports/role-lookup';
import { UserConfig } from '../config/user.config';

@Injectable()
export class HttpRoleLookup implements RoleLookup {
  constructor(private readonly config: UserConfig) {}

  async exists(roleId: string, accessToken?: string): Promise<boolean> {
    const url = new URL(`${this.config.roleServiceUrl}/exists`);
    url.searchParams.set('id', roleId);
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = accessToken;
    }

    const response = await fetch(url.toString(), { headers });
    if (response.status === 404) {
      return false;
    }
    if (!response.ok) {
      throw new Error(`Role lookup failed with status ${response.status}`);
    }

    const payload = (await response.json().catch(() => null)) as
      | { exists?: boolean }
      | null;
    return Boolean(payload?.exists);
  }
}
