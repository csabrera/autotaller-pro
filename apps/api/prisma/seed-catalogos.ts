import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCatalogo(modelo: any, datos: { nombre: string; descripcion?: string; pais?: string; orden?: number }[]) {
  for (let i = 0; i < datos.length; i++) {
    const item = datos[i];
    await modelo.upsert({
      where: { nombre: item.nombre },
      update: {},
      create: { ...item, orden: item.orden ?? i + 1 },
    });
  }
}

export async function seedCatalogos() {
  console.log('\n📦 Seeding catálogos...');

  // Marcas
  await seedCatalogo(prisma.catMarca, [
    { nombre: 'TOYOTA', pais: 'Japón' },
    { nombre: 'HYUNDAI', pais: 'Corea del Sur' },
    { nombre: 'KIA', pais: 'Corea del Sur' },
    { nombre: 'NISSAN', pais: 'Japón' },
    { nombre: 'CHEVROLET', pais: 'Estados Unidos' },
    { nombre: 'SUZUKI', pais: 'Japón' },
    { nombre: 'MITSUBISHI', pais: 'Japón' },
    { nombre: 'HONDA', pais: 'Japón' },
    { nombre: 'FORD', pais: 'Estados Unidos' },
    { nombre: 'VOLKSWAGEN', pais: 'Alemania' },
    { nombre: 'MAZDA', pais: 'Japón' },
    { nombre: 'RENAULT', pais: 'Francia' },
    { nombre: 'CHERY', pais: 'China' },
    { nombre: 'JAC', pais: 'China' },
    { nombre: 'MG', pais: 'China' },
    { nombre: 'CHANGAN', pais: 'China' },
    { nombre: 'GREAT WALL', pais: 'China' },
    { nombre: 'BMW', pais: 'Alemania' },
    { nombre: 'MERCEDES-BENZ', pais: 'Alemania' },
    { nombre: 'AUDI', pais: 'Alemania' },
  ]);
  console.log('  ✅ Marcas (20)');

  // Modelos por marca
  const marcas = await prisma.catMarca.findMany();
  const marcaMap = Object.fromEntries(marcas.map((m) => [m.nombre, m.id]));

  const modelos: { nombre: string; marcaId: string }[] = [
    // Toyota
    { nombre: 'COROLLA', marcaId: marcaMap['TOYOTA'] },
    { nombre: 'YARIS', marcaId: marcaMap['TOYOTA'] },
    { nombre: 'RAV4', marcaId: marcaMap['TOYOTA'] },
    { nombre: 'HILUX', marcaId: marcaMap['TOYOTA'] },
    { nombre: 'FORTUNER', marcaId: marcaMap['TOYOTA'] },
    // Hyundai
    { nombre: 'ACCENT', marcaId: marcaMap['HYUNDAI'] },
    { nombre: 'TUCSON', marcaId: marcaMap['HYUNDAI'] },
    { nombre: 'SANTA FE', marcaId: marcaMap['HYUNDAI'] },
    { nombre: 'CRETA', marcaId: marcaMap['HYUNDAI'] },
    // Kia
    { nombre: 'RIO', marcaId: marcaMap['KIA'] },
    { nombre: 'SPORTAGE', marcaId: marcaMap['KIA'] },
    { nombre: 'SELTOS', marcaId: marcaMap['KIA'] },
    { nombre: 'PICANTO', marcaId: marcaMap['KIA'] },
    // Nissan
    { nombre: 'SENTRA', marcaId: marcaMap['NISSAN'] },
    { nombre: 'VERSA', marcaId: marcaMap['NISSAN'] },
    { nombre: 'FRONTIER', marcaId: marcaMap['NISSAN'] },
    // Chevrolet
    { nombre: 'SAIL', marcaId: marcaMap['CHEVROLET'] },
    { nombre: 'TRACKER', marcaId: marcaMap['CHEVROLET'] },
    { nombre: 'ONIX', marcaId: marcaMap['CHEVROLET'] },
    // Suzuki
    { nombre: 'SWIFT', marcaId: marcaMap['SUZUKI'] },
    { nombre: 'VITARA', marcaId: marcaMap['SUZUKI'] },
  ];

  for (const modelo of modelos) {
    const existe = await prisma.catModelo.findFirst({
      where: { nombre: modelo.nombre, marcaId: modelo.marcaId },
    });
    if (!existe) {
      await prisma.catModelo.create({ data: modelo });
    }
  }
  console.log('  ✅ Modelos (21)');

  // Tipos de vehículo
  await seedCatalogo(prisma.catTipoVehiculo, [
    { nombre: 'SEDAN' },
    { nombre: 'SUV' },
    { nombre: 'CAMIONETA' },
    { nombre: 'HATCHBACK' },
    { nombre: 'VAN / MINIVAN' },
    { nombre: 'PICKUP' },
    { nombre: 'COUPE' },
    { nombre: 'STATION WAGON' },
  ]);
  console.log('  ✅ Tipos de vehículo (8)');

  // Colores
  await seedCatalogo(prisma.catColor, [
    { nombre: 'BLANCO' },
    { nombre: 'NEGRO' },
    { nombre: 'GRIS / PLATA' },
    { nombre: 'ROJO' },
    { nombre: 'AZUL' },
    { nombre: 'VERDE' },
    { nombre: 'DORADO / BEIGE' },
    { nombre: 'MARRÓN' },
    { nombre: 'NARANJA' },
    { nombre: 'AMARILLO' },
  ]);
  console.log('  ✅ Colores (10)');

  // Combustibles
  await seedCatalogo(prisma.catCombustible, [
    { nombre: 'GASOLINA' },
    { nombre: 'DIESEL' },
    { nombre: 'GLP' },
    { nombre: 'GNV' },
    { nombre: 'HÍBRIDO' },
    { nombre: 'ELÉCTRICO' },
  ]);
  console.log('  ✅ Combustibles (6)');

  // Transmisiones
  await seedCatalogo(prisma.catTransmision, [
    { nombre: 'MANUAL' },
    { nombre: 'AUTOMÁTICA' },
    { nombre: 'CVT' },
    { nombre: 'SEMIAUTOMÁTICA' },
  ]);
  console.log('  ✅ Transmisiones (4)');

  // Categorías de servicio
  await seedCatalogo(prisma.catCategoriaServicio, [
    { nombre: 'MANTENIMIENTO GENERAL', descripcion: 'Cambio de aceite, filtros, bujías' },
    { nombre: 'FRENOS', descripcion: 'Pastillas, discos, líquido de frenos' },
    { nombre: 'SUSPENSIÓN', descripcion: 'Amortiguadores, resortes, rótulas' },
    { nombre: 'MOTOR', descripcion: 'Reparación y mantenimiento del motor' },
    { nombre: 'TRANSMISIÓN', descripcion: 'Caja de cambios, embrague' },
    { nombre: 'SISTEMA ELÉCTRICO', descripcion: 'Batería, alternador, arranque' },
    { nombre: 'AIRE ACONDICIONADO', descripcion: 'Carga, reparación de A/C' },
    { nombre: 'ALINEACIÓN Y BALANCEO', descripcion: 'Alineamiento, balanceo de llantas' },
    { nombre: 'PINTURA Y CARROCERÍA', descripcion: 'Pintura, planchado, fibra de vidrio' },
    { nombre: 'LLANTAS', descripcion: 'Cambio, reparación, rotación de llantas' },
  ]);
  console.log('  ✅ Categorías de servicio (10)');

  // Especialidades
  await seedCatalogo(prisma.catEspecialidad, [
    { nombre: 'MECÁNICA GENERAL' },
    { nombre: 'ELECTRICIDAD AUTOMOTRIZ' },
    { nombre: 'PINTURA Y CARROCERÍA' },
    { nombre: 'AIRE ACONDICIONADO' },
    { nombre: 'ALINEACIÓN Y BALANCEO' },
    { nombre: 'DIAGNÓSTICO ELECTRÓNICO' },
  ]);
  console.log('  ✅ Especialidades (6)');

  // Métodos de pago
  await seedCatalogo(prisma.catMetodoPago, [
    { nombre: 'EFECTIVO' },
    { nombre: 'TARJETA DE DÉBITO' },
    { nombre: 'TARJETA DE CRÉDITO' },
    { nombre: 'TRANSFERENCIA BANCARIA' },
    { nombre: 'YAPE' },
    { nombre: 'PLIN' },
  ]);
  console.log('  ✅ Métodos de pago (6)');

  // Tipos de documento fiscal
  await seedCatalogo(prisma.catTipoDocFiscal, [
    { nombre: 'BOLETA DE VENTA' },
    { nombre: 'FACTURA' },
    { nombre: 'NOTA DE CRÉDITO' },
    { nombre: 'NOTA DE DÉBITO' },
  ]);
  console.log('  ✅ Tipos doc. fiscal (4)');

  // Unidades de medida
  await seedCatalogo(prisma.catUnidad, [
    { nombre: 'UNIDAD' },
    { nombre: 'LITRO' },
    { nombre: 'GALÓN' },
    { nombre: 'KILOGRAMO' },
    { nombre: 'METRO' },
    { nombre: 'JUEGO' },
    { nombre: 'PAR' },
  ]);
  console.log('  ✅ Unidades de medida (7)');

  // Motivos de descuento
  await seedCatalogo(prisma.catMotivoDescuento, [
    { nombre: 'CLIENTE FRECUENTE' },
    { nombre: 'PROMOCIÓN' },
    { nombre: 'DESCUENTO POR VOLUMEN' },
    { nombre: 'CORTESÍA' },
    { nombre: 'GARANTÍA' },
  ]);
  console.log('  ✅ Motivos de descuento (5)');

  // Categorías de repuestos
  await seedCatalogo(prisma.catCategoriaRepuesto, [
    { nombre: 'FILTROS' },
    { nombre: 'ACEITES Y LUBRICANTES' },
    { nombre: 'FRENOS' },
    { nombre: 'SUSPENSIÓN' },
    { nombre: 'MOTOR' },
    { nombre: 'TRANSMISIÓN' },
    { nombre: 'ELÉCTRICO' },
    { nombre: 'CARROCERÍA' },
    { nombre: 'LLANTAS Y AROS' },
    { nombre: 'REFRIGERACIÓN' },
  ]);
  console.log('  ✅ Categorías de repuesto (10)');

  console.log('📦 Catálogos completados\n');
}
