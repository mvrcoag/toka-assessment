import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { aiService, type AiSource, type IngestResponse, type QueryResponse } from '@/services/ai.service'

export function useAiStatus() {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<Record<string, string> | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await aiService.health()
      setResponse(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach AI service'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { isLoading, response, refresh }
}

export function useAiIngest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<IngestResponse | null>(null)

  const ingest = useCallback(
    async (input: { sources?: AiSource[]; maxItems?: number | null }) => {
      setIsLoading(true)
      try {
        const response = await aiService.ingest({
          sources: input.sources?.length ? input.sources : undefined,
          max_items: input.maxItems ?? undefined,
        })
        setResult(response)
        toast.success('Ingestion complete')
        return response
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to ingest documents'
        toast.error(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  return { isLoading, result, ingest }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: QueryResponse['sources']
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (question: string, topK?: number) => {
    const messageId = crypto.randomUUID()
    setMessages((prev) => [...prev, { id: messageId, role: 'user', content: question }])
    setIsLoading(true)
    try {
      const response = await aiService.query({ question, top_k: topK })
      setMessages((prev) => [
        ...prev,
        {
          id: `${messageId}-reply`,
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
        },
      ])
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to run query'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => setMessages([]), [])

  return useMemo(
    () => ({ messages, isLoading, sendMessage, reset }),
    [messages, isLoading, sendMessage, reset],
  )
}
