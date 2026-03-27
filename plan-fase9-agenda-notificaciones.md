# Plan Fase 9: Agenda & Citas + Notificaciones + Exportacion Reportes

> **Proyecto:** AutoTaller Pro
> **Fecha:** 2026-03-26
> **Prerequisitos completados:** Fases 1-8 (Dashboard & Reportes funcional)
> **Objetivo:** Completar los pendientes de la fase original 8 del spec: Agenda/Citas, Notificaciones internas, y Exportacion PDF/Excel en reportes.

---

## Resumen de lo que YA existe

| Elemento | Estado | Ubicacion |
|----------|--------|-----------|
| Enum `ESTADO_CITA` (6 estados) | Definido | `packages/shared/src/types/enums.ts` |
| Enum `TIPO_NOTIFICACION` (3 tipos) | Definido | `packages/shared/src/types/enums.ts` |
| Modulo `AGENDA_CITAS` en RBAC | Definido | `packages/shared/src/constants/roles.ts` |
| Permisos por rol para Agenda | Definidos | Admin/Gerente/Supervisor/Recepcionista: COMPLETO, Mecanico: LECTURA |
| Item sidebar "Agenda & Citas" | Marcado "Pronto" | `apps/web/src/components/layout/Sidebar.tsx` |
| Icono campana en TopBar | Solo visual (badge "3" hardcodeado) | `apps/web/src/components/layout/TopBar.tsx` |
| Carpeta `apps/api/src/modules/agenda/` | Vacia | Backend |
| Carpeta `apps/api/src/modules/notificaciones/` | Vacia | Backend |
| Catalogo `CatBahia` (5 bahias) | Seed completo | Prisma schema + seed |
| Dashboard + Reportes ingresos | Funcional | apps/web |
| Config `notificacion.recordatorioDias: 7` | Seeded | ConfiguracionSistema |

---

## ETAPA 1: Modelo de datos (Prisma)

### 1.1 Modelo `Cita`

```prisma
model Cita {
  id               String    @id @default(uuid()) @db.Uuid
  numero           String    @unique @db.VarChar(20)  // CIT-2026-0001
  cliente_id       String    @db.Uuid
  vehiculo_id      String    @db.Uuid
  servicio_id      String?   @db.Uuid
  bahia_id         String?   @db.Uuid
  mecanico_id      String?   @db.Uuid
  sucursal_id      String    @db.Uuid
  fecha_programada DateTime  @db.Timestamptz()
  duracion_minutos Int       @default(60)
  estado           String    @default("PROGRAMADA") @db.VarChar(20)
  notas            String?   @db.Text
  creado_por       String    @db.Uuid
  creado_en        DateTime  @default(now()) @db.Timestamptz()
  actualizado_en   DateTime  @updatedAt @db.Timestamptz()

  cliente   Cliente   @relation(fields: [cliente_id], references: [id])
  vehiculo  Vehiculo  @relation(fields: [vehiculo_id], references: [id])
  servicio  Servicio? @relation(fields: [servicio_id], references: [id])
  bahia     CatBahia? @relation(fields: [bahia_id], references: [id])
  mecanico  Usuario?  @relation("cita_mecanico", fields: [mecanico_id], references: [id])
  sucursal  Sucursal  @relation(fields: [sucursal_id], references: [id])
  creadoPor Usuario   @relation("cita_creador", fields: [creado_por], references: [id])

  @@map("citas")
}
```

**Estados (ya en enum):** PROGRAMADA -> CONFIRMADA -> EN_PROCESO -> COMPLETADA | CANCELADA | NO_ASISTIO

**Transiciones permitidas:**
```
PROGRAMADA  -> [CONFIRMADA, CANCELADA]
CONFIRMADA  -> [EN_PROCESO, CANCELADA, NO_ASISTIO]
EN_PROCESO  -> [COMPLETADA, CANCELADA]
COMPLETADA  -> []
CANCELADA   -> []
NO_ASISTIO  -> []
```

### 1.2 Modelo `Notificacion`

```prisma
model Notificacion {
  id         String   @id @default(uuid()) @db.Uuid
  usuario_id String   @db.Uuid
  tipo       String   @default("SISTEMA") @db.VarChar(20)
  titulo     String   @db.VarChar(255)
  mensaje    String   @db.Text
  leida      Boolean  @default(false)
  enlace     String?  @db.VarChar(255)  // navegacion interna: "detalle-ot:uuid"
  creado_en  DateTime @default(now()) @db.Timestamptz()

  usuario Usuario @relation(fields: [usuario_id], references: [id])

  @@index([usuario_id, leida])
  @@map("notificaciones")
}
```

### 1.3 Migracion y relaciones

