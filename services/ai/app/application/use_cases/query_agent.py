from dataclasses import dataclass

from ..ports.embeddings import ChatClient, EmbeddingClient
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
    ) -> None:
        self.embeddings = embeddings
        self.chat = chat
        self.vector_store = vector_store

    def execute(self, question: str, top_k: int) -> QueryResult:
        embedding = self.embeddings.embed_texts([question])[0]
        retrieved = self.vector_store.query(embedding, top_k)
        context = "\n".join(
            f"[{index + 1}] {doc.content}" for index, doc in enumerate(retrieved)
        )
        system_prompt = (
            "You are a helpful operations assistant. Answer using only the provided context. "
            "If the answer is not in the context, say you do not have enough data."
        )
        user_prompt = f"Question: {question}\n\nContext:\n{context}"
        answer = self.chat.generate(system_prompt, user_prompt)
        return QueryResult(answer=answer, sources=retrieved)
