import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedServiciosRepuestos() {
  console.log('\n🔧 Seeding servicios y repuestos...');

  // Obtener catálogos
  const categorias = await prisma.catCategoriaServicio.findMany();
  const especialidades = await prisma.catEspecialidad.findMany();
  const catRepuestos = await prisma.catCategoriaRepuesto.findMany();
  const unidades = await prisma.catUnidad.findMany();

  const cat = (nombre: string) => categorias.find((c) => c.nombre === nombre)?.id || categorias[0]?.id;
  const esp = (nombre: string) => especialidades.find((e) => e.nombre === nombre)?.id || null;
  const catRep = (nombre: string) => catRepuestos.find((c) => c.nombre === nombre)?.id || catRepuestos[0]?.id;
  const uni = (nombre: string) => unidades.find((u) => u.nombre === nombre)?.id || unidades[0]?.id;

  // === SERVICIOS ===
  const servicios = [
    // Mantenimiento General - Preventivos
    { nombre: 'Cambio de aceite de motor', tipoServicio: 'PREVENTIVO', precioBase: 80, categoriaId: cat('MANTENIMIENTO GENERAL'), especialidadId: esp('MECÁNICA GENERAL'), intervaloKm: 5000, intervaloMeses: 6 },
    { nombre: 'Cambio de filtro de aceite', tipoServicio: 'PREVENTIVO', precioBase: 30, categoriaId: cat('MANTENIMIENTO GENERAL'), especialidadId: esp('MECÁNICA GENERAL'), intervaloKm: 5000, intervaloMeses: 6 },
    { nombre: 'Cambio de filtro de aire', tipoServicio: 'PREVENTIVO', precioBase: 25, categoriaId: cat('MANTENIMIENTO GENERAL'), especialidadId: esp('MECÁNICA GENERAL'), intervaloKm: 10000, intervaloMeses: 12 },
    { nombre: 'Cambio de filtro de combustible', tipoServicio: 'PREVENTIVO', precioBase: 35, categoriaId: cat('MANTENIMIENTO GENERAL'), especialidadId: esp('MECÁNICA GENERAL'), intervaloKm: 20000, intervaloMeses: 24 },
    { nombre: 'Cambio de bujías', tipoServicio: 'PREVENTIVO', precioBase: 60, categoriaId: cat('MANTENIMIENTO GENERAL'), especialidadId: esp('MECÁNICA GENERAL'), intervaloKm: 30000, intervaloMeses: 24 },
    { nombre: 'Afinamiento completo', tipoServicio: 'PREVENTIVO', precioBase: 250, categoriaId: cat('MANTENIMIENTO GENERAL'), especialidadId: esp('MECÁNICA GENERAL'), intervaloKm: 10000, intervaloMeses: 12 },
    { nombre: 'Cambio de refrigerante', tipoServicio: 'PREVENTIVO', precioBase: 60, categoriaId: cat('MANTENIMIENTO GENERAL'), especialidadId: esp('MECÁNICA GENERAL'), intervaloKm: 40000, intervaloMeses: 24 },

    // Frenos
    { nombre: 'Cambio de pastillas de freno delanteras', tipoServicio: 'CORRECTIVO', precioBase: 120, categoriaId: cat('FRENOS'), especialidadId: esp('MECÁNICA GENERAL') },
    { nombre: 'Cambio de pastillas de freno traseras', tipoServicio: 'CORRECTIVO', precioBase: 100, categoriaId: cat('FRENOS'), especialidadId: esp('MECÁNICA GENERAL') },
    { nombre: 'Rectificación de discos de freno', tipoServicio: 'CORRECTIVO', precioBase: 80, categoriaId: cat('FRENOS'), especialidadId: esp('MECÁNICA GENERAL') },
    { nombre: 'Cambio de discos de freno', tipoServicio: 'CORRECTIVO', precioBase: 150, categoriaId: cat('FRENOS'), especialidadId: esp('MECÁNICA GENERAL') },
    { nombre: 'Cambio de líquido de frenos', tipoServicio: 'PREVENTIVO', precioBase: 45, categoriaId: cat('FRENOS'), especialidadId: esp('MECÁNICA GENERAL'), intervaloKm: 40000, intervaloMeses: 24 },
    { nombre: 'Regulación de frenos', tipoServicio: 'CORRECTIVO', precioBase: 40, categoriaId: cat('FRENOS'), especialidadId: esp('MECÁNICA GENERAL') },

    // Suspensión
    { nombre: 'Cambio de amortiguadores delanteros (par)', tipoServicio: 'CORRECTIVO', precioBase: 200, categoriaId: cat('SUSPENSIÓN'), especialidadId: esp('MECÁNICA GENERAL') },
    { nombre: 'Cambio de amortiguadores traseros (par)', tipoServicio: 'CORRECTIVO', precioBase: 180, categoriaId: cat('SUSPENSIÓN'), especialidadId: esp('MECÁNICA GENERAL') },
    { nombre: 'Cambio de rótulas', tipoServicio: 'CORRECTIVO', precioBase: 120, categoriaId: cat('SUSPENSIÓN'), especialidadId: esp('MECÁNICA GENERAL') },
    { nombre: 'Cambio de terminales de dirección', tipoServicio: 'CORRECTIVO', precioBase: 100, categoriaId: cat('SUSPENSIÓN'), especialidadId: esp('MECÁNICA GENERAL') },

    // Motor
    { nombre: 'Cambio de correa de distribución', tipoServicio: 'PREVENTIVO', precioBase: 350, categoriaId: cat('MOTOR'), especialidadId: esp('MECÁNICA GENERAL'), intervaloKm: 60000, intervaloMeses: 48 },
    { nombre: 'Cambio de bomba de agua', tipoServicio: 'CORRECTIVO', precioBase: 200, categoriaId: cat('MOTOR'), especialidadId: esp('MECÁNICA GENERAL') },
    { nombre: 'Reparación de culata', tipoServicio: 'CORRECTIVO', precioBase: 800, categoriaId: cat('MOTOR'), especialidadId: esp('MECÁNICA GENERAL') },
    { nombre: 'Cambio de empaquetadura de culata', tipoServicio: 'CORRECTIVO', precioBase: 500, categoriaId: cat('MOTOR'), especialidadId: esp('MECÁNICA GENERAL') },

    // Transmisión
    { nombre: 'Cambio de aceite de caja', tipoServicio: 'PREVENTIVO', precioBase: 100, categoriaId: cat('TRANSMISIÓN'), especialidadId: esp('MECÁNICA GENERAL'), intervaloKm: 40000, intervaloMeses: 36 },
    { nombre: 'Cambio de kit de embrague', tipoServicio: 'CORRECTIVO', precioBase: 450, categoriaId: cat('TRANSMISIÓN'), especialidadId: esp('MECÁNICA GENERAL') },

    // Eléctrico
    { nombre: 'Cambio de batería', tipoServicio: 'CORRECTIVO', precioBase: 50, categoriaId: cat('SISTEMA ELÉCTRICO'), especialidadId: esp('ELECTRICIDAD AUTOMOTRIZ') },
    { nombre: 'Cambio de alternador', tipoServicio: 'CORRECTIVO', precioBase: 180, categoriaId: cat('SISTEMA ELÉCTRICO'), especialidadId: esp('ELECTRICIDAD AUTOMOTRIZ') },
    { nombre: 'Revisión sistema eléctrico', tipoServicio: 'CORRECTIVO', precioBase: 80, categoriaId: cat('SISTEMA ELÉCTRICO'), especialidadId: esp('ELECTRICIDAD AUTOMOTRIZ') },
    { nombre: 'Diagnóstico electrónico (scanner)', tipoServicio: 'CORRECTIVO', precioBase: 60, categoriaId: cat('SISTEMA ELÉCTRICO'), especialidadId: esp('DIAGNÓSTICO ELECTRÓNICO') },

    // A/C
    { nombre: 'Carga de aire acondicionado', tipoServicio: 'CORRECTIVO', precioBase: 120, categoriaId: cat('AIRE ACONDICIONADO'), especialidadId: esp('AIRE ACONDICIONADO') },
    { nombre: 'Cambio de compresor de A/C', tipoServicio: 'CORRECTIVO', precioBase: 400, categoriaId: cat('AIRE ACONDICIONADO'), especialidadId: esp('AIRE ACONDICIONADO') },

    // Alineación
    { nombre: 'Alineamiento computarizado', tipoServicio: 'PREVENTIVO', precioBase: 60, categoriaId: cat('ALINEACIÓN Y BALANCEO'), especialidadId: esp('ALINEACIÓN Y BALANCEO'), intervaloKm: 10000, intervaloMeses: 12 },
    { nombre: 'Balanceo de llantas (4)', tipoServicio: 'PREVENTIVO', precioBase: 40, categoriaId: cat('ALINEACIÓN Y BALANCEO'), especialidadId: esp('ALINEACIÓN Y BALANCEO'), intervaloKm: 10000, intervaloMeses: 12 },
    { nombre: 'Rotación de llantas', tipoServicio: 'PREVENTIVO', precioBase: 30, categoriaId: cat('LLANTAS'), especialidadId: esp('ALINEACIÓN Y BALANCEO'), intervaloKm: 10000, intervaloMeses: 12 },
  ];

  for (const servicio of servicios) {
    const existe = await prisma.servicio.findFirst({ where: { nombre: servicio.nombre } });
    if (!existe) {
      await prisma.servicio.create({ data: servicio as any });
    }
  }
  console.log(`  ✅ Servicios: ${servicios.length} registros`);

  // === REPUESTOS ===
  const repuestos = [
    // Filtros
    { codigo: 'FIL-ACE-001', nombre: 'Filtro de aceite universal', categoriaId: catRep('FILTROS'), unidadId: uni('UNIDAD'), stockMinimo: 10, precioVenta: 25, stockActual: 30 },
    { codigo: 'FIL-AIR-001', nombre: 'Filtro de aire sedan', categoriaId: catRep('FILTROS'), unidadId: uni('UNIDAD'), stockMinimo: 8, precioVenta: 35, stockActual: 20 },
    { codigo: 'FIL-COM-001', nombre: 'Filtro de combustible', categoriaId: catRep('FILTROS'), unidadId: uni('UNIDAD'), stockMinimo: 8, precioVenta: 30, stockActual: 15 },
    { codigo: 'FIL-HAB-001', nombre: 'Filtro de habitáculo / cabina', categoriaId: catRep('FILTROS'), unidadId: uni('UNIDAD'), stockMinimo: 5, precioVenta: 28, stockActual: 12 },

    // Aceites
    { codigo: 'ACE-10W30-001', nombre: 'Aceite de motor 10W-30 (galón)', categoriaId: catRep('ACEITES Y LUBRICANTES'), unidadId: uni('GALÓN'), stockMinimo: 10, precioVenta: 85, stockActual: 25 },
    { codigo: 'ACE-5W30-001', nombre: 'Aceite de motor 5W-30 sintético (galón)', categoriaId: catRep('ACEITES Y LUBRICANTES'), unidadId: uni('GALÓN'), stockMinimo: 8, precioVenta: 120, stockActual: 18 },
    { codigo: 'ACE-ATF-001', nombre: 'Aceite de transmisión ATF (litro)', categoriaId: catRep('ACEITES Y LUBRICANTES'), unidadId: uni('LITRO'), stockMinimo: 10, precioVenta: 35, stockActual: 20 },
    { codigo: 'ACE-FRE-001', nombre: 'Líquido de frenos DOT4 (500ml)', categoriaId: catRep('ACEITES Y LUBRICANTES'), unidadId: uni('UNIDAD'), stockMinimo: 8, precioVenta: 25, stockActual: 15 },
    { codigo: 'ACE-REF-001', nombre: 'Refrigerante / coolant (galón)', categoriaId: catRep('ACEITES Y LUBRICANTES'), unidadId: uni('GALÓN'), stockMinimo: 5, precioVenta: 45, stockActual: 10 },

    // Frenos
    { codigo: 'FRE-PAS-DEL', nombre: 'Pastillas de freno delanteras (juego)', categoriaId: catRep('FRENOS'), unidadId: uni('JUEGO'), stockMinimo: 5, precioVenta: 85, stockActual: 12 },
    { codigo: 'FRE-PAS-TRA', nombre: 'Pastillas de freno traseras (juego)', categoriaId: catRep('FRENOS'), unidadId: uni('JUEGO'), stockMinimo: 5, precioVenta: 75, stockActual: 10 },
    { codigo: 'FRE-DIS-DEL', nombre: 'Disco de freno delantero', categoriaId: catRep('FRENOS'), unidadId: uni('UNIDAD'), stockMinimo: 4, precioVenta: 120, stockActual: 8 },
    { codigo: 'FRE-DIS-TRA', nombre: 'Disco de freno trasero', categoriaId: catRep('FRENOS'), unidadId: uni('UNIDAD'), stockMinimo: 4, precioVenta: 100, stockActual: 6 },

    // Suspensión
    { codigo: 'SUS-AMO-DEL', nombre: 'Amortiguador delantero', categoriaId: catRep('SUSPENSIÓN'), unidadId: uni('UNIDAD'), stockMinimo: 4, precioVenta: 180, stockActual: 8 },
    { codigo: 'SUS-AMO-TRA', nombre: 'Amortiguador trasero', categoriaId: catRep('SUSPENSIÓN'), unidadId: uni('UNIDAD'), stockMinimo: 4, precioVenta: 150, stockActual: 6 },
    { codigo: 'SUS-ROT-001', nombre: 'Rótula de dirección', categoriaId: catRep('SUSPENSIÓN'), unidadId: uni('UNIDAD'), stockMinimo: 4, precioVenta: 65, stockActual: 8 },
    { codigo: 'SUS-TER-001', nombre: 'Terminal de dirección', categoriaId: catRep('SUSPENSIÓN'), unidadId: uni('UNIDAD'), stockMinimo: 4, precioVenta: 45, stockActual: 10 },

    // Motor
    { codigo: 'MOT-BUJ-001', nombre: 'Bujía de encendido', categoriaId: catRep('MOTOR'), unidadId: uni('UNIDAD'), stockMinimo: 16, precioVenta: 15, stockActual: 40 },
    { codigo: 'MOT-COR-001', nombre: 'Correa de distribución', categoriaId: catRep('MOTOR'), unidadId: uni('UNIDAD'), stockMinimo: 3, precioVenta: 180, stockActual: 5 },
    { codigo: 'MOT-BOM-001', nombre: 'Bomba de agua', categoriaId: catRep('MOTOR'), unidadId: uni('UNIDAD'), stockMinimo: 2, precioVenta: 150, stockActual: 4 },
    { codigo: 'MOT-EMP-001', nombre: 'Empaquetadura de culata', categoriaId: catRep('MOTOR'), unidadId: uni('UNIDAD'), stockMinimo: 2, precioVenta: 120, stockActual: 3 },

    // Eléctrico
    { codigo: 'ELE-BAT-001', nombre: 'Batería 12V 60Ah', categoriaId: catRep('ELÉCTRICO'), unidadId: uni('UNIDAD'), stockMinimo: 3, precioVenta: 350, stockActual: 5 },
    { codigo: 'ELE-ALT-001', nombre: 'Alternador reconstruido', categoriaId: catRep('ELÉCTRICO'), unidadId: uni('UNIDAD'), stockMinimo: 2, precioVenta: 280, stockActual: 3 },

    // Refrigeración
    { codigo: 'REF-GAS-001', nombre: 'Gas refrigerante R134a (lata)', categoriaId: catRep('REFRIGERACIÓN'), unidadId: uni('UNIDAD'), stockMinimo: 5, precioVenta: 45, stockActual: 10 },

    // Llantas
    { codigo: 'LLA-195-001', nombre: 'Llanta 195/65 R15', categoriaId: catRep('LLANTAS Y AROS'), unidadId: uni('UNIDAD'), stockMinimo: 4, precioVenta: 250, stockActual: 8 },
    { codigo: 'LLA-205-001', nombre: 'Llanta 205/55 R16', categoriaId: catRep('LLANTAS Y AROS'), unidadId: uni('UNIDAD'), stockMinimo: 4, precioVenta: 300, stockActual: 6 },
  ];

  for (const repuesto of repuestos) {
    const existe = await prisma.repuesto.findFirst({ where: { codigo: repuesto.codigo } });
    if (!existe) {
      await prisma.repuesto.create({ data: repuesto as any });
    }
  }
  console.log(`  ✅ Repuestos: ${repuestos.length} registros`);

  console.log('🔧 Servicios y repuestos completados\n');
}
