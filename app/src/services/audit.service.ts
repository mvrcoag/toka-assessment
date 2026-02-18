import { request } from '@/services/http'

export interface AuditLog {
  id: string
  action: string
  resource: string
  actorId?: string
  actorRole?: string
  metadata?: Record<string, unknown>
  occurredAt: string
}

export interface AuditFilters {
  action?: string
  resource?: string
  actorId?: string
  from?: string
  to?: string
}

export const auditService = {
  list: (filters: AuditFilters) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    const qs = params.toString()
    return request<AuditLog[]>(`/logs${qs ? `?${qs}` : ''}`)
  },
  get: (id: string) => request<AuditLog>(`/logs/${id}`),
}
