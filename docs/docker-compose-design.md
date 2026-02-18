# Diseño de Docker Compose

Objetivo del diseño:
- Levantar todo el ecosistema con un solo comando.
- Reproducir dependencias reales (gateway, mensajería, bases de datos).
- Aislar servicios en una red privada común.

Servicios principales:

| Servicio | Responsabilidad | Puertos | Persistencia |
| --- | --- | --- | --- |
| kong | Gateway de entrada | 8000 | No |
| frontend | UI de referencia | 3000 | No |
| auth | OAuth2/OIDC | 3001 | Postgres + Redis |
| user | Usuarios | 3002 | Postgres |
| role | Roles | 3003 | Postgres |
| audit | Logs de auditoría | 3004 | MongoDB |
| ai | Capacidades IA | 3005 | ChromaDB |
| postgres | DB relacional | 5432 | Volumen |
| mongodb | DB documentos | 27017 | Volumen |
| redis | Cache/estado | 6379 | Volumen |
| rabbitmq | Mensajería | 5672/15672 | No |
| chromadb | Vector DB | 8000 | Volumen |

Decisiones clave:
- Red única `toka` para facilitar descubrimiento por nombre de servicio.
- Healthcheck en Postgres para asegurar arranque ordenado.
- `depends_on` para levantar servicios críticos antes de Auth/User/Role.
- Volúmenes para datos persistentes en bases.
- Variables de entorno centralizadas en `.env`.

Inicialización de datos:
- Postgres y Mongo usan scripts de `init` solo en el primer arranque.
- Para reiniciar datos: `docker compose down -v`.
