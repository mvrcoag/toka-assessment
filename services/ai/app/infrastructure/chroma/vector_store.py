from chromadb.api.models.Collection import Collection

from ...application.ports.vector_store import RetrievedDocument, VectorStore
from ...core.config import Settings
from ...domain.document import EmbeddingDocument
from .client import build_chroma_client


class ChromaVectorStore(VectorStore):
    def __init__(self, settings: Settings) -> None:
        self.client = build_chroma_client(settings)
        self.collection: Collection = self.client.get_or_create_collection(
            name=settings.chroma_collection,
            metadata={"hnsw:space": "cosine"},
        )

    def upsert(
        self, documents: list[EmbeddingDocument], embeddings: list[list[float]]
    ) -> None:
        ids = [doc.doc_id for doc in documents]
        metadatas = [doc.metadata for doc in documents]
        docs = [doc.content for doc in documents]
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=docs,
            metadatas=metadatas,
        )

    def query(self, embedding: list[float], top_k: int) -> list[RetrievedDocument]:
        result = self.collection.query(
            query_embeddings=[embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances", "ids"],
        )
        documents = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])[0]
        ids = result.get("ids", [[]])[0]
        items: list[RetrievedDocument] = []
        for index, doc in enumerate(documents):
            items.append(
                RetrievedDocument(
                    doc_id=ids[index],
                    content=doc,
                    metadata=metadatas[index] or {},
                    distance=distances[index] if distances else None,
                )
            )
        return items
