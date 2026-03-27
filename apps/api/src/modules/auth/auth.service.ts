import { prisma } from '../../core/database/prisma.js';
import { compararClave, hashClave } from '../../core/auth/password.js';
import { generarToken, generarRefreshToken, verificarToken } from '../../core/auth/jwt.js';
import { AppError } from '../../core/errors/AppError.js';

export async function login(numeroDocumento: string, clave: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { numeroDocumento },
    include: { rol: true, sucursal: true },
  });

  if (!usuario || !usuario.activo) {
    throw new AppError(401, 'El número de documento o la contraseña no son correctos. Por favor, verifique e intente nuevamente.');
  }

  const claveValida = await compararClave(clave, usuario.claveHash);
  if (!claveValida) {
    throw new AppError(401, 'El número de documento o la contraseña no son correctos. Por favor, verifique e intente nuevamente.');
  }

  const token = generarToken({
    sub: usuario.id,
    rol: usuario.rol.nombre,
    debeCambiarClave: usuario.debeCambiarClave,
  });

  const refreshToken = generarRefreshToken({ sub: usuario.id });

  return {
    token,
    refreshToken,
    usuario: {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidoPaterno: usuario.apellidoPaterno,
      apellidoMaterno: usuario.apellidoMaterno,
      correo: usuario.correo,
      rol: usuario.rol.nombre,
      sucursalId: usuario.sucursalId,
      sucursalNombre: usuario.sucursal.nombre,
      debeCambiarClave: usuario.debeCambiarClave,
    },
  };
}

export async function cambiarClave(usuarioId: string, nuevaClave: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw new AppError(404, 'Usuario no encontrado');

  const esIgualATemporal = await compararClave(nuevaClave, usuario.claveHash);
  if (esIgualATemporal) {
    throw new AppError(400, 'La nueva contraseña no puede ser igual a la temporal');
  }

  const nuevaClaveHash = await hashClave(nuevaClave);

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      claveHash: nuevaClaveHash,
      debeCambiarClave: false,
      primerInicio: false,
    },
  });

  const usuarioActualizado = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { rol: true },
  });

  const token = generarToken({
    sub: usuarioId,
    rol: usuarioActualizado!.rol.nombre,
    debeCambiarClave: false,
  });

  const refreshToken = generarRefreshToken({ sub: usuarioId });

  return { token, refreshToken };
}

export async function refreshTokenService(tokenActual: string) {
  try {
    const payload = verificarToken(tokenActual);
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: { rol: true },
    });

    if (!usuario || !usuario.activo) {
      throw new AppError(401, 'Usuario no válido');
    }

    const token = generarToken({
      sub: usuario.id,
      rol: usuario.rol.nombre,
      debeCambiarClave: usuario.debeCambiarClave,
    });

    const refreshToken = generarRefreshToken({ sub: usuario.id });

    return { token, refreshToken };
  } catch {
    throw new AppError(401, 'Refresh token inválido');
  }
}

export async function obtenerPerfil(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: {
      rol: { include: { permisos: true } },
      sucursal: true,
    },
  });

  if (!usuario) throw new AppError(404, 'Usuario no encontrado');

  return {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidoPaterno: usuario.apellidoPaterno,
    apellidoMaterno: usuario.apellidoMaterno,
    correo: usuario.correo,
    telefono: usuario.telefono,
    rol: usuario.rol.nombre,
    sucursalId: usuario.sucursalId,
    sucursalNombre: usuario.sucursal.nombre,
    debeCambiarClave: usuario.debeCambiarClave,
    permisos: usuario.rol.permisos.map((p) => ({
      modulo: p.modulo,
      puedeCrear: p.puedeCrear,
      puedeLeer: p.puedeLeer,
      puedeEditar: p.puedeEditar,
      puedeEliminar: p.puedeEliminar,
    })),
  };
}
