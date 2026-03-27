import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { seedCatalogos } from './seed-catalogos.js';
import { seedServiciosRepuestos } from './seed-servicios-repuestos.js';

const prisma = new PrismaClient();

const ROLES_INICIALES = [
  { nombre: 'ADMIN', descripcion: 'Administrador del sistema - acceso total' },
  { nombre: 'GERENTE', descripcion: 'Gerente general - acceso a operaciones y reportes' },
  { nombre: 'SUPERVISOR', descripcion: 'Supervisor de taller - control de calidad' },
  { nombre: 'MECANICO', descripcion: 'Mecánico - ejecuta órdenes de trabajo' },
  { nombre: 'RECEPCIONISTA', descripcion: 'Recepcionista - atención al cliente y facturación' },
  { nombre: 'ALMACEN', descripcion: 'Almacén - control de inventario y repuestos' },
  { nombre: 'CONTABILIDAD', descripcion: 'Contabilidad - facturación y reportes financieros' },
];

const PERMISOS_POR_ROL: Record<string, Record<string, { crear: boolean; leer: boolean; editar: boolean; eliminar: boolean }>> = {
  ADMIN: {
    DASHBOARD: { crear: true, leer: true, editar: true, eliminar: true },
    VEHICULOS_CLIENTES: { crear: true, leer: true, editar: true, eliminar: true },
    ORDENES_TRABAJO: { crear: true, leer: true, editar: true, eliminar: true },
    SERVICIOS_CATALOGO: { crear: true, leer: true, editar: true, eliminar: true },
    AGENDA_CITAS: { crear: true, leer: true, editar: true, eliminar: true },
    INVENTARIO: { crear: true, leer: true, editar: true, eliminar: true },
    FACTURACION: { crear: true, leer: true, editar: true, eliminar: true },
    REPORTES: { crear: true, leer: true, editar: true, eliminar: true },
    USUARIOS: { crear: true, leer: true, editar: true, eliminar: true },
    CONFIGURACION: { crear: true, leer: true, editar: true, eliminar: true },
  },
  GERENTE: {
    DASHBOARD: { crear: true, leer: true, editar: true, eliminar: true },
    VEHICULOS_CLIENTES: { crear: true, leer: true, editar: true, eliminar: true },
    ORDENES_TRABAJO: { crear: true, leer: true, editar: true, eliminar: true },
    SERVICIOS_CATALOGO: { crear: true, leer: true, editar: true, eliminar: true },
    AGENDA_CITAS: { crear: true, leer: true, editar: true, eliminar: true },
    INVENTARIO: { crear: true, leer: true, editar: true, eliminar: true },
    FACTURACION: { crear: true, leer: true, editar: true, eliminar: true },
    REPORTES: { crear: true, leer: true, editar: true, eliminar: true },
  },
  SUPERVISOR: {
    DASHBOARD: { crear: true, leer: true, editar: true, eliminar: true },
    VEHICULOS_CLIENTES: { crear: true, leer: true, editar: true, eliminar: true },
    ORDENES_TRABAJO: { crear: true, leer: true, editar: true, eliminar: true },
    SERVICIOS_CATALOGO: { crear: false, leer: true, editar: false, eliminar: false },
    AGENDA_CITAS: { crear: true, leer: true, editar: true, eliminar: true },
    INVENTARIO: { crear: false, leer: true, editar: false, eliminar: false },
    REPORTES: { crear: false, leer: true, editar: false, eliminar: false },
  },
  MECANICO: {
    DASHBOARD: { crear: true, leer: true, editar: true, eliminar: true },
    VEHICULOS_CLIENTES: { crear: false, leer: true, editar: false, eliminar: false },
    ORDENES_TRABAJO: { crear: true, leer: true, editar: true, eliminar: true },
    SERVICIOS_CATALOGO: { crear: false, leer: true, editar: false, eliminar: false },
    AGENDA_CITAS: { crear: false, leer: true, editar: false, eliminar: false },
  },
  RECEPCIONISTA: {
    DASHBOARD: { crear: true, leer: true, editar: true, eliminar: true },
    VEHICULOS_CLIENTES: { crear: true, leer: true, editar: true, eliminar: true },
    ORDENES_TRABAJO: { crear: true, leer: true, editar: true, eliminar: true },
    SERVICIOS_CATALOGO: { crear: false, leer: true, editar: false, eliminar: false },
    AGENDA_CITAS: { crear: true, leer: true, editar: true, eliminar: true },
    FACTURACION: { crear: true, leer: true, editar: true, eliminar: true },
  },
  ALMACEN: {
    DASHBOARD: { crear: true, leer: true, editar: true, eliminar: true },
    ORDENES_TRABAJO: { crear: false, leer: true, editar: false, eliminar: false },
    INVENTARIO: { crear: true, leer: true, editar: true, eliminar: true },
    REPORTES: { crear: false, leer: true, editar: false, eliminar: false },
  },
  CONTABILIDAD: {
    DASHBOARD: { crear: true, leer: true, editar: true, eliminar: true },
    FACTURACION: { crear: true, leer: true, editar: true, eliminar: true },
    REPORTES: { crear: true, leer: true, editar: true, eliminar: true },
  },
};

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Crear sucursal principal
  const sucursal = await prisma.sucursal.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Sede Principal',
      direccion: 'Av. Principal 123',
      telefono: '01 234 5678',
      esPrincipal: true,
    },
  });
  console.log(`✅ Sucursal: ${sucursal.nombre}`);

  // 2. Crear roles y permisos
  for (const rolData of ROLES_INICIALES) {
    const rol = await prisma.rol.upsert({
      where: { nombre: rolData.nombre },
      update: { descripcion: rolData.descripcion },
      create: rolData,
    });

    const permisos = PERMISOS_POR_ROL[rolData.nombre];
    if (permisos) {
      for (const [modulo, perm] of Object.entries(permisos)) {
        const existente = await prisma.permisoRol.findFirst({
          where: { rolId: rol.id, modulo },
        });
        if (!existente) {
          await prisma.permisoRol.create({
            data: {
              rolId: rol.id,
              modulo,
              puedeCrear: perm.crear,
              puedeLeer: perm.leer,
              puedeEditar: perm.editar,
              puedeEliminar: perm.eliminar,
            },
          });
        }
      }
    }
    console.log(`✅ Rol: ${rol.nombre} (${Object.keys(permisos || {}).length} permisos)`);
  }

  // 3. Crear usuario admin
  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } });
  if (!rolAdmin) throw new Error('Rol ADMIN no encontrado');

  const adminExiste = await prisma.usuario.findUnique({
    where: { numeroDocumento: '00000000' },
  });

  if (!adminExiste) {
    const claveHash = await bcrypt.hash('00000000', 10);
    const admin = await prisma.usuario.create({
      data: {
        nombres: 'Administrador',
        apellidoPaterno: 'Sistema',
        apellidoMaterno: 'AutoTaller',
        tipoDocumento: 'DNI',
        numeroDocumento: '00000000',
        telefono: '999999999',
        direccion: 'Sistema',
        correo: 'admin@autotaller.com',
        claveHash,
        debeCambiarClave: true,
        primerInicio: true,
        rolId: rolAdmin.id,
        sucursalId: sucursal.id,
      },
    });
    console.log(`✅ Usuario admin: ${admin.nombres} (DNI: ${admin.numeroDocumento}, clave: 00000000)`);
  } else {
    console.log('ℹ️  Usuario admin ya existe');
  }

  // 4. Configuración del sistema por defecto
  const configDefaults = [
    { clave: 'tema.primario', valor: '#f97316', grupo: 'apariencia', descripcion: 'Color primario del tema' },
    { clave: 'tema.hover', valor: '#ea580c', grupo: 'apariencia', descripcion: 'Color hover del tema' },
    { clave: 'tema.sidebar', valor: '#0f172a', grupo: 'apariencia', descripcion: 'Color del sidebar' },
    { clave: 'tema.nombre', valor: 'naranja', grupo: 'apariencia', descripcion: 'Nombre del tema activo' },
    { clave: 'empresa.nombre', valor: 'AutoTaller Pro', grupo: 'empresa', descripcion: 'Nombre del taller' },
    { clave: 'empresa.ruc', valor: '', grupo: 'empresa', descripcion: 'RUC del taller' },
    { clave: 'empresa.direccion', valor: '', grupo: 'empresa', descripcion: 'Dirección fiscal' },
    { clave: 'formato.ordenTrabajo', valor: 'OT-{AAAA}-{NNNN}', grupo: 'formatos', descripcion: 'Formato de número de OT' },
    { clave: 'formato.factura', valor: 'FAC-{AAAA}-{NNNN}', grupo: 'formatos', descripcion: 'Formato de número de factura' },
    { clave: 'formato.cotizacion', valor: 'COT-{AAAA}-{NNNN}', grupo: 'formatos', descripcion: 'Formato de número de cotización' },
    { clave: 'formato.cita', valor: 'CIT-{AAAA}-{NNNN}', grupo: 'formatos', descripcion: 'Formato de número de cita' },
    { clave: 'moneda.codigo', valor: 'PEN', grupo: 'regional', descripcion: 'Código de moneda' },
    { clave: 'moneda.simbolo', valor: 'S/', grupo: 'regional', descripcion: 'Símbolo de moneda' },
    { clave: 'notificacion.recordatorioDias', valor: '7', grupo: 'notificaciones', descripcion: 'Días antes para recordatorio de mantenimiento' },
  ];

  for (const config of configDefaults) {
    await prisma.configuracionSistema.upsert({
      where: { clave: config.clave },
      update: {},
      create: {
        clave: config.clave,
        valor: JSON.parse(JSON.stringify(config.valor)),
        grupo: config.grupo,
        descripcion: config.descripcion,
      },
    });
  }
  console.log(`✅ Configuración del sistema: ${configDefaults.length} parámetros`);

  // 5. Catálogos maestros
  await seedCatalogos();

  // 6. Servicios y repuestos
  await seedServiciosRepuestos();

  console.log('🎉 Seed completado exitosamente');
  console.log('📌 Login: DNI 00000000 / Clave: 00000000');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
