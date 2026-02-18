import { request } from '@/services/http'

export interface User {
  id: string
  name: string
  email: string
  role: string
}

export const usersService = {
  list: () => request<User[]>('/users'),
  create: (input: { name: string; email: string; password: string; role: string }) =>
    request<User>('/users', { method: 'POST', body: input }),
  update: (
    id: string,
    input: Partial<{ name: string; email: string; password: string; role: string }>,
  ) => request<User>(`/users/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
}
