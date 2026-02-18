from fastapi import Depends, FastAPI, HTTPException

from .dependencies import (
    AuthContext,
    get_auth_context,
    get_ingest_use_case,
    get_query_use_case,
    get_sources_or_default,
    require_create_permission,
)
from .schemas import (
    IngestRequest,
    IngestResponse,
    QueryRequest,
    QueryResponse,
    QuerySource,
)


def create_app() -> FastAPI:
    app = FastAPI(title="AI Service")

    @app.get("/")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/ingest", response_model=IngestResponse)
    def ingest_embeddings(
        payload: IngestRequest,
        auth: AuthContext = Depends(require_create_permission),
        use_case=Depends(get_ingest_use_case),
    ) -> IngestResponse:
        try:
            result = use_case.execute(
                sources=get_sources_or_default(payload.sources),
                access_token=auth.token,
                max_items=payload.max_items,
            )
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        return IngestResponse(ingested=result.ingested, cursors=result.cursors)

    @app.post("/query", response_model=QueryResponse)
    def query_agent(
        payload: QueryRequest,
        auth: AuthContext = Depends(get_auth_context),
        use_case=Depends(get_query_use_case),
    ) -> QueryResponse:
        try:
            result = use_case.execute(payload.question, payload.top_k)
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        sources = [
            QuerySource(
                doc_id=doc.doc_id,
                source=str(doc.metadata.get("source")) if doc.metadata else None,
                metadata=doc.metadata,
                distance=doc.distance,
            )
            for doc in result.sources
        ]
        return QueryResponse(answer=result.answer, sources=sources)

    return app
