from datetime import datetime
from typing import Any
from urllib.parse import urlencode

import httpx

from ...application.ports.sources import (
    AuditGateway,
    AuditRecord,
    RoleAbilities,
    RoleGateway,
    RoleInfo,
    RoleRecord,
    UserGateway,
    UserRecord,
)
from ...core.config import Settings


class UserServiceClient(UserGateway):
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def list_users(self, access_token: str | None) -> list[UserRecord]:
        data = self._get_json(self.settings.user_service_url, access_token)
        users: list[UserRecord] = []
        for item in data:
            role_id = _optional_str(item.get("roleId") or item.get("role_id"))
            if not role_id:
                role_id = _optional_str(item.get("role"))
            users.append(
                UserRecord(
                    user_id=str(item.get("id")),
                    name=str(item.get("name")),
                    email=str(item.get("email")),
                    role_id=role_id or "",
                    role_name=_optional_str(item.get("roleName") or item.get("role")),
                    created_at=_parse_datetime(
                        item.get("createdAt") or item.get("created_at")
                    ),
                    updated_at=_parse_datetime(
                        item.get("updatedAt") or item.get("updated_at")
                    ),
                )
            )
        return users

    def _get_json(self, url: str, access_token: str | None) -> list[dict[str, Any]]:
        headers = _auth_headers(access_token)
        with httpx.Client(timeout=self.settings.request_timeout_seconds) as client:
            response = client.get(url, headers=headers)
        if response.status_code >= 400:
            raise RuntimeError(_error_message("users", response))
        return response.json()


class RoleServiceClient(RoleGateway):
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def list_roles(self, access_token: str | None) -> list[RoleRecord]:
        data = self._get_json(self.settings.role_service_url, access_token)
        roles: list[RoleRecord] = []
        for item in data:
            abilities = item.get("abilities") or {}
            roles.append(
                RoleRecord(
                    role_id=str(item.get("id")),
                    name=str(item.get("name")),
                    can_view=bool(abilities.get("canView")),
                    can_create=bool(abilities.get("canCreate")),
                    can_update=bool(abilities.get("canUpdate")),
                    can_delete=bool(abilities.get("canDelete")),
                    created_at=_parse_datetime(
                        item.get("createdAt") or item.get("created_at")
                    ),
                    updated_at=_parse_datetime(
                        item.get("updatedAt") or item.get("updated_at")
                    ),
                )
            )
        return roles

    def get_role(self, role_ref: str, access_token: str | None) -> RoleInfo | None:
        headers = _auth_headers(access_token)
        if _looks_like_uuid(role_ref):
            url = f"{self.settings.role_service_url}/{role_ref}"
            with httpx.Client(timeout=self.settings.request_timeout_seconds) as client:
                response = client.get(url, headers=headers)
            if response.status_code == 404:
                return None
            if response.status_code >= 400:
                raise RuntimeError(_error_message("roles", response))
            return _role_info_from_payload(response.json())

        roles = self.list_roles(access_token)
        for role in roles:
            if role.name.lower() == role_ref.lower():
                return RoleInfo(
                    role_id=role.role_id,
                    name=role.name,
                    abilities=RoleAbilities(
                        can_view=role.can_view,
                        can_create=role.can_create,
                        can_update=role.can_update,
                        can_delete=role.can_delete,
                    ),
                )
        return None

    def _get_json(self, url: str, access_token: str | None) -> list[dict[str, Any]]:
        headers = _auth_headers(access_token)
        with httpx.Client(timeout=self.settings.request_timeout_seconds) as client:
            response = client.get(url, headers=headers)
        if response.status_code >= 400:
            raise RuntimeError(_error_message("roles", response))
        return response.json()


class AuditServiceClient(AuditGateway):
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def list_logs(
        self, access_token: str | None, occurred_after: datetime | None
    ) -> list[AuditRecord]:
        params = {}
        if occurred_after:
            params["from"] = occurred_after.isoformat()
        query = f"?{urlencode(params)}" if params else ""
        url = f"{self.settings.audit_service_url}{query}"
        headers = _auth_headers(access_token)
        with httpx.Client(timeout=self.settings.request_timeout_seconds) as client:
            response = client.get(url, headers=headers)
        if response.status_code >= 400:
            raise RuntimeError(_error_message("audit", response))
        payload = response.json()
        logs: list[AuditRecord] = []
        for item in payload:
            logs.append(
                AuditRecord(
                    audit_id=str(item.get("id")),
                    action=str(item.get("action")),
                    resource=str(item.get("resource")),
                    actor_id=_optional_str(item.get("actorId")),
                    actor_role=_optional_str(item.get("actorRole")),
                    occurred_at=_parse_datetime(item.get("occurredAt")),
                    metadata=item.get("metadata")
                    if isinstance(item.get("metadata"), dict)
                    else None,
                )
            )
        return logs


def _role_info_from_payload(payload: dict[str, Any]) -> RoleInfo:
    abilities = payload.get("abilities") or {}
    return RoleInfo(
        role_id=str(payload.get("id")),
        name=str(payload.get("name")),
        abilities=RoleAbilities(
            can_view=bool(abilities.get("canView")),
            can_create=bool(abilities.get("canCreate")),
            can_update=bool(abilities.get("canUpdate")),
            can_delete=bool(abilities.get("canDelete")),
        ),
    )


def _auth_headers(access_token: str | None) -> dict[str, str]:
    if access_token:
        return {"Authorization": access_token}
    return {}


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        normalized = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return None
    return None


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)


def _looks_like_uuid(value: str) -> bool:
    return len(value) == 36 and value.count("-") == 4


def _error_message(service: str, response: httpx.Response) -> str:
    detail = None
    try:
        payload = response.json()
        detail = payload.get("error") or payload.get("message")
    except ValueError:
        detail = response.text
    return f"{service} service error ({response.status_code}): {detail or 'request failed'}"
