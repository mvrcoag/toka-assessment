import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Role, RoleAbilities } from '@/services/roles.service'
import { rolesService } from '@/services/roles.service'

type RolePayload = { name: string } & RoleAbilities

export function useRoles(enabled = true) {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setRoles([])
      setIsLoading(false)
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await rolesService.list()
      setRoles(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load roles'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createRole = useCallback(async (input: RolePayload) => {
    setIsSaving(true)
    try {
      await rolesService.create(input)
      toast.success('Role created')
      await refresh()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create role'
      toast.error(message)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [refresh])

  const updateRole = useCallback(async (id: string, input: Partial<RolePayload>) => {
    setIsSaving(true)
    try {
      await rolesService.update(id, input)
      toast.success('Role updated')
      await refresh()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update role'
      toast.error(message)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [refresh])

  const removeRole = useCallback(async (id: string) => {
    setIsSaving(true)
    try {
      await rolesService.remove(id)
      toast.success('Role deleted')
      await refresh()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete role'
      toast.error(message)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [refresh])

  return { roles, isLoading, isSaving, error, refresh, createRole, updateRole, removeRole }
}
