import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { User } from '@/services/users.service'
import { usersService } from '@/services/users.service'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await usersService.list()
      setUsers(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load users'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createUser = useCallback(async (input: { name: string; email: string; password: string; role: string }) => {
    setIsSaving(true)
    try {
      await usersService.create(input)
      toast.success('User created')
      await refresh()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create user'
      toast.error(message)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [refresh])

  const updateUser = useCallback(async (id: string, input: Partial<{ name: string; email: string; password: string; role: string }>) => {
    setIsSaving(true)
    try {
      await usersService.update(id, input)
      toast.success('User updated')
      await refresh()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update user'
      toast.error(message)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [refresh])

  const removeUser = useCallback(async (id: string) => {
    setIsSaving(true)
    try {
      await usersService.remove(id)
      toast.success('User deleted')
      await refresh()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete user'
      toast.error(message)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [refresh])

  return { users, isLoading, isSaving, error, refresh, createUser, updateUser, removeUser }
}
