import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuditLogs } from '@/hooks/use-audit-logs'

const auditSchema = z.object({
  action: z.string().optional(),
  resource: z.string().optional(),
  actorId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

type AuditFormValues = z.infer<typeof auditSchema>

const defaultValues: AuditFormValues = {
  action: '',
  resource: '',
  actorId: '',
  from: '',
  to: '',
}

export function AuditPage() {
  const { logs, isLoading, error, updateFilters } = useAuditLogs(defaultValues)
  const form = useForm<AuditFormValues>({
    resolver: zodResolver(auditSchema),
    defaultValues,
  })

  const onSubmit = (values: AuditFormValues) => {
    updateFilters({
      action: values.action || undefined,
      resource: values.resource || undefined,
      actorId: values.actorId || undefined,
      from: values.from || undefined,
      to: values.to || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Audit</p>
          <h2 className="text-2xl font-semibold">Activity ledger</h2>
        </div>
        <Badge variant="secondary">{logs.length} events</Badge>
      </div>

      <Card className="border bg-white/80 p-6 shadow-sm">
        <form className="grid gap-4 md:grid-cols-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Input id="action" placeholder="create, update" {...form.register('action')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource">Resource</Label>
            <Input id="resource" placeholder="users, roles" {...form.register('resource')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actorId">Actor ID</Label>
            <Input id="actorId" placeholder="user-id" {...form.register('actorId')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" {...form.register('from')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" {...form.register('to')} />
          </div>
          <div className="md:col-span-5 flex justify-end">
            <Button type="submit" disabled={isLoading}>
              Apply filters
            </Button>
          </div>
        </form>
      </Card>

      <Card className="border bg-white/80 p-6 shadow-sm">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Separator className="my-4" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Metadata</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.action}</TableCell>
                <TableCell>{log.resource}</TableCell>
                <TableCell>{log.actorId ?? '—'}</TableCell>
                <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground">
                  {log.metadata ? JSON.stringify(log.metadata) : '—'}
                </TableCell>
                <TableCell>{new Date(log.occurredAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!isLoading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No audit records match these filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
