import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { auditService } from '@/services/audit.service'
import { rolesService } from '@/services/roles.service'
import { usersService } from '@/services/users.service'

interface DashboardStats {
  users: number
  roles: number
  latestAudit: { action: string; resource: string; occurredAt: string }[]
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [users, roles, audit] = await Promise.all([
        usersService.list(),
        rolesService.list(),
        auditService.list({}),
      ])
      const latestAudit = [...audit]
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        .slice(0, 5)
        .map((log) => ({ action: log.action, resource: log.resource, occurredAt: log.occurredAt }))
      setStats({ users: users.length, roles: roles.length, latestAudit })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load dashboard'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { stats, isLoading, error, refresh }
}
