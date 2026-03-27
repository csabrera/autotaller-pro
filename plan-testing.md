# Plan de Testing — AutoTaller Pro

> **Fecha:** 2026-03-27
> **Total:** 90 tests
> **Preparación:** docker compose up -d → apps/api npm run dev → apps/web npm run dev

---

## 1. AUTH & SESIÓN

| # | Test | Ruta | Esperado |
|---|------|------|----------|
| 1.1 | Acceder sin login | `/` | Redirige a `/login` |
| 1.2 | Login con credenciales incorrectas | `/login` | Toast error amigable |
| 1.3 | Login admin | DNI `00000000` + clave | Redirige a `/`, toast bienvenida |
| 1.4 | Recargar página | F5 en cualquier ruta | Mantiene sesión y ruta |
| 1.5 | Botón atrás/adelante | Navegador | Funciona correctamente |
| 1.6 | Ctrl+Click en sidebar | Cualquier item | Abre en nueva pestaña |
| 1.7 | Cerrar sesión | Sidebar > Cerrar Sesión | Redirige a `/login`, limpia token |
| 1.8 | Acceder a ruta admin sin login | `/ordenes-trabajo` | Redirige a `/login` |

---

## 2. DASHBOARD (`/`)

| # | Test | Esperado |
|---|------|----------|
| 2.1 | KPIs cargan | 4 cards con datos reales |
| 2.2 | OTs recientes | Lista con estado coloreado |
| 2.3 | Widget Citas de Hoy | Muestra citas o "No hay citas" |
| 2.4 | "Ver agenda completa" | Navega a `/agenda` |
| 2.5 | Estado de Órdenes | Conteo por estado |
| 2.6 | Servicios Top | Top 5 ranking |
| 2.7 | Auto-refresco | Datos se actualizan cada 30s |

---

## 3. VEHÍCULOS & CLIENTES (`/vehiculos`)

| # | Test | Esperado |
|---|------|----------|
| 3.1 | Tabla carga | Muestra clientes con columna # |
| 3.2 | Filtro Todos/Personas/Empresas | Filtra correctamente |
| 3.3 | Búsqueda por nombre | Debounce 400ms, filtra |
| 3.4 | Búsqueda por DNI | Encuentra al cliente |
| 3.5 | Búsqueda por placa | Encuentra al cliente |
| 3.6 | Clic en fila | Abre modal detalle con vehículos |
| 3.7 | Modal: info contacto | Teléfono, correo, dirección |
| 3.8 | Modal: vehículos en cards | Placa, marca, modelo, km, color |
| 3.9 | Modal: agregar vehículo | Abre modal crear vehículo |
| 3.10 | Crear cliente persona | Formulario con validaciones Perú |
| 3.11 | Crear cliente empresa | Con datos contacto empresa |
| 3.12 | Crear vehículo | Placa formato Perú, marca/modelo del catálogo |
| 3.13 | Deshabilitar/Activar | Confirm dialog, cliente se opaca |
| 3.14 | Paginación | 10 por página, Anterior/Siguiente |
| 3.15 | Acciones con texto | "Ver", "Vehículo", "Deshab." visibles en desktop |

---

## 4. ÓRDENES DE TRABAJO (`/ordenes-trabajo`)

| # | Test | Esperado |
|---|------|----------|
| 4.1 | Tabla con filtros por estado | Pills con conteos en badges |
| 4.2 | Filtrar por "En Proceso" | Solo muestra OTs en proceso |
| 4.3 | Búsqueda por N° orden | Encuentra la OT |
| 4.4 | Crear OT (`/ordenes-trabajo/nueva`) | Paso 1: buscar cliente + vehículo |
| 4.5 | Paso 2 | Checklist con observaciones, km, fecha estimada |
| 4.6 | OT creada | Redirige a detalle `/ordenes-trabajo/:id` |
| 4.7 | Detalle: agregar servicio | SearchSelect del catálogo, costo se suma |
| 4.8 | Detalle: agregar repuesto | Stock visual, costo se suma |
| 4.9 | Cambiar estado RECIBIDO → EN_PROCESO | Notificación generada al recepcionista |
| 4.10 | Cambiar estado EN_PROCESO → ENTREGADO | OT solo lectura |
| 4.11 | Ctrl+Click en fila | Abre detalle en nueva pestaña |
| 4.12 | Botón volver | Navega a `/ordenes-trabajo` |

