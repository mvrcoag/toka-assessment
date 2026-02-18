import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Role } from '@/services/roles.service'
import { rolesService } from '@/services/roles.service'

export function useRoleOptions(enabled = true) {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setRoles([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const data = await rolesService.list()
      setRoles(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load roles'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { roles, isLoading, refresh }
}
