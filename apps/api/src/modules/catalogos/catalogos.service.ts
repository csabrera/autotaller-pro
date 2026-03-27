import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/AppError.js';

const CATALOGOS_VALIDOS: Record<string, any> = {
  marcas: prisma.catMarca,
  modelos: prisma.catModelo,
  'tipos-vehiculo': prisma.catTipoVehiculo,
  colores: prisma.catColor,
  combustibles: prisma.catCombustible,
  transmisiones: prisma.catTransmision,
  'categorias-servicio': prisma.catCategoriaServicio,
  especialidades: prisma.catEspecialidad,
  'metodos-pago': prisma.catMetodoPago,
  'tipos-doc-fiscal': prisma.catTipoDocFiscal,
  unidades: prisma.catUnidad,
  'motivos-descuento': prisma.catMotivoDescuento,
  'categorias-repuesto': prisma.catCategoriaRepuesto,
};

// Catálogos que tienen relaciones extra
const CATALOGOS_CON_INCLUDE: Record<string, object> = {
  modelos: { marca: true },
};

// Catálogos que necesitan campos extra al crear
const CATALOGOS_CAMPOS_EXTRA = ['modelos', 'marcas'];

function getModelo(catalogo: string) {
  const modelo = CATALOGOS_VALIDOS[catalogo];
  if (!modelo) throw new AppError(400, `Catálogo "${catalogo}" no es válido`);
  return modelo;
}

export function catalogosDisponibles() {
  return Object.keys(CATALOGOS_VALIDOS);
}

export async function listarCatalogo(catalogo: string, filtro?: { activo?: string; busqueda?: string }) {
  const modelo = getModelo(catalogo);
  const include = CATALOGOS_CON_INCLUDE[catalogo];

  const where: any = {};
  if (filtro?.activo === 'true') where.activo = true;
  if (filtro?.activo === 'false') where.activo = false;
  if (filtro?.busqueda) {
    where.nombre = { contains: filtro.busqueda, mode: 'insensitive' };
  }

  return modelo.findMany({
    where,
    ...(include && { include }),
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
  });
}

export async function obtenerCatalogoItem(catalogo: string, id: string) {
  const modelo = getModelo(catalogo);
  const include = CATALOGOS_CON_INCLUDE[catalogo];

  const item = await modelo.findUnique({
    where: { id },
    ...(include && { include }),
  });
  if (!item) throw new AppError(404, 'Registro no encontrado');
  return item;
}

export async function crearCatalogoItem(catalogo: string, data: any) {
  const modelo = getModelo(catalogo);

  const createData: any = {
    nombre: data.nombre,
    descripcion: data.descripcion || null,
    orden: data.orden ?? 0,
  };

  // Campos extra según catálogo
  if (catalogo === 'marcas' && data.pais) createData.pais = data.pais;
  if (catalogo === 'modelos' && data.marcaId) createData.marcaId = data.marcaId;

  try {
    return await modelo.create({ data: createData });
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw new AppError(409, `Ya existe un registro con el nombre "${data.nombre}"`);
    }
    throw err;
  }
}

export async function actualizarCatalogoItem(catalogo: string, id: string, data: any) {
  const modelo = getModelo(catalogo);

  const item = await modelo.findUnique({ where: { id } });
  if (!item) throw new AppError(404, 'Registro no encontrado');

  const updateData: any = {};
  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion || null;
  if (data.orden !== undefined) updateData.orden = data.orden;
  if (catalogo === 'marcas' && data.pais !== undefined) updateData.pais = data.pais;

  try {
    return await modelo.update({ where: { id }, data: updateData });
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw new AppError(409, `Ya existe un registro con el nombre "${data.nombre}"`);
    }
    throw err;
  }
}

export async function toggleActivoCatalogo(catalogo: string, id: string) {
  const modelo = getModelo(catalogo);

  const item = await modelo.findUnique({ where: { id } });
  if (!item) throw new AppError(404, 'Registro no encontrado');

  return modelo.update({
    where: { id },
    data: { activo: !item.activo },
  });
}
