import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { AuditFilters, AuditLog } from '@/services/audit.service'
import { auditService } from '@/services/audit.service'

export function useAuditLogs(initialFilters: AuditFilters, enabled = true) {
  const [filters, setFilters] = useState<AuditFilters>(initialFilters)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (override?: AuditFilters) => {
    if (!enabled) {
      setLogs([])
      setIsLoading(false)
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await auditService.list(override ?? filters)
      setLogs(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load audit logs'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters, enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  const updateFilters = (next: AuditFilters) => {
    setFilters(next)
    refresh(next)
  }

  return { logs, filters, isLoading, error, refresh, updateFilters }
}
