import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Role } from '@/services/roles.service'
import { rolesService } from '@/services/roles.service'

export function useRoleOptions() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { roles, isLoading, refresh }
}
