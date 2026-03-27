import { z } from 'zod';

const documentoRUC = z.string().regex(/^20\d{9}$/, 'El RUC debe tener 11 dígitos e iniciar con 20');
const documentoDNI = z.string().regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos');
const documentoPasaporte = z.string().regex(/^[A-Z0-9]{6,12}$/, 'Pasaporte: 6-12 caracteres alfanuméricos');
const documentoCE = z.string().regex(/^\d{9}$/, 'El CE debe tener 9 dígitos');

const clientePersonaSchema = z.object({
  tipoCliente: z.literal('PERSONA'),
  tipoDocumento: z.enum(['DNI', 'PASAPORTE', 'CE']),
  numeroDocumento: z.string().min(1, 'El número de documento es requerido'),
  nombres: z.string().min(1, 'Los nombres son requeridos').max(100),
  apellidoPaterno: z.string().min(1, 'El apellido paterno es requerido').max(100),
  apellidoMaterno: z.string().min(1, 'El apellido materno es requerido').max(100),
  telefono: z.string().min(1, 'El teléfono es requerido').max(20),
  direccion: z.string().min(1, 'La dirección es requerida'),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
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

const clienteEmpresaSchema = z.object({
  tipoCliente: z.literal('EMPRESA'),
  tipoDocumento: z.literal('RUC'),
  numeroDocumento: documentoRUC,
  razonSocial: z.string().min(1, 'La razón social es requerida').max(255),
  nombreComercial: z.string().max(255).optional().or(z.literal('')),
  direccion: z.string().min(1, 'La dirección fiscal es requerida'),
  telefono: z.string().min(1, 'El teléfono es requerido').max(20),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
  contactoNombres: z.string().min(1, 'Los nombres del contacto son requeridos').max(100),
  contactoApellidoPaterno: z.string().min(1, 'El apellido paterno del contacto es requerido').max(100),
  contactoApellidoMaterno: z.string().min(1, 'El apellido materno del contacto es requerido').max(100),
  contactoCargo: z.string().min(1, 'El cargo del contacto es requerido').max(100),
  contactoTelefono: z.string().min(1, 'El teléfono del contacto es requerido').max(20),
});

export const crearClienteSchema = z.union([
  clientePersonaSchema,
  clienteEmpresaSchema,
]);

export type CrearClientePersonaInput = z.infer<typeof clientePersonaSchema>;
export type CrearClienteEmpresaInput = z.infer<typeof clienteEmpresaSchema>;
export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