---

## 5. SERVICIOS (`/servicios`)

| # | Test | Esperado |
|---|------|----------|
| 5.1 | Filtros Todos/Preventivo/Correctivo | Pills con iconos |
| 5.2 | Crear servicio | Modal con categoría, especialidad, precio |
| 5.3 | Deshabilitar servicio | Confirm dialog |
| 5.4 | Paginación | Funciona con 32 servicios |

---

## 6. INVENTARIO (`/inventario`)

| # | Test | Esperado |
|---|------|----------|
| 6.1 | Filtro Stock Bajo | Solo repuestos críticos |
| 6.2 | Badge stock bajo | Rojo con icono AlertTriangle |
| 6.3 | Registrar ENTRADA | Stock sube |
| 6.4 | Registrar SALIDA | Stock baja, si queda bajo mínimo → notificación ALMACÉN |
| 6.5 | Crear repuesto | Código, nombre, categoría, precio |

---

## 7. FACTURACIÓN (`/facturacion`)

| # | Test | Esperado |
|---|------|----------|
| 7.1 | Filtros por estado | Emitida/Parcial/Pagada/Anulada |
| 7.2 | Generar factura desde OT entregada | Auto: Boleta persona / Factura empresa, IGV 18% |
| 7.3 | Ver detalle factura | Modal con subtotal, IGV, total |
| 7.4 | Registrar pago parcial | Estado → PARCIAL, muestra pendiente |
| 7.5 | Registrar segundo pago | Estado → PAGADA, notificación a CONTABILIDAD |
| 7.6 | Anular factura | Solo si no pagada, confirm dialog |
| 7.7 | Acciones con texto | "Ver", "Pagar", "Anular" |

---

## 8. AGENDA & CITAS (`/agenda`)

| # | Test | Esperado |
|---|------|----------|
| 8.1 | Filtros por estado | 7 estados con conteos |
| 8.2 | Crear cita | Modal con cliente, vehículo, servicio, mecánico |
| 8.3 | CitaDateTimePicker | Dropdown → calendario + slots hora |
| 8.4 | Verificar disponibilidad mecánico | Alerta si mecánico ocupado |
| 8.5 | Número auto CIT-2026-0001 | Se genera automáticamente |
| 8.6 | Cambiar estado Programada → Confirmada | Notificación a mecánico + recepcionistas |
| 8.7 | Cambiar estado → En Proceso → Completada | Transiciones válidas |
| 8.8 | Editar cita | Solo si Programada o Confirmada |
| 8.9 | Cita en Dashboard | Widget "Citas de Hoy" si es para hoy |

---

## 9. REPORTES (`/reportes`)

| # | Test | Esperado |
|---|------|----------|
| 9.1 | Filtros período | Esta semana / Este mes / Este año |
| 9.2 | KPIs ingresos | Total, pagos, promedio |
| 9.3 | Gráfica por método pago | Barras con % |
| 9.4 | Exportar PDF | Descarga reporte-ingresos-mes.pdf |
| 9.5 | Exportar Excel | Descarga .xlsx con 3 hojas |
| 9.6 | PDF contenido | Header naranja, KPIs, tablas |
| 9.7 | Excel contenido | Formato moneda S/, headers |

---

## 10. CONFIGURACIÓN (`/configuracion`)

| # | Test | Esperado |
|---|------|----------|
| 10.1 | Tabs Vehiculares/Operativos/Sistema | Cambian contenido |
| 10.2 | Pills catálogos | Marcas, Modelos, Colores, etc. |
| 10.3 | Filtros Todos/Activos/Inactivos | Pills + búsqueda |
| 10.4 | Botón "Nuevo Registro" | En header, abre modal |
| 10.5 | Crear/editar catálogo | Modal con validación |
| 10.6 | Paginación client-side | 10 por página en catálogos grandes |
| 10.7 | Cambiar tema | Naranja/Azul/Navy/Esmeralda |
| 10.8 | Toggle modo oscuro | Switch visual, todo cambia |

