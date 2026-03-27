import { useAuthStore } from '@/stores/auth.store';

const API_URL = '/api';

let refreshingPromise: Promise<boolean> | null = null;

async function intentarRefresh(): Promise<boolean> {
  const { refreshToken, setAuth, usuario, logout } = useAuthStore.getState();
  if (!refreshToken || !usuario) {
    logout();
    return false;
  }

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      logout();
      return false;
    }

    const data = await res.json();
    setAuth(data.token, data.refreshToken, usuario);
    return true;
  } catch {
    logout();
    return false;
  }
}

async function fetchAPI<T>(url: string, options: RequestInit = {}, reintento = false): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const esRutaPublica = url.startsWith('/auth/login') || url.startsWith('/auth/refresh');

  if (res.status === 401 && !reintento && !esRutaPublica) {
    if (!refreshingPromise) {
      refreshingPromise = intentarRefresh().finally(() => { refreshingPromise = null; });
    }

    const refreshOk = await refreshingPromise;
    if (refreshOk) {
      return fetchAPI<T>(url, options, true);
    }

    throw new Error('Sesión expirada. Inicie sesión nuevamente.');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || `Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(url: string) => fetchAPI<T>(url),
  post: <T>(url: string, body: unknown) =>
    fetchAPI<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    fetchAPI<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body?: unknown) =>
    fetchAPI<T>(url, {
      method: 'PATCH',
      ...(body && { body: JSON.stringify(body) }),
    }),
  delete: <T>(url: string) =>
    fetchAPI<T>(url, { method: 'DELETE' }),
};