- Agregar relaciones inversas en Cliente, Vehiculo, Servicio, CatBahia, Usuario, Sucursal
- Ejecutar `npx prisma migrate dev --name add_citas_notificaciones`
- Agregar formato cita al seed: `formato.cita: CIT-{AAAA}-{NNNN}`

---

## ETAPA 2: Backend - Modulo Agenda/Citas

### 2.1 `apps/api/src/modules/agenda/agenda.service.ts`

| Funcion | Descripcion |
|---------|-------------|
| `listarCitas(filtros)` | Filtrar por fecha (rango), estado, mecanico, bahia, sucursal. Incluir cliente+vehiculo+servicio. Paginado. |
| `obtenerCita(id)` | Detalle completo con relaciones |
| `crearCita(data)` | Validar disponibilidad bahia/mecanico en horario. Generar numero CIT-AAAA-NNNN. |
| `actualizarCita(id, data)` | Editar datos (solo si PROGRAMADA o CONFIRMADA) |
| `cambiarEstadoCita(id, estado)` | Validar transicion permitida, registrar cambio |
| `citasDelDia(fecha, sucursalId)` | Para dashboard: citas de hoy con hora y cliente |
| `verificarDisponibilidad(fecha, duracion, bahiaId?, mecanicoId?)` | Retorna slots disponibles o conflictos |
| `generarNumeroCita()` | Auto-incremento: CIT-2026-0001 |

### 2.2 `apps/api/src/modules/agenda/agenda.routes.ts`

```
GET    /api/agenda              -> listarCitas (con query params filtros)
GET    /api/agenda/hoy          -> citasDelDia
GET    /api/agenda/disponibilidad -> verificarDisponibilidad
GET    /api/agenda/:id          -> obtenerCita
POST   /api/agenda              -> crearCita
PUT    /api/agenda/:id          -> actualizarCita
PATCH  /api/agenda/:id/estado   -> cambiarEstadoCita
```

### 2.3 Validaciones Zod (schema)

```typescript
const crearCitaSchema = z.object({
  cliente_id: z.string().uuid(),
  vehiculo_id: z.string().uuid(),
  servicio_id: z.string().uuid().optional(),
  bahia_id: z.string().uuid().optional(),
  mecanico_id: z.string().uuid().optional(),
  fecha_programada: z.string().datetime(),
  duracion_minutos: z.number().int().min(15).max(480).default(60),
  notas: z.string().max(500).optional(),
})
```

### 2.4 Registrar en server.ts

```typescript
import { agendaRoutes } from './modules/agenda/agenda.routes.js'
server.register(agendaRoutes, { prefix: '/api/agenda' })
```

---

## ETAPA 3: Backend - Modulo Notificaciones

### 3.1 `apps/api/src/modules/notificaciones/notificaciones.service.ts`

| Funcion | Descripcion |
|---------|-------------|
| `listarNotificaciones(usuarioId, soloNoLeidas?)` | Ultimas 50 del usuario, ordenadas por fecha desc |
| `contarNoLeidas(usuarioId)` | Count para badge campana |
| `marcarLeida(id, usuarioId)` | Marcar una como leida |
| `marcarTodasLeidas(usuarioId)` | Marcar todas como leidas |
| `crearNotificacion(data)` | Crear y (futuro) enviar segun tipo |
| `crearNotificacionMasiva(usuarioIds[], data)` | Para alertas de sistema a multiples usuarios |

### 3.2 `apps/api/src/modules/notificaciones/notificaciones.routes.ts`

```
GET    /api/notificaciones          -> listarNotificaciones
GET    /api/notificaciones/count    -> contarNoLeidas
PATCH  /api/notificaciones/:id/leer -> marcarLeida
PATCH  /api/notificaciones/leer-todas -> marcarTodasLeidas
```

### 3.3 Notificaciones automaticas (disparadores)

Crear `apps/api/src/modules/notificaciones/notificaciones.triggers.ts`:

| Evento | Notificacion generada | Destinatarios |
|--------|----------------------|---------------|
| Cita creada | "Nueva cita programada para {fecha}" | Mecanico asignado (si hay) |
| Cita confirmada | "Cita confirmada: {cliente} - {vehiculo}" | Recepcionista + Mecanico |
| OT cambio estado | "OT {numero} paso a {estado}" | Creador de la OT |
| Stock bajo minimo | "Alerta: {repuesto} tiene stock critico ({cantidad})" | Usuarios con rol ALMACEN |
| Factura pagada | "Factura {numero} pagada completamente" | Usuarios con rol CONTABILIDAD |

> **Nota:** Los disparadores se integran llamando `crearNotificacion()` desde los services existentes (ot.service, facturacion.service, inventario.service). No se necesita cron para esta fase — los recordatorios automaticos (cron) se dejan para Fase 10 o posterior.

---

## ETAPA 4: Shared - Constantes y tipos

### 4.1 `packages/shared/src/constants/estados.ts` - Agregar

