from dataclasses import dataclass

from ..ports.embeddings import ChatClient, EmbeddingClient
from ..ports.event_bus import EventBus
from ..ports.vector_store import RetrievedDocument, VectorStore


@dataclass(frozen=True)
class QueryResult:
    answer: str
    sources: list[RetrievedDocument]


class QueryAgentUseCase:
    def __init__(
        self,
        embeddings: EmbeddingClient,
        chat: ChatClient,
        vector_store: VectorStore,
        event_bus: EventBus,
    ) -> None:
        self.embeddings = embeddings
        self.chat = chat
        self.vector_store = vector_store
        self.event_bus = event_bus

    def execute(
        self,
        question: str,
        top_k: int,
        actor_id: str | None = None,
        actor_role: str | None = None,
    ) -> QueryResult:
        embedding = self.embeddings.embed_texts([question])[0]
        retrieved = self.vector_store.query(embedding, top_k)
        context = "\n".join(
            f"[{index + 1}] {doc.content}" for index, doc in enumerate(retrieved)
        )
        system_prompt = (
            "You are a helpful operations assistant. Answer using only the provided context. "
            "If the answer is not in the context, say you do not have enough data. "
            "If the question is about audit logs, say whether any audit data appears in context. "
            "Suggest running ingestion to refresh the knowledge base when data is missing."
        )
        user_prompt = f"Question: {question}\n\nContext:\n{context}"
        answer = self.chat.generate(system_prompt, user_prompt)
        self.event_bus.publish(
            "AiQueried",
            {
                "actorId": actor_id,
                "actorRole": actor_role,
                "question": question,
                "topK": top_k,
                "sourceCount": len(retrieved),
            },
        )
        return QueryResult(answer=answer, sources=retrieved)