---

## 11. NOTIFICACIONES (campana TopBar)

| # | Test | Esperado |
|---|------|----------|
| 11.1 | Badge con count real | Polling cada 30s |
| 11.2 | Panel dropdown | Últimas 15 notificaciones |
| 11.3 | No leídas resaltadas | Fondo + punto azul |
| 11.4 | Clic marca como leída | Fondo normal |
| 11.5 | "Marcar todas" | Badge desaparece |
| 11.6 | Clic navega | Va a la ruta del enlace |
| 11.7 | Iconos contextuales | Calendario/Wrench/Package/DollarSign |

---

## 12. USUARIOS (`/usuarios`)

| # | Test | Esperado |
|---|------|----------|
| 12.1 | Crear usuario mecánico | Para asignar en citas/OTs |
| 12.2 | Crear usuario almacén | Recibe notificaciones stock bajo |
| 12.3 | Resetear clave | Usuario debe cambiar al login |
| 12.4 | Deshabilitar usuario | No puede hacer login |

---

## 13. PORTAL CLIENTE (`/portal`)

| # | Test | Ruta | Esperado |
|---|------|------|----------|
| 13.1 | Login correcto | `/portal/login` | DNI `87654321` + tel `998877665` → dashboard |
| 13.2 | Login incorrecto | `/portal/login` | Error amigable |
| 13.3 | Dashboard | `/portal` | KPIs + vehículos + citas |
| 13.4 | Mis Vehículos | `/portal/vehiculos` | Cards con estado OT si tienen |
| 13.5 | Mis Órdenes | `/portal/ordenes` | Historial con servicios/repuestos |
| 13.6 | Mis Facturas | `/portal/facturas` | Con pagos y pendientes |
| 13.7 | Mis Citas | `/portal/citas` | Lista de citas |
| 13.8 | Agendar cita | `/portal/citas` | Vehículo + servicio + fecha → cita creada |
| 13.9 | Cita aparece en admin | `/agenda` | Con estado PROGRAMADA |
| 13.10 | Login empresa | RUC `20103453534` + tel `987873552` | Dashboard empresa |
| 13.11 | Cerrar sesión | Botón "Salir" | Redirige a `/portal/login` |
| 13.12 | Acceso sin login | `/portal` | Redirige a `/portal/login` |
| 13.13 | Portal no accede admin | `/` desde portal | No interfiere |

---

## 14. DARK MODE (transversal)

| # | Test | Esperado |
|---|------|----------|
| 14.1 | Toggle en Configuración | Switch cambia modo |
| 14.2 | Toggle en TopBar (luna/sol) | Mismo efecto |
| 14.3 | Todas las páginas | Fondos oscuros, texto claro |
| 14.4 | Modales | Fondo overlay, superficie oscura |
| 14.5 | DatePicker | Calendario con colores dark |
| 14.6 | Login/Cambiar clave | Respetan dark mode |
| 14.7 | Portal cliente | Respeta dark mode |
| 14.8 | Persistencia | Recargar mantiene modo |

---

## 15. RESPONSIVE (transversal)

| # | Test | Esperado |
|---|------|----------|
| 15.1 | Mobile sidebar | Hamburger → overlay |
| 15.2 | Tablas scroll horizontal | Sin romper layout |
| 15.3 | Filtros wrap | Se acomodan en mobile |
| 15.4 | Acciones texto oculto | Solo iconos en < lg |
| 15.5 | Portal mobile | Tabs scroll horizontal |

---

## Datos de prueba

**Admin:** DNI `00000000` + clave configurada

**Clientes para portal:**
- juan PEREZ: DNI `87654321`, tel `998877665`
- dino DURAND: DNI `95195195`, tel `951632554`
- Hospital Hermilio valdiazan (empresa): RUC `20103453534`, tel `987873552`