```typescript
export const TRANSICIONES_CITA = {
  PROGRAMADA:  ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA:  ['EN_PROCESO', 'CANCELADA', 'NO_ASISTIO'],
  EN_PROCESO:  ['COMPLETADA', 'CANCELADA'],
  COMPLETADA:  [],
  CANCELADA:   [],
  NO_ASISTIO:  [],
}

export const COLORES_ESTADO_CITA = {
  PROGRAMADA:  { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500' },
  CONFIRMADA:  { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  EN_PROCESO:  { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  COMPLETADA:  { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  CANCELADA:   { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500' },
  NO_ASISTIO:  { bg: 'bg-gray-100',   text: 'text-gray-800',   dot: 'bg-gray-500' },
}

export const ETIQUETAS_ESTADO_CITA = {
  PROGRAMADA:  'Programada',
  CONFIRMADA:  'Confirmada',
  EN_PROCESO:  'En Proceso',
  COMPLETADA:  'Completada',
  CANCELADA:   'Cancelada',
  NO_ASISTIO:  'No Asistio',
}
```

---

## ETAPA 5: Frontend - Pagina Agenda & Citas

### 5.1 Vista principal: `apps/web/src/pages/AgendaPage.tsx`

**Layout de la pagina:**

```
+------------------------------------------------------------------+
|  Agenda & Citas                          [+ Nueva Cita]          |
+------------------------------------------------------------------+
|  [Vista Dia] [Vista Semana] [Vista Lista]   < Hoy >   Filtros   |
+------------------------------------------------------------------+
|                                                                   |
|  VISTA DIA (por defecto):                                        |
|  +------------------+------------------------------------------+ |
|  | Horas            | Bahia 1  | Bahia 2  | Bahia 3  | ...    | |
|  |  08:00           | [Cita]   |          | [Cita]   |        | |
|  |  09:00           |          | [Cita]   |          |        | |
|  |  10:00           | [Cita]   |          |          |        | |
|  |  ...             |          |          |          |        | |
|  +------------------+------------------------------------------+ |
|                                                                   |
|  VISTA SEMANA:                                                   |
|  Grilla Lun-Sab con citas como bloques de color por estado       |
|                                                                   |
|  VISTA LISTA:                                                    |
|  Tabla con columnas: Hora, Cliente, Vehiculo, Servicio,          |
|  Bahia, Mecanico, Estado, Acciones                               |
|                                                                   |
+------------------------------------------------------------------+
```

### 5.2 Componentes de la Agenda

| Componente | Descripcion |
|------------|-------------|
| `AgendaPage.tsx` | Pagina principal con tabs de vista y filtros |
| `VistaAgendaDia.tsx` | Grilla hora x bahia con bloques de citas |
| `VistaAgendaSemana.tsx` | Grilla dia x hora con bloques resumidos |
| `VistaAgendaLista.tsx` | Tabla standard con filtros y paginacion |
| `CitaCard.tsx` | Bloque visual de cita (color por estado, info resumida) |
| `ModalNuevaCita.tsx` | Modal para crear/editar cita con formulario |
| `ModalDetalleCita.tsx` | Modal detalle con acciones de cambio estado |
| `FiltrosAgenda.tsx` | Filtros: fecha, mecanico, bahia, estado |

### 5.3 Modal Nueva Cita - Formulario

```
+--------------------------------------------------+
|  Nueva Cita                                  [X] |
+--------------------------------------------------+
|  Cliente *        [SearchSelect - buscar]        |
|  Vehiculo *       [SearchSelect - filtrado]      |
|  Servicio         [SearchSelect - opcional]      |
|  ------------------------------------------------|
|  Fecha *          [DatePicker]                   |
|  Hora *           [TimePicker - slots 15min]     |
|  Duracion *       [Select: 15/30/45/60/90/120]   |
|  ------------------------------------------------|
|  Bahia            [Select - bahias disponibles]  |
|  Mecanico         [Select - mecanicos disp.]     |
|  ------------------------------------------------|
|  Notas            [Textarea max 500]             |
|  ------------------------------------------------|
|           [Cancelar]  [Agendar Cita]             |
+--------------------------------------------------+
```

- Al seleccionar fecha+hora+duracion, mostrar disponibilidad de bahias y mecanicos
- SearchSelect de cliente igual que en OT (buscar por DNI/nombre/telefono)
- Al seleccionar cliente, filtrar vehiculos de ese cliente

### 5.4 Integracion en App

1. Agregar `'agenda'` a tipo `PaginaActual`
2. Agregar case en switch de App.tsx
3. Activar item en Sidebar (cambiar `pagina: null` a `pagina: 'agenda'`)
4. Lazy import del componente

---

## ETAPA 6: Frontend - Notificaciones en TopBar

### 6.1 Componentes

