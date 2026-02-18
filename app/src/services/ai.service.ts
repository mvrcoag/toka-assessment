import { request } from '@/services/http'

export type AiSource = 'users' | 'roles' | 'audit'

export interface IngestResponse {
  ingested: Record<string, number>
  cursors: Record<string, string | null>
}

export interface QuerySource {
  doc_id: string
  source: string | null
  metadata: Record<string, string | number | boolean | null>
  distance: number | null
}

export interface QueryResponse {
  answer: string
  sources: QuerySource[]
}

export const aiService = {
  health: () => request<Record<string, string>>('/ai/'),
  ingest: (input: { sources?: AiSource[]; max_items?: number | null }) =>
    request<IngestResponse>('/ai/ingest', { method: 'POST', body: input }),
  query: (input: { question: string; top_k?: number }) =>
    request<QueryResponse>('/ai/query', { method: 'POST', body: input }),
}
