import { useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useAiChat } from '@/hooks/use-ai'
import { MessageSquare, Sparkles } from 'lucide-react'

const chatSchema = z.object({
  question: z.string().min(3, 'Ask a longer question'),
  topK: z.number().int().min(1).max(10),
})

type ChatFormValues = z.infer<typeof chatSchema>

const topKOptions = [3, 5, 8, 10]

export function AiChatWidget() {
  const [open, setOpen] = useState(false)
  const { messages, isLoading, sendMessage, reset } = useAiChat()
  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
    defaultValues: { question: '', topK: 5 },
  })

  const sortedMessages = useMemo(() => messages, [messages])

  const onSubmit: (values: ChatFormValues) => Promise<void> = async (values) => {
    await sendMessage(values.question, values.topK)
    form.reset({ question: '', topK: values.topK })
  }

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-40 gap-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="h-4 w-4" />
        Ask AI
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Query Console
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Conversation
              </p>
              <Button variant="ghost" size="sm" onClick={reset}>
                Clear
              </Button>
            </div>
            <div className="max-h-[280px] space-y-3 overflow-y-auto rounded-2xl border bg-background p-4 text-sm">
              {sortedMessages.length === 0 ? (
                <p className="text-muted-foreground">Ask a question to get started.</p>
              ) : (
                sortedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === 'user'
                        ? 'rounded-2xl bg-primary/10 p-3 text-foreground'
                        : 'rounded-2xl bg-secondary/60 p-3 text-foreground'
                    }
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
                    {message.sources && message.sources.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.sources.map((source) => (
                          <Badge key={source.doc_id} variant="secondary">
                            {source.source ?? 'source'}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
          <Separator />
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex items-center gap-3">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Top K
              </label>
              <select
                className="h-9 rounded-md border bg-background px-2 text-sm"
                {...form.register('topK', { valueAsNumber: true })}
              >
                {topKOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Ask about users, roles, audit logs..."
                {...form.register('question')}
              />
              {form.formState.errors.question ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.question.message}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Thinking...' : 'Send'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
