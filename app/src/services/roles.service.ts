import { request } from '@/services/http'

export interface RoleAbilities {
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export interface Role {
  id: string
  name: string
  abilities: RoleAbilities
}

export const rolesService = {
  list: () => request<Role[]>('/roles'),
  create: (input: { name: string } & RoleAbilities) =>
    request<Role>('/roles', { method: 'POST', body: input }),
  update: (id: string, input: Partial<{ name: string } & RoleAbilities>) =>
    request<Role>(`/roles/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request<void>(`/roles/${id}`, { method: 'DELETE' }),
}
