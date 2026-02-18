import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAiIngest, useAiStatus } from '@/hooks/use-ai'
import { useAuth } from '@/hooks/use-auth'
import { Sparkles } from 'lucide-react'

const sourceOptions = [
  { value: 'users', label: 'Users' },
  { value: 'roles', label: 'Roles' },
  { value: 'audit', label: 'Audit logs' },
] as const

const ingestSchema = z.object({
  sources: z.array(z.enum(['users', 'roles', 'audit'])).optional(),
  maxItems: z.number().int().min(1).max(1000).optional(),
})

type IngestFormValues = z.infer<typeof ingestSchema>

export function AiPage() {
  const { user } = useAuth()
  const { isLoading: isStatusLoading, response, refresh } = useAiStatus()
  const { isLoading: isIngesting, result, ingest } = useAiIngest()
  const canCreate = user?.roleAbilities?.canCreate ?? false

  const form = useForm<IngestFormValues>({
    resolver: zodResolver(ingestSchema),
    defaultValues: { sources: [], maxItems: undefined },
  })

  const onSubmit = async (values: IngestFormValues) => {
    await ingest({ sources: values.sources, maxItems: values.maxItems ?? null })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">AI</p>
        <h2 className="text-2xl font-semibold">Knowledge ingestion</h2>
      </div>

      <Card className="border bg-white/80 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Service status</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Verify the AI service is reachable before running ingestion.
            </p>
          </div>
          <Button onClick={refresh} disabled={isStatusLoading}>
            {isStatusLoading ? 'Checking...' : 'Run check'}
          </Button>
        </div>
        <Separator className="my-4" />
        <div className="rounded-xl border bg-background p-4 text-sm">
          {response ? (
            <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(response, null, 2)}</pre>
          ) : (
            <p className="text-muted-foreground">No response yet. Trigger a check to see output.</p>
          )}
        </div>
      </Card>

      <Card className="border bg-white/80 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ingest</p>
            <h3 className="mt-2 text-xl font-semibold">Dispatch documents</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Select the services to ingest into the vector store and optionally limit records.
            </p>
          </div>
          {result ? <Badge variant="secondary">{Object.keys(result.ingested).length} sources</Badge> : null}
        </div>
        <Separator className="my-4" />
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-3 md:grid-cols-3">
            {sourceOptions.map((source) => (
              <Controller
                key={source.value}
                name="sources"
                control={form.control}
                render={({ field }) => {
                  const values = field.value ?? []
                  const checked = values.includes(source.value)
                  return (
                    <label className="flex items-center justify-between rounded-xl border bg-background px-3 py-2 text-sm">
                      <span className="font-medium">{source.label}</span>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const next = Boolean(value)
                            ? [...values, source.value]
                            : values.filter((item) => item !== source.value)
                          field.onChange(next)
                        }}
                      />
                    </label>
                  )
                }}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxItems">Max items per source</Label>
            <Input
              id="maxItems"
              type="number"
              min={1}
              max={1000}
              placeholder="Leave empty for full ingest"
              {...form.register('maxItems', {
                setValueAs: (value) => (value === '' ? undefined : Number(value)),
              })}
            />
            {form.formState.errors.maxItems ? (
              <p className="text-xs text-destructive">{form.formState.errors.maxItems.message}</p>
            ) : null}
          </div>
          {!canCreate ? (
            <p className="text-xs text-destructive">
              Your role does not allow ingest operations.
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isIngesting || !canCreate}>
              {isIngesting ? 'Ingesting...' : 'Run ingest'}
            </Button>
          </div>
        </form>
        {result ? (
          <div className="mt-6 rounded-xl border bg-background p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Last run</p>
            <pre className="mt-2 whitespace-pre-wrap text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
