import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useRoles } from '@/hooks/use-roles'
import type { Role } from '@/services/roles.service'

const roleSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  canView: z.boolean(),
  canCreate: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
})

type RoleFormValues = z.infer<typeof roleSchema>
type AbilityKey = Exclude<keyof RoleFormValues, 'name'>

const abilityLabels: { key: AbilityKey; label: string; description: string }[] = [
  { key: 'canView', label: 'View', description: 'Read-only access' },
  { key: 'canCreate', label: 'Create', description: 'Create records' },
  { key: 'canUpdate', label: 'Update', description: 'Modify records' },
  { key: 'canDelete', label: 'Delete', description: 'Remove records' },
]

const defaultValues: RoleFormValues = {
  name: '',
  canView: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
}

export function RolesPage() {
  const { user } = useAuth()
  const abilities = user?.roleAbilities
  const canView = abilities?.canView ?? false
  const canCreate = abilities?.canCreate ?? false
  const canUpdate = abilities?.canUpdate ?? false
  const canDelete = abilities?.canDelete ?? false
  const { roles, isLoading, isSaving, error, createRole, updateRole, removeRole } = useRoles(canView)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteRole, setDeleteRole] = useState<Role | null>(null)

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues,
  })

  const openCreate = () => {
    if (!canCreate) {
      return
    }
    setEditingRole(null)
    form.reset(defaultValues)
    setDialogOpen(true)
  }

  const openEdit = (role: Role) => {
    if (!canUpdate) {
      return
    }
    setEditingRole(role)
    form.reset({
      name: role.name,
      canView: role.abilities.canView,
      canCreate: role.abilities.canCreate,
      canUpdate: role.abilities.canUpdate,
      canDelete: role.abilities.canDelete,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: RoleFormValues) => {
    const payload = {
      name: values.name,
      canView: values.canView,
      canCreate: values.canCreate,
      canUpdate: values.canUpdate,
      canDelete: values.canDelete,
    }
    const success = editingRole
      ? await updateRole(editingRole.id, payload)
      : await createRole(payload)
    if (success) {
      setDialogOpen(false)
    }
  }

  const confirmDelete = async () => {
    if (!canDelete) return
    if (!deleteRole) return
    const success = await removeRole(deleteRole.id)
    if (success) {
      setDeleteRole(null)
    }
  }

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingRole(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Roles</p>
          <h2 className="text-2xl font-semibold">Permission sets</h2>
        </div>
        {canCreate ? <Button onClick={openCreate}>New role</Button> : null}
      </div>

      {canView ? (
        <Card className="border bg-white/80 p-6 shadow-sm">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Abilities</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {role.abilities.canView && <span>View</span>}
                      {role.abilities.canCreate && <span>Create</span>}
                      {role.abilities.canUpdate && <span>Update</span>}
                      {role.abilities.canDelete && <span>Delete</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canUpdate ? (
                        <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                          Edit
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteRole(role)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    No roles yet. Create the first one to continue.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="border bg-white/80 p-6 text-sm text-muted-foreground shadow-sm">
          Your role does not allow viewing roles.
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit role' : 'Create role'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">Role name</Label>
              <Input id="name" placeholder="e.g. Operator" {...form.register('name')} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <Separator />
            <div className="grid gap-3">
              {abilityLabels.map((ability) => (
                <Controller
                  key={ability.key}
                  name={ability.key}
                  control={form.control}
                  render={({ field }) => (
                    <label className="flex items-center justify-between rounded-xl border bg-background px-3 py-2 text-sm">
                      <span>
                        <span className="font-medium">{ability.label}</span>
                        <span className="block text-xs text-muted-foreground">{ability.description}</span>
                      </span>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(value) => field.onChange(Boolean(value))}
                      />
                    </label>
                  )}
                />
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || (editingRole ? !canUpdate : !canCreate)}
              >
                {editingRole ? 'Save changes' : 'Create role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteRole)} onOpenChange={() => setDeleteRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete role</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove {deleteRole?.name}. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRole(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSaving || !canDelete}>
              Delete role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
