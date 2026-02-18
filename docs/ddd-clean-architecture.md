# DDD y Clean Architecture en el código

Objetivo:
- Mantener el dominio independiente de frameworks y detalles de infraestructura.
- Aislar decisiones técnicas y permitir pruebas unitarias sin efectos colaterales.

Capas y responsabilidades:
- Domain: entidades, value objects, reglas de negocio y eventos.
- Application: casos de uso y puertos (interfaces) para dependencias externas.
- Infrastructure: adaptadores concretos (ORM, mensajería, JWT, Redis).
- Presentation: controladores, DTOs, validación y transporte HTTP.

Regla de dependencias:
- Las dependencias siempre apuntan hacia el dominio.
- Infrastructure y Presentation dependen de Application y Domain.
- Domain no depende de ninguna capa externa.

Aplicación práctica:
- Repositorios se definen como interfaces en Application y se implementan en Infrastructure.
- Eventos de dominio se publican en Application y se adaptan a RabbitMQ en Infrastructure.
- DTOs de entrada/salida viven en Presentation y se mapean a modelos de dominio.

Ejemplo de flujo (simplificado):
1) Controller recibe una solicitud y valida DTO.
2) Caso de uso ejecuta reglas de negocio y crea entidad.
3) Repositorio persiste la entidad (adaptador TypeORM).
4) Se publica un evento de dominio (adaptador RabbitMQ).
