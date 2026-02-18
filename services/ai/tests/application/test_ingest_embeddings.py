from datetime import datetime, timezone

from app.application.ports.sources import AuditRecord, RoleRecord, UserRecord
from app.application.use_cases.ingest_embeddings import IngestEmbeddingsUseCase
from app.domain.source import SourceType


class StubUsers:
    def __init__(self, users) -> None:
        self.users = users
        self.last_access_token = None

    def list_users(self, access_token):
        self.last_access_token = access_token
        return self.users


class StubRoles:
    def __init__(self, roles) -> None:
        self.roles = roles
        self.last_access_token = None

    def list_roles(self, access_token):
        self.last_access_token = access_token
        return self.roles


class StubAudit:
    def __init__(self, logs) -> None:
        self.logs = logs
        self.last_access_token = None
        self.last_occurred_after = None

    def list_logs(self, access_token, occurred_after):
        self.last_access_token = access_token
        self.last_occurred_after = occurred_after
        return self.logs


class StubEmbeddings:
    def __init__(self) -> None:
        self.calls = []

    def embed_texts(self, inputs):
        self.calls.append(list(inputs))
        return [[float(index)] for index, _ in enumerate(inputs)]


class StubVectorStore:
    def __init__(self) -> None:
        self.upserts = []

    def upsert(self, documents, embeddings) -> None:
        self.upserts.append((list(documents), list(embeddings)))


class StubCursorStore:
    def __init__(self) -> None:
        self.cursors = {}
        self.set_calls = []

    def get_cursor(self, source):
        return self.cursors.get(source)

    def set_cursor(self, source, cursor) -> None:
        self.cursors[source] = cursor
        self.set_calls.append((source, cursor))


class StubEventBus:
    def __init__(self) -> None:
        self.events = []

    def publish(self, name, payload) -> None:
        self.events.append((name, payload))


def build_use_case(users, roles, logs):
    return IngestEmbeddingsUseCase(
        users=StubUsers(users),
        roles=StubRoles(roles),
        audit=StubAudit(logs),
        embeddings=StubEmbeddings(),
        vector_store=StubVectorStore(),
        cursor_store=StubCursorStore(),
        event_bus=StubEventBus(),
    )


def test_execute_ingests_sources_and_publishes_event() -> None:
    created = datetime(2024, 1, 1, tzinfo=timezone.utc)
    updated = datetime(2024, 1, 2, tzinfo=timezone.utc)
    role_updated = datetime(2024, 1, 3, tzinfo=timezone.utc)
    audit_time = datetime(2024, 1, 4, tzinfo=timezone.utc)

    users = [
        UserRecord(
            user_id="u1",
            name="Ada",
            email="ada@example.com",
            role_id="role-1",
            role_name=None,
            created_at=created,
            updated_at=None,
        ),
        UserRecord(
            user_id="u2",
            name="Bea",
            email="bea@example.com",
            role_id="role-1",
            role_name="",
            created_at=created,
            updated_at=updated,
        ),
    ]
    roles = [
        RoleRecord(
            role_id="role-1",
            name="Admin",
            can_view=True,
            can_create=True,
            can_update=False,
            can_delete=False,
            created_at=created,
            updated_at=role_updated,
        )
    ]
    logs = [
        AuditRecord(
            audit_id="a1",
            action="create",
            resource="users",
            actor_id="u1",
            actor_role="role-1",
            occurred_at=audit_time,
            metadata={"ip": "127.0.0.1"},
        )
    ]

    use_case = build_use_case(users, roles, logs)
    cursor_store = use_case.cursor_store
    cursor_store.cursors[SourceType.audit] = created

    result = use_case.execute(
        [SourceType.users, SourceType.roles, SourceType.audit],
        access_token="token",
        actor_id="actor",
        actor_role="ops",
    )

    assert result.ingested == {"users": 2, "roles": 1, "audit": 1}
    assert result.cursors["users"] == updated.isoformat()
    assert result.cursors["roles"] == role_updated.isoformat()
    assert result.cursors["audit"] == audit_time.isoformat()

    assert use_case.audit.last_occurred_after == created
    assert use_case.event_bus.events[0][0] == "AiIngested"
    assert use_case.event_bus.events[0][1]["actorId"] == "actor"
    assert use_case.event_bus.events[0][1]["sources"] == ["users", "roles", "audit"]

    upserts = use_case.vector_store.upserts
    assert len(upserts) == 3
    assert upserts[0][0][0].metadata["source"] == "users"
    assert upserts[1][0][0].metadata["source"] == "roles"
    assert upserts[2][0][0].metadata["source"] == "audit"
    assert upserts[0][0][0].metadata["role_name"] == "Admin"


def test_execute_respects_max_items() -> None:
    created = datetime(2024, 1, 1, tzinfo=timezone.utc)
    users = [
        UserRecord(
            user_id="u1",
            name="Ada",
            email="ada@example.com",
            role_id="role-1",
            role_name=None,
            created_at=created,
            updated_at=None,
        ),
        UserRecord(
            user_id="u2",
            name="Bea",
            email="bea@example.com",
            role_id="role-1",
            role_name=None,
            created_at=created,
            updated_at=None,
        ),
    ]
    roles = [
        RoleRecord(
            role_id="role-1",
            name="Admin",
            can_view=True,
            can_create=True,
            can_update=False,
            can_delete=False,
            created_at=created,
            updated_at=None,
        )
    ]
    logs = []

    use_case = build_use_case(users, roles, logs)
    result = use_case.execute(
        [SourceType.users, SourceType.roles],
        access_token=None,
        max_items=1,
    )

    assert result.ingested == {"users": 1, "roles": 1}
    assert len(use_case.vector_store.upserts[0][0]) == 1


def test_resolve_cursor_uses_latest_timestamp() -> None:
    use_case = build_use_case([], [], [])
    cursor_store = use_case.cursor_store
    first = datetime(2024, 1, 1, tzinfo=timezone.utc)
    second = datetime(2024, 1, 2, tzinfo=timezone.utc)

    cursor = use_case._resolve_cursor(SourceType.users, [first, second], 2)

    assert cursor == second.isoformat()
    assert cursor_store.cursors[SourceType.users] == second


def test_resolve_cursor_fallback_when_missing_timestamps(monkeypatch) -> None:
    use_case = build_use_case([], [], [])
    fixed = datetime(2024, 2, 1, tzinfo=timezone.utc)

    class FixedDatetime:
        @staticmethod
        def now(tz):
            return fixed

    monkeypatch.setattr(
        "app.application.use_cases.ingest_embeddings.datetime", FixedDatetime
    )

    cursor = use_case._resolve_cursor(SourceType.roles, [None], 1)

    assert cursor == fixed.isoformat()
    assert use_case.cursor_store.cursors[SourceType.roles] == fixed


def test_resolve_cursor_returns_existing_when_no_items() -> None:
    use_case = build_use_case([], [], [])
    existing = datetime(2024, 3, 1, tzinfo=timezone.utc)
    use_case.cursor_store.cursors[SourceType.audit] = existing

    cursor = use_case._resolve_cursor(SourceType.audit, [], 0)

    assert cursor == existing.isoformat()


def test_upsert_documents_noop_when_empty() -> None:
    use_case = build_use_case([], [], [])

    use_case._upsert_documents([])

    assert use_case.embeddings.calls == []
    assert use_case.vector_store.upserts == []
