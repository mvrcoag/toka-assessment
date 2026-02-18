# Desempeño bajo presión – Resolución de problema

Escenario simulado:
- Usuarios no pueden guardar registros.
- Algunos microservicios devuelven errores 500.
- Se reporta alta latencia en respuestas de agentes IA.

Hipótesis iniciales:
- Base de datos saturada o sin conexiones disponibles.
- Errores de red o DNS entre servicios.
- Fallos en cascada por timeouts en llamadas síncronas.
- RabbitMQ con backlog, colas bloqueadas o fallas de conexión.
- AI: rate limiting, alto tiempo de respuesta del proveedor, o prompts demasiado grandes.

Plan de diagnóstico sistemático:
1) Confirmar alcance: servicios afectados y timeframe.
2) Revisar salud de infraestructura (DB, RabbitMQ, Redis, Chroma).
3) Inspeccionar logs estructurados por servicio con correlation ID.
4) Medir latencias por endpoint y dependencia.
5) Revisar errores de aplicación (500) y stack traces.
6) Validar timeouts, retries y circuit breakers.

Uso de logs centralizados:
- Filtrar por `trace_id` o `request_id` para seguir una transacción completa.
- Buscar spikes de `error_rate`, `timeout` y `queue_depth`.
- Correlacionar picos de latencia con deploys o cambios recientes.

Consideraciones específicas de agentes IA:
- Verificar rate limits del proveedor y aplicar backoff.
- Revisar tamaño de prompt/contexto (tokens altos).
- Ajustar modelo por criticidad para reducir latencia.
- Cachear respuestas y limitar concurrencia.

Comunicación a stakeholders:
- Mensaje inicial: impacto, servicios afectados y ETA de diagnóstico.
- Actualizaciones periódicas con hipótesis confirmadas o descartadas.
- Cierre: causa raíz, mitigación aplicada y plan preventivo.

Criterios de evaluación:
- Priorización lógica de hipótesis.
- Uso correcto de logs y herramientas de debugging.
- Consideración de fallos en cascada y comunicación entre servicios.
- Diagnóstico de latencia y costos en IA.
