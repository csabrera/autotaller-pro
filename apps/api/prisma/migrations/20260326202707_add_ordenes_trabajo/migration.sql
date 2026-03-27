-- CreateTable
CREATE TABLE "ordenes_trabajo" (
    "id" TEXT NOT NULL,
    "numero_orden" TEXT NOT NULL,
    "vehiculo_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "recepcionista_id" TEXT NOT NULL,
    "mecanico_asignado_id" TEXT,
    "sucursal_id" TEXT NOT NULL,
    "bahia_id" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'RECIBIDO',
    "kilometraje_entrada" INTEGER NOT NULL,
    "fecha_entrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_estimada" TIMESTAMP(3),
    "fecha_entrega" TIMESTAMP(3),
    "notas_cliente" TEXT,
    "notas_internas" TEXT,
    "diagnostico" TEXT,
    "costo_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_servicios" (
    "id" TEXT NOT NULL,
    "orden_trabajo_id" TEXT NOT NULL,
    "servicio_nombre" TEXT NOT NULL,
    "servicio_tipo" TEXT NOT NULL,
    "mecanico_id" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "ot_servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_repuestos" (
    "id" TEXT NOT NULL,
    "orden_trabajo_id" TEXT NOT NULL,
    "repuesto_nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costo_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ot_repuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_checklist" (
    "id" TEXT NOT NULL,
    "orden_trabajo_id" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "marcado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ot_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_evidencias" (
    "id" TEXT NOT NULL,
    "orden_trabajo_id" TEXT NOT NULL,
    "url_imagen" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "subido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ot_evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ot_historial_estados" (
    "id" TEXT NOT NULL,
    "orden_trabajo_id" TEXT NOT NULL,
    "estado_anterior" TEXT NOT NULL,
    "estado_nuevo" TEXT NOT NULL,
    "cambiado_por_id" TEXT NOT NULL,
    "notas" TEXT,
    "cambiado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ot_historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_numero_orden_key" ON "ordenes_trabajo"("numero_orden");

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_recepcionista_id_fkey" FOREIGN KEY ("recepcionista_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_mecanico_asignado_id_fkey" FOREIGN KEY ("mecanico_asignado_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_bahia_id_fkey" FOREIGN KEY ("bahia_id") REFERENCES "cat_bahias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_servicios" ADD CONSTRAINT "ot_servicios_orden_trabajo_id_fkey" FOREIGN KEY ("orden_trabajo_id") REFERENCES "ordenes_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_repuestos" ADD CONSTRAINT "ot_repuestos_orden_trabajo_id_fkey" FOREIGN KEY ("orden_trabajo_id") REFERENCES "ordenes_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_checklist" ADD CONSTRAINT "ot_checklist_orden_trabajo_id_fkey" FOREIGN KEY ("orden_trabajo_id") REFERENCES "ordenes_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_evidencias" ADD CONSTRAINT "ot_evidencias_orden_trabajo_id_fkey" FOREIGN KEY ("orden_trabajo_id") REFERENCES "ordenes_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ot_historial_estados" ADD CONSTRAINT "ot_historial_estados_orden_trabajo_id_fkey" FOREIGN KEY ("orden_trabajo_id") REFERENCES "ordenes_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
