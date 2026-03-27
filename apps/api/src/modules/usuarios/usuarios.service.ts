import { prisma } from '../../core/database/prisma.js';
import { hashClave } from '../../core/auth/password.js';
import { AppError } from '../../core/errors/AppError.js';

interface CrearUsuarioData {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  direccion: string;
  correo?: string;
  rolId: string;
  sucursalId: string;
}

interface ActualizarUsuarioData {
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  telefono?: string;
  direccion?: string;
  correo?: string;
  rolId?: string;
  sucursalId?: string;
}

export async function listarUsuarios(pagina = 1, porPagina = 10, busqueda?: string) {
  const skip = (pagina - 1) * porPagina;

  const where = busqueda
    ? {
        OR: [
          { nombres: { contains: busqueda, mode: 'insensitive' as const } },
          { apellidoPaterno: { contains: busqueda, mode: 'insensitive' as const } },
          { apellidoMaterno: { contains: busqueda, mode: 'insensitive' as const } },
          { numeroDocumento: { contains: busqueda } },
        ],
      }
    : {};

  const [usuarios, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      include: { rol: true, sucursal: true },
      skip,
      take: porPagina,
      orderBy: { creadoEn: 'desc' },
    }),
    prisma.usuario.count({ where }),
  ]);

  return {
    datos: usuarios.map((u) => ({
      id: u.id,
      nombres: u.nombres,
      apellidoPaterno: u.apellidoPaterno,
      apellidoMaterno: u.apellidoMaterno,
      tipoDocumento: u.tipoDocumento,
      numeroDocumento: u.numeroDocumento,
      telefono: u.telefono,
      direccion: u.direccion,
      correo: u.correo,
      rol: u.rol.nombre,
      rolId: u.rolId,
      sucursal: u.sucursal.nombre,
      sucursalId: u.sucursalId,
      activo: u.activo,
      debeCambiarClave: u.debeCambiarClave,
      creadoEn: u.creadoEn,
    })),
    total,
    pagina,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
  };
}

export async function obtenerUsuario(id: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { rol: true, sucursal: true },
  });

  if (!usuario) throw new AppError(404, 'Usuario no encontrado');

  return {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidoPaterno: usuario.apellidoPaterno,
    apellidoMaterno: usuario.apellidoMaterno,
    tipoDocumento: usuario.tipoDocumento,
    numeroDocumento: usuario.numeroDocumento,
    telefono: usuario.telefono,
    direccion: usuario.direccion,
    correo: usuario.correo,
    rol: usuario.rol.nombre,
    rolId: usuario.rolId,
    sucursal: usuario.sucursal.nombre,
    sucursalId: usuario.sucursalId,
    activo: usuario.activo,
    debeCambiarClave: usuario.debeCambiarClave,
    creadoEn: usuario.creadoEn,
  };
}

export async function crearUsuario(data: CrearUsuarioData) {
  const existe = await prisma.usuario.findUnique({
    where: { numeroDocumento: data.numeroDocumento },
  });
  if (existe) {
    throw new AppError(409, 'Ya existe un usuario con ese número de documento');
  }

  const rol = await prisma.rol.findUnique({ where: { id: data.rolId } });
  if (!rol) throw new AppError(400, 'Rol no válido');

  const sucursal = await prisma.sucursal.findUnique({ where: { id: data.sucursalId } });
  if (!sucursal) throw new AppError(400, 'Sucursal no válida');

  const claveHash = await hashClave(data.numeroDocumento);

  const usuario = await prisma.usuario.create({
    data: {
      ...data,
      correo: data.correo || null,
      claveHash,
      debeCambiarClave: true,
      primerInicio: true,
    },
    include: { rol: true, sucursal: true },
  });

  return {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidoPaterno: usuario.apellidoPaterno,
    apellidoMaterno: usuario.apellidoMaterno,
    tipoDocumento: usuario.tipoDocumento,
    numeroDocumento: usuario.numeroDocumento,
    rol: usuario.rol.nombre,
    sucursal: usuario.sucursal.nombre,
    claveTemporal: data.numeroDocumento,
  };
}

export async function actualizarUsuario(id: string, data: ActualizarUsuarioData) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new AppError(404, 'Usuario no encontrado');

  if (data.rolId) {
    const rol = await prisma.rol.findUnique({ where: { id: data.rolId } });
    if (!rol) throw new AppError(400, 'Rol no válido');
  }

  if (data.sucursalId) {
    const sucursal = await prisma.sucursal.findUnique({ where: { id: data.sucursalId } });
    if (!sucursal) throw new AppError(400, 'Sucursal no válida');
  }

  const actualizado = await prisma.usuario.update({
    where: { id },
    data: { ...data, correo: data.correo || null },
    include: { rol: true, sucursal: true },
  });

  return {
    id: actualizado.id,
    nombres: actualizado.nombres,
    apellidoPaterno: actualizado.apellidoPaterno,
    apellidoMaterno: actualizado.apellidoMaterno,
    rol: actualizado.rol.nombre,
    sucursal: actualizado.sucursal.nombre,
  };
}

export async function toggleActivoUsuario(id: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new AppError(404, 'Usuario no encontrado');

  const actualizado = await prisma.usuario.update({
    where: { id },
    data: { activo: !usuario.activo },
  });

  return { id: actualizado.id, activo: actualizado.activo };
}

export async function resetearClave(id: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new AppError(404, 'Usuario no encontrado');

  const claveHash = await hashClave(usuario.numeroDocumento);

  await prisma.usuario.update({
    where: { id },
    data: { claveHash, debeCambiarClave: true, primerInicio: true },
  });

  return { mensaje: 'Clave reseteada al número de documento', claveTemporal: usuario.numeroDocumento };
}

export async function listarRoles() {
  return prisma.rol.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  });
}

export async function listarSucursales() {
  return prisma.sucursal.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  });
}
