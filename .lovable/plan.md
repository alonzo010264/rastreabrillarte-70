# Plan: Sistema completo de agentes, tickets y especialistas

Esta es una solicitud muy grande. La divido en 5 fases para implementarla en orden y poder verificar cada parte.

## Fase 1 — Agentes con datos reales de pedidos
- La IA y los agentes simulados podrán **consultar pedidos reales** de `pedidos_online` (los que aparecen en `/manage`) usando el **código de pedido + nombre del cliente** como verificación obligatoria.
- Si el código no existe o el nombre no coincide → el agente **no entrega ningún dato** ("por confidencialidad necesito verificar..."). Nunca inventa.
- Si no sabe algo, ofrece los correos oficiales: **brillarte.do@gmail.com** o **hola@brillarte.lat**.
- Edge function nueva `agent-lookup-order` (service role, valida código+nombre antes de devolver datos).

## Fase 2 — IA recoge pedidos nuevos y los crea en /manage
- La IA puede **tomar pedidos** conversando: pregunta producto, cantidad, dirección, teléfono, **correo del cliente** (obligatorio).
- Genera un **código tipo B0XXXX-XXXXX** y lo inserta en `pedidos_online` con:
  - estatus inicial, fecha estimada (+5 días laborables desde hoy),
  - peso/datos técnicos vacíos (se llenan luego).
- Envía correo de confirmación al cliente con el código.
- Envía correo a **anotasy@gmail.com** con todos los datos del pedido nuevo.
- El pedido aparece automáticamente en `/manage`.

## Fase 3 — Sistema de tickets dentro del chat desplegable
- Nuevo **icono de ticket** en el header del chat (al lado del icono actual), estilo similar al de "Mi Saldo" en el perfil.
- Al abrirlo: lista de tickets del usuario con su estado (abierto / en progreso / cerrado).
- El agente (humano simulado) puede **abrir un ticket** desde el chat para: reclamos, reembolsos, cambios, etc.
- Los tickets se guardan en `tickets_ayuda` (ya existe) + `respuestas_tickets` para los mensajes.
- **Realtime**: respuestas del especialista llegan al usuario al instante en su chat de ticket.
- Cuando el especialista cierra el ticket → se marca como "finalizado" y el usuario lo ve en modo solo-lectura.
- Correo automático al cliente cuando el especialista responde o cierra el ticket (con la resolución).

## Fase 4 — Cuentas de especialistas: Luis, Amanda, Maribel
- Crear 3 cuentas en `auth.users` con:
  - Verificación oficial (badge azul, igual que la cuenta oficial)
  - Rol `admin` + `agent` → acceso completo a `/manage`, `/agente`, `/especialistas`, todos los dashboards.
- Te entregaré las **credenciales (correo + contraseña temporal)** después de crearlas.
- En su panel verán:
  - Cola de tickets disponibles + asignados a ellos
  - Pueden tomar uno, responder en tiempo real, **cerrar como finalizado**
  - Pueden **crear tickets para cuentas existentes** (buscando por correo)
  - Reciben **notificación** cuando hay nuevo ticket o mensaje
- Su avatar en el chat del cliente muestra: **inicial del nombre + badge de verificación**.

## Fase 5 — Correos automáticos a CEO (anotasy@gmail.com)
Cada acción crítica dispara correo a **anotasy@gmail.com**:
- Nuevo pedido creado por agente/IA
- Solicitud de reembolso abierta
- Ticket cerrado/finalizado
- Cambio de estado importante en pedido
- Datos sensibles recogidos por el agente (nombre+correo+teléfono del cliente)

## Detalles técnicos

```text
Tablas / cambios:
  - pedidos_online: ya existe, se inserta desde edge function nueva
  - tickets_ayuda + respuestas_tickets: ya existen, se conectan al chat
  - user_roles: insertar admin+agent para Luis/Amanda/Maribel
  - profiles: insertar con verificado=true, avatar inicial

Edge functions nuevas:
  - agent-lookup-order   (consulta pedido validando código+nombre)
  - agent-create-order   (crea pedido + correos)
  - notify-ceo           (wrapper para anotasy@gmail.com vía Resend)

Edge functions modificadas:
  - chatbot-assistant: nuevas reglas de confidencialidad + tools de lookup/crear pedido + escalar a ticket

Frontend:
  - Chatbot.tsx: icono ticket en header, panel de tickets dentro del chat
  - AgentDashboard / Especialistas: vista de cola de tickets, responder, cerrar
  - Fix del error "no se pudieron cargar los tickets"
```

## Orden de ejecución
Implementaré **Fase 1 → 2 → 3 → 4 → 5** en mensajes separados, verificando cada una antes de pasar a la siguiente. Empiezo por **Fase 1 (lookup de pedidos reales con verificación)** apenas apruebes este plan.

## Lo que necesito confirmar
1. ¿Las contraseñas de Luis/Amanda/Maribel las genero yo (te las muestro una vez) o me das las que quieres?
2. ¿Quieres que el correo del CEO (anotasy@gmail.com) reciba **todo** o solo eventos críticos (pedidos nuevos + reembolsos + cierres)?
3. Para la fecha estimada "+5 días laborables", ¿cuento sábados/domingos como no laborables? (asumo que sí salvo que digas otra cosa)
