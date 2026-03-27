import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashClave(clave: string): Promise<string> {
  return bcrypt.hash(clave, SALT_ROUNDS);
}

export async function compararClave(clave: string, hash: string): Promise<boolean> {
  return bcrypt.compare(clave, hash);
}
