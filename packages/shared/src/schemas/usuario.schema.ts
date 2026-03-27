import { z } from 'zod';

const documentoDNILogin = z.string().regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos numéricos');
const documentoPasaporteLogin = z.string().regex(/^[A-Za-z0-9]{6,12}$/, 'El pasaporte debe tener entre 6 y 12 caracteres alfanuméricos');
const documentoCELogin = z.string().regex(/^\d{9}$/, 'El CE debe tener exactamente 9 dígitos numéricos');

export const loginSchema = z.object({
  tipoDocumento: z.enum(['DNI', 'PASAPORTE', 'CE'], {
    required_error: 'Seleccione un tipo de documento',
  }),
  numeroDocumento: z.string().min(1, 'El número de documento es requerido'),
  clave: z.string().min(1, 'La contraseña es requerida'),
}).superRefine((data, ctx) => {
  if (data.tipoDocumento === 'DNI' && !documentoDNILogin.safeParse(data.numeroDocumento).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El DNI debe tener exactamente 8 dígitos numéricos', path: ['numeroDocumento'] });
  }
  if (data.tipoDocumento === 'PASAPORTE' && !documentoPasaporteLogin.safeParse(data.numeroDocumento).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El pasaporte debe tener entre 6 y 12 caracteres alfanuméricos', path: ['numeroDocumento'] });
  }
  if (data.tipoDocumento === 'CE' && !documentoCELogin.safeParse(data.numeroDocumento).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El CE debe tener exactamente 9 dígitos numéricos', path: ['numeroDocumento'] });
  }
});

export const cambiarClaveSchema = z.object({
  nuevaClave: z
    .string()
    .min(4, 'La contraseña debe tener al menos 4 caracteres'),
  confirmarClave: z.string().min(1, 'Confirma tu contraseña'),
}).refine((data) => data.nuevaClave === data.confirmarClave, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarClave'],
});

const documentoDNI = z.string().regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos');
const documentoPasaporte = z.string().regex(/^[A-Z0-9]{6,12}$/, 'Pasaporte: 6-12 caracteres alfanuméricos');
const documentoCE = z.string().regex(/^\d{9}$/, 'El CE debe tener 9 dígitos');

export const crearUsuarioSchema = z.object({
  tipoDocumento: z.enum(['DNI', 'PASAPORTE', 'CE']),
  numeroDocumento: z.string().min(1, 'El número de documento es requerido').max(12),
  nombres: z.string().min(1, 'Los nombres son requeridos').max(50, 'Máximo 50 caracteres'),
  apellidoPaterno: z.string()
    .min(1, 'El apellido paterno es requerido')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^\S+$/, 'El apellido debe ser una sola palabra, sin espacios'),
  apellidoMaterno: z.string()
    .min(1, 'El apellido materno es requerido')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^\S+$/, 'El apellido debe ser una sola palabra, sin espacios'),
  telefono: z.string()
    .min(1, 'El teléfono es requerido')
    .regex(/^9\d{8}$/, 'El teléfono debe iniciar con 9 y tener 9 dígitos'),
  direccion: z.string().min(1, 'La dirección es requerida').max(150, 'Máximo 150 caracteres'),
  correo: z.string().email('Correo inválido').max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  rolId: z.string().uuid('Rol inválido'),
  sucursalId: z.string().uuid('Sucursal inválida'),
}).superRefine((data, ctx) => {
  if (data.tipoDocumento === 'DNI' && !documentoDNI.safeParse(data.numeroDocumento).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El DNI debe tener 8 dígitos', path: ['numeroDocumento'] });
  }
  if (data.tipoDocumento === 'PASAPORTE' && !documentoPasaporte.safeParse(data.numeroDocumento).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pasaporte: 6-12 caracteres alfanuméricos', path: ['numeroDocumento'] });
  }
  if (data.tipoDocumento === 'CE' && !documentoCE.safeParse(data.numeroDocumento).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El CE debe tener 9 dígitos', path: ['numeroDocumento'] });
  }
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CambiarClaveInput = z.infer<typeof cambiarClaveSchema>;
export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
