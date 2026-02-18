import { useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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
  const [expandedSources, setExpandedSources] = useState<string | null>(null)
  const { messages, isLoading, sendMessage, reset } = useAiChat()
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
    defaultValues: { question: '', topK: 5 },
  })

  const sortedMessages = useMemo(() => messages, [messages])

  const onSubmit: (values: ChatFormValues) => Promise<void> = async (values) => {
    const { topK } = values
    form.reset({ question: '', topK })
    await sendMessage(values.question, topK)
  }

  useEffect(() => {
    if (!open) {
      return
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

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
        <DialogContent className="max-w-3xl p-0">
          <div className="flex h-[75vh] flex-col">
            <DialogHeader className="border-b bg-white/90 p-4 pr-14">
              <DialogTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Query Console
                </span>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Clear
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto bg-muted/20 px-6 py-5">
              {sortedMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ask a question to get started.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {sortedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={
                        message.role === 'user'
                          ? 'flex w-full justify-end'
                          : 'flex w-full justify-start'
                      }
                    >
                      <div
                        className={
                          message.role === 'user'
                            ? 'flex w-fit max-w-[70%] flex-col rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground'
                            : 'flex w-fit max-w-[70%] flex-col rounded-2xl bg-white px-4 py-3 text-sm text-foreground shadow-sm'
                        }
                      >
                        <p className="text-xs uppercase tracking-[0.2em] opacity-70">
                          {message.role === 'user' ? 'You' : 'Assistant'}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                        {message.role === 'assistant' && message.sources?.length ? (
                          <div className="mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedSources(
                                  expandedSources === message.id ? null : message.id,
                                )
                              }
                            >
                              Sources ({message.sources.length})
                            </Button>
                            {expandedSources === message.id ? (
                              <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                                {message.sources.map((source) => (
                                  <div key={source.doc_id} className="rounded-lg border bg-muted/40 p-2">
                                    <p className="font-medium text-foreground">
                                      {source.source ?? 'source'}
                                    </p>
                                    <p className="mt-1 break-all">{source.doc_id}</p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <Separator />
            <form className="space-y-3 bg-white/90 p-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                <Textarea
                  placeholder="Ask about users, roles, audit logs..."
                  rows={3}
                  {...form.register('question')}
                />
                {form.formState.errors.question ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.question.message}
                  </p>
                ) : null}
              </div>
              <DialogFooter className="sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Answers are generated from ingested data.
                </p>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Thinking...' : 'Send'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
