-- CreateTable
CREATE TABLE "cat_marcas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pais" TEXT,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_modelos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "marca_id" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_modelos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_tipos_vehiculo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_tipos_vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_colores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_colores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_combustibles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_combustibles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_transmisiones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_transmisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_categorias_servicio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_categorias_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_especialidades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_especialidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_bahias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_bahias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_metodos_pago" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_metodos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_tipos_doc_fiscal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_tipos_doc_fiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_unidades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_motivos_descuento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_motivos_descuento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_categorias_repuesto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_categorias_repuesto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cat_marcas_nombre_key" ON "cat_marcas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_modelos_nombre_marca_id_key" ON "cat_modelos"("nombre", "marca_id");

-- CreateIndex
CREATE UNIQUE INDEX "cat_tipos_vehiculo_nombre_key" ON "cat_tipos_vehiculo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_colores_nombre_key" ON "cat_colores"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_combustibles_nombre_key" ON "cat_combustibles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_transmisiones_nombre_key" ON "cat_transmisiones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_categorias_servicio_nombre_key" ON "cat_categorias_servicio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_especialidades_nombre_key" ON "cat_especialidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_bahias_nombre_sucursal_id_key" ON "cat_bahias"("nombre", "sucursal_id");

-- CreateIndex
CREATE UNIQUE INDEX "cat_metodos_pago_nombre_key" ON "cat_metodos_pago"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_tipos_doc_fiscal_nombre_key" ON "cat_tipos_doc_fiscal"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_unidades_nombre_key" ON "cat_unidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_motivos_descuento_nombre_key" ON "cat_motivos_descuento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_categorias_repuesto_nombre_key" ON "cat_categorias_repuesto"("nombre");

-- AddForeignKey
ALTER TABLE "cat_modelos" ADD CONSTRAINT "cat_modelos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "cat_marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_bahias" ADD CONSTRAINT "cat_bahias_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