| Componente | Descripcion |
|------------|-------------|
| `NotificacionesBell.tsx` | Icono campana + badge con count real (query cada 30s) |
| `NotificacionesPanel.tsx` | Dropdown panel al hacer clic en campana |
| `NotificacionItem.tsx` | Linea de notificacion (icono tipo + titulo + tiempo relativo) |

### 6.2 Panel de Notificaciones

```
+---------------------------------------+
|  Notificaciones        [Marcar todas] |
+---------------------------------------+
|  * Nueva cita confirmada              |
|    Juan Perez - Toyota Corolla        |
|    hace 5 min                         |
|  -----------------------------------  |
|    OT-2026-0045 paso a Entregado      |
|    hace 20 min                        |
|  -----------------------------------  |
|    Alerta: Filtro aceite stock bajo   |
|    hace 1 hora                        |
|  -----------------------------------  |
|  [Ver todas las notificaciones]       |
+---------------------------------------+
```

- Las no leidas tienen fondo destacado
- Click en notificacion: marca como leida + navega si tiene `enlace`
- "Marcar todas" llama al endpoint masivo
- Maximo 10 en el dropdown, "Ver todas" abre vista completa (futuro)

### 6.3 Query con polling

```typescript
// Polling cada 30 segundos para el count
useQuery({
  queryKey: ['notificaciones', 'count'],
  queryFn: () => api.get('/notificaciones/count'),
  refetchInterval: 30_000,
})
```

---

## ETAPA 7: Dashboard - Widget Citas de Hoy

### 7.1 Agregar al Dashboard existente

Nuevo widget "Citas de Hoy" debajo de los KPIs actuales:

```
+------------------------------------------+
|  Citas de Hoy (3)                        |
+------------------------------------------+
|  09:00  Revision frenos                  |
|         Maria Perez - ABC-123  [Confirm] |
|  10:30  Cambio aceite                    |
|         Juan Rodriguez - XY-1234  [Prog] |
|  14:00  Diagnostico                      |
|         Pedro Sanchez - DEF-456  [Proc]  |
+------------------------------------------+
|  + Ver agenda completa                   |
+------------------------------------------+
```

- Endpoint: GET `/api/agenda/hoy`
- Click en "Ver agenda completa" navega a pagina Agenda

---

## ETAPA 8: Exportacion PDF/Excel en Reportes

### 8.1 Backend

Agregar a `reportes.routes.ts`:
```
GET /api/reportes/ingresos/exportar?formato=pdf&periodo=mensual&fecha=2026-03
GET /api/reportes/ingresos/exportar?formato=excel&periodo=mensual&fecha=2026-03
```

**Librerias:**
- PDF: `pdfmake` (no requiere dependencias nativas)
- Excel: `exceljs`

### 8.2 Frontend

Agregar botones de exportacion en la pagina de Reportes:
```
[Exportar PDF]  [Exportar Excel]
```

- Descargan el archivo generado por el backend
- Incluyen los mismos filtros activos en la vista

---

## Orden de implementacion

| Paso | Etapa | Dependencias | Estimacion |
|------|-------|-------------|------------|
| 1 | Etapa 1: Modelos Prisma + migracion | Ninguna | Rapido |
| 2 | Etapa 4: Constantes shared | Etapa 1 | Rapido |
| 3 | Etapa 2: Backend Agenda | Etapas 1, 4 | Medio |
| 4 | Etapa 3: Backend Notificaciones | Etapas 1, 4 | Medio |
| 5 | Etapa 5: Frontend Agenda (vista lista primero, luego dia/semana) | Etapas 2, 4 | Alto |
| 6 | Etapa 6: Frontend Notificaciones TopBar | Etapa 3 | Medio |
| 7 | Etapa 7: Widget citas en Dashboard | Etapa 2 | Rapido |
| 8 | Etapa 8: Exportacion reportes | Ninguna (independiente) | Medio |

---

## Criterios de aceptacion

- [ ] Crear cita con cliente, vehiculo, fecha, hora, duracion
- [ ] Ver citas del dia en grilla por bahia
- [ ] Ver citas en vista lista con filtros
- [ ] Cambiar estado de cita con transiciones validas
- [ ] Validar que no haya conflicto de bahia/mecanico en mismo horario
- [ ] Campana muestra count real de notificaciones no leidas
- [ ] Panel desplegable muestra ultimas notificaciones
- [ ] Marcar leida individual y masiva
- [ ] Al crear cita se notifica al mecanico asignado
- [ ] Al cambiar estado OT se notifica al creador
- [ ] Dashboard muestra widget "Citas de Hoy"
- [ ] Reportes tienen botones Exportar PDF y Excel
- [ ] Permisos: Mecanico solo lectura en agenda, Almacen/Contabilidad sin acceso
- [ ] Mensajes de error amigables y claros
- [ ] Font-size 18px consistente en nuevos componentes
