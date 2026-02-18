from dataclasses import dataclass
from datetime import datetime, timezone

from ..ports.cursor_store import CursorStore
from ..ports.embeddings import EmbeddingClient
from ..ports.sources import AuditGateway, RoleGateway, UserGateway
from ..ports.vector_store import VectorStore
from ...domain.document import EmbeddingDocument
from ...domain.source import SourceType


@dataclass(frozen=True)
class IngestResult:
    ingested: dict[str, int]
    cursors: dict[str, str | None]


class IngestEmbeddingsUseCase:
    def __init__(
        self,
        users: UserGateway,
        roles: RoleGateway,
        audit: AuditGateway,
        embeddings: EmbeddingClient,
        vector_store: VectorStore,
        cursor_store: CursorStore,
    ) -> None:
        self.users = users
        self.roles = roles
        self.audit = audit
        self.embeddings = embeddings
        self.vector_store = vector_store
        self.cursor_store = cursor_store

    def execute(
        self,
        sources: list[SourceType],
        access_token: str | None,
        max_items: int | None = None,
    ) -> IngestResult:
        ingested: dict[str, int] = {}
        cursors: dict[str, str | None] = {}

        for source in sources:
            if source == SourceType.users:
                ingested[source.value], cursors[source.value] = self._ingest_users(
                    access_token, max_items
                )
            elif source == SourceType.roles:
                ingested[source.value], cursors[source.value] = self._ingest_roles(
                    access_token, max_items
                )
            elif source == SourceType.audit:
                ingested[source.value], cursors[source.value] = self._ingest_audit(
                    access_token, max_items
                )

        return IngestResult(ingested=ingested, cursors=cursors)

    def _ingest_users(
        self, access_token: str | None, max_items: int | None
    ) -> tuple[int, str | None]:
        users = self.users.list_users(access_token)
        if max_items:
            users = users[:max_items]

        role_map = {
            role.role_id: role.name for role in self.roles.list_roles(access_token)
        }

        documents = []
        for user in users:
            role_name = user.role_name or role_map.get(user.role_id)
            role_display = role_name or user.role_id
            documents.append(
                EmbeddingDocument(
                    doc_id=f"users:{user.user_id}",
                    content=(
                        f"User {user.user_id}: name={user.name}, email={user.email}, "
                        f"role_id={user.role_id}, role_name={role_display}"
                    ),
                    metadata={
                        "source": "users",
                        "user_id": user.user_id,
                        "role_id": user.role_id,
                        "role_name": role_name,
                    },
                )
            )

        cursor = self._resolve_cursor(
            SourceType.users,
            [user.updated_at or user.created_at for user in users],
            len(users),
        )

        self._upsert_documents(documents)
        return len(documents), cursor

    def _ingest_roles(
        self, access_token: str | None, max_items: int | None
    ) -> tuple[int, str | None]:
        roles = self.roles.list_roles(access_token)
        if max_items:
            roles = roles[:max_items]

        documents = [
            EmbeddingDocument(
                doc_id=f"roles:{role.role_id}",
                content=(
                    f"Role {role.name} ({role.role_id}): "
                    f"view={role.can_view}, create={role.can_create}, "
                    f"update={role.can_update}, delete={role.can_delete}"
                ),
                metadata={
                    "source": "roles",
                    "role_id": role.role_id,
                    "name": role.name,
                },
            )
            for role in roles
        ]

        cursor = self._resolve_cursor(
            SourceType.roles,
            [role.updated_at or role.created_at for role in roles],
            len(roles),
        )

        self._upsert_documents(documents)
        return len(documents), cursor

    def _ingest_audit(
        self, access_token: str | None, max_items: int | None
    ) -> tuple[int, str | None]:
        last_cursor = self.cursor_store.get_cursor(SourceType.audit)
        logs = self.audit.list_logs(access_token, last_cursor)
        if max_items:
            logs = logs[:max_items]

        documents = [
            EmbeddingDocument(
                doc_id=f"audit:{log.audit_id}",
                content=(
                    f"Audit {log.audit_id}: action={log.action}, resource={log.resource}, "
                    f"actor_id={log.actor_id}, role={log.actor_role}, "
                    f"occurred_at={log.occurred_at}"
                ),
                metadata={
                    "source": "audit",
                    "audit_id": log.audit_id,
                    "action": log.action,
                    "resource": log.resource,
                },
            )
            for log in logs
        ]

        cursor = self._resolve_cursor(
            SourceType.audit,
            [log.occurred_at for log in logs],
            len(logs),
        )

        self._upsert_documents(documents)
        return len(documents), cursor

    def _resolve_cursor(
        self, source: SourceType, timestamps: list[datetime | None], item_count: int
    ) -> str | None:
        latest = max((ts for ts in timestamps if ts), default=None)
        if latest:
            self.cursor_store.set_cursor(source, latest)
            return latest.isoformat()

        if item_count > 0:
            fallback = datetime.now(timezone.utc)
            self.cursor_store.set_cursor(source, fallback)
            return fallback.isoformat()

        current = self.cursor_store.get_cursor(source)
        return current.isoformat() if current else None

    def _upsert_documents(self, documents: list[EmbeddingDocument]) -> None:
        if not documents:
            return
        contents = [doc.content for doc in documents]
        embeddings = self.embeddings.embed_texts(contents)
        self.vector_store.upsert(documents, embeddings)
