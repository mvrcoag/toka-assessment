export interface RoleLookup {
  exists(roleId: string, accessToken?: string): Promise<boolean>;
}
