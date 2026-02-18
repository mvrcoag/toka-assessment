from enum import Enum


class SourceType(str, Enum):
    users = "users"
    roles = "roles"
    audit = "audit"
