import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { useRoleOptions } from '@/hooks/use-role-options'
import { useUsers } from '@/hooks/use-users'
import type { User } from '@/services/users.service'

const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  roleId: z.string().min(1, 'Role is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
})

type UserFormValues = z.infer<typeof userSchema>

const defaultValues: UserFormValues = {
  name: '',
  email: '',
  roleId: '',
  password: '',
}

export function UsersPage() {
  const { user } = useAuth()
  const abilities = user?.roleAbilities
  const canView = abilities?.canView ?? false
  const canCreate = abilities?.canCreate ?? false
  const canUpdate = abilities?.canUpdate ?? false
  const canDelete = abilities?.canDelete ?? false
  const { users, isLoading, isSaving, error, createUser, updateUser, removeUser } = useUsers(canView)
  const { roles } = useRoleOptions(canView)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues,
  })

  const openCreate = () => {
    if (!canCreate) {
      return
    }
    setEditingUser(null)
    form.reset(defaultValues)
    setDialogOpen(true)
  }

  const openEdit = (user: User) => {
    if (!canUpdate) {
      return
    }
    setEditingUser(user)
    form.reset({ name: user.name, email: user.email, roleId: user.roleId, password: '' })
    setDialogOpen(true)
  }

  const onSubmit = async (values: UserFormValues) => {
    if (!editingUser && !values.password) {
      form.setError('password', { message: 'Password is required' })
      return
    }

    const payload = {
      name: values.name,
      email: values.email,
      roleId: values.roleId,
      ...(values.password ? { password: values.password } : {}),
    }

    const success = editingUser
      ? await updateUser(editingUser.id, payload)
      : await createUser({ ...payload, password: values.password || '' })
    if (success) {
      setDialogOpen(false)
    }
  }

  const confirmDelete = async () => {
    if (!canDelete) return
    if (!deleteUser) return
    const success = await removeUser(deleteUser.id)
    if (success) {
      setDeleteUser(null)
    }
  }

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingUser(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Users</p>
          <h2 className="text-2xl font-semibold">Team directory</h2>
        </div>
        {canCreate ? <Button onClick={openCreate}>New user</Button> : null}
      </div>

      {canView ? (
        <Card className="border bg-white/80 p-6 shadow-sm">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {roles.find((role) => role.id === user.roleId)?.name ?? user.roleId}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canUpdate ? (
                        <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                          Edit
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteUser(user)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No users yet. Invite one to get started.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="border bg-white/80 p-6 text-sm text-muted-foreground shadow-sm">
          Your role does not allow viewing users.
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit user' : 'Create user'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Jane Doe" {...form.register('name')} />
                {form.formState.errors.name ? (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="jane@toka.io" {...form.register('email')} />
                {form.formState.errors.email ? (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleId">Role</Label>
              <Controller
                name="roleId"
                control={form.control}
                render={({ field }) => (
                  <select
                    id="roleId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...field}
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {form.formState.errors.roleId ? (
                <p className="text-xs text-destructive">{form.formState.errors.roleId.message}</p>
              ) : null}
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={editingUser ? 'Leave blank to keep' : 'Create a password'}
                {...form.register('password')}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || (editingUser ? !canUpdate : !canCreate)}
              >
                {editingUser ? 'Save changes' : 'Create user'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteUser)} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove {deleteUser?.name}. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSaving || !canDelete}>
              Delete user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
