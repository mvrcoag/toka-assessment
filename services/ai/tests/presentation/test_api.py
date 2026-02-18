from fastapi.testclient import TestClient

from app.application.ports.auth import AccessTokenClaims, RoleAbilitiesClaims
from app.application.ports.vector_store import RetrievedDocument
from app.application.use_cases.ingest_embeddings import IngestResult
from app.application.use_cases.query_agent import QueryResult
from app.presentation.api import create_app
from app.presentation.dependencies import AuthContext
from app.presentation import dependencies


def build_auth() -> AuthContext:
    claims = AccessTokenClaims(
        sub="user",
        email="user@example.com",
        name="User",
        role="admin",
        role_abilities=RoleAbilitiesClaims(can_create=True),
        scope=None,
        client_id=None,
    )
    return AuthContext(token="Bearer token", claims=claims)


def test_health_endpoint() -> None:
    client = TestClient(create_app())
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ingest_success() -> None:
    class StubIngest:
        def execute(
            self, sources, access_token, max_items=None, actor_id=None, actor_role=None
        ):
            return IngestResult(ingested={"users": 1}, cursors={"users": "cursor"})

    app = create_app()
    app.dependency_overrides[dependencies.get_ingest_use_case] = lambda: StubIngest()
    app.dependency_overrides[dependencies.require_create_permission] = lambda: (
        build_auth()
    )

    client = TestClient(app)
    response = client.post("/ingest", json={"sources": ["users"], "max_items": 1})

    assert response.status_code == 200
    assert response.json() == {"ingested": {"users": 1}, "cursors": {"users": "cursor"}}


def test_ingest_runtime_error_returns_502() -> None:
    class StubIngest:
        def execute(self, *args, **kwargs):
            raise RuntimeError("downstream")

    app = create_app()
    app.dependency_overrides[dependencies.get_ingest_use_case] = lambda: StubIngest()
    app.dependency_overrides[dependencies.require_create_permission] = lambda: (
        build_auth()
    )

    client = TestClient(app)
    response = client.post("/ingest", json={"sources": ["users"]})

    assert response.status_code == 502
    assert response.json()["detail"] == "downstream"


def test_query_success() -> None:
    class StubQuery:
        def execute(self, question, top_k, actor_id=None, actor_role=None):
            docs = [
                RetrievedDocument(
                    doc_id="doc-1",
                    content="User u1",
                    metadata={"source": "users"},
                    distance=0.1,
                )
            ]
            return QueryResult(answer="ok", sources=docs)

    app = create_app()
    app.dependency_overrides[dependencies.get_query_use_case] = lambda: StubQuery()
    app.dependency_overrides[dependencies.get_auth_context] = lambda: build_auth()

    client = TestClient(app)
    response = client.post("/query", json={"question": "Who?", "top_k": 1})

    assert response.status_code == 200
    assert response.json()["answer"] == "ok"
    assert response.json()["sources"][0]["doc_id"] == "doc-1"


def test_query_value_error_returns_400() -> None:
    class StubQuery:
        def execute(self, *args, **kwargs):
            raise ValueError("bad input")

    app = create_app()
    app.dependency_overrides[dependencies.get_query_use_case] = lambda: StubQuery()
    app.dependency_overrides[dependencies.get_auth_context] = lambda: build_auth()

    client = TestClient(app)
    response = client.post("/query", json={"question": "Who?", "top_k": 1})

    assert response.status_code == 400
    assert response.json()["detail"] == "bad input"
