import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDashboard } from '@/hooks/use-dashboard'
import { Activity, ClipboardList, ShieldCheck, Users } from 'lucide-react'

export function DashboardPage() {
  const { stats, isLoading, error, refresh } = useDashboard()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Summary</p>
          <h2 className="text-2xl font-semibold">Operational snapshot</h2>
        </div>
        <Button variant="outline" onClick={refresh} disabled={isLoading}>
          Refresh data
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Users</p>
              <p className="mt-2 text-3xl font-semibold">{isLoading ? '—' : stats?.users ?? 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <Separator className="my-4" />
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/users">Manage users</Link>
          </Button>
        </Card>
        <Card className="border bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Roles</p>
              <p className="mt-2 text-3xl font-semibold">{isLoading ? '—' : stats?.roles ?? 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <Separator className="my-4" />
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/roles">Review permissions</Link>
          </Button>
        </Card>
        <Card className="border bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Audit</p>
              <p className="mt-2 text-3xl font-semibold">{isLoading ? '—' : stats?.latestAudit.length ?? 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>
          <Separator className="my-4" />
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/audit">View logs</Link>
          </Button>
        </Card>
      </div>
      <Card className="border bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Latest activity</p>
            <h3 className="mt-2 text-xl font-semibold">Recent audit signals</h3>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Live
          </Badge>
        </div>
        <Separator className="my-4" />
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(stats?.latestAudit ?? []).map((log, index) => (
                <TableRow key={`${log.action}-${index}`}>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell>{new Date(log.occurredAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!isLoading && (stats?.latestAudit.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    No audit activity yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
