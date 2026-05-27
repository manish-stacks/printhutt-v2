/**
 * Centralized axios instance for the extracted backend.
 *
 * Behaviour preserved from the original frontend:
 *   - Response interceptor unwraps `response.data` automatically so callers
 *     can do `const result = await axiosInstance.get(...)` and use `result`
 *     directly as the JSON body. TypeScript callers receive `<T>` directly
 *     instead of `AxiosResponse<T>`.
 *
 * New behaviour:
 *   - withCredentials: true — sends httpOnly cookies (access_token / refresh_token / token).
 *   - On 401, automatically calls /auth/refresh once and retries the original
 *     request transparently. Concurrent 401s queue up until refresh completes.
 *   - Error normalization preserved — error.message carries the server message.
 */
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ── Type override ────────────────────────────────────────────────────────
// Our interceptor returns `response.data`, so each verb resolves directly
// to T (the body) instead of `AxiosResponse<T>`. We re-declare the verb
// signatures so consumers get the right inferred type.
interface UnwrappedAxios extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options'> {
  <T = unknown>(config: AxiosRequestConfig): Promise<T>;
  <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  head<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  options<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

const _axios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const axiosInstance = _axios as unknown as UnwrappedAxios;

/* ── In-memory access token (mobile/SSR clients) ─────────────────── */
let inMemoryAccessToken: string | null = null;
export const setAccessToken = (t: string | null): void => {
  inMemoryAccessToken = t;
};

_axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (inMemoryAccessToken) {
    config.headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }
  return config;
});

/* ── Response interceptor: unwrap + auto-refresh on 401 ─────────── */
interface PendingItem {
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}
let isRefreshing = false;
let pending: PendingItem[] = [];

const drainQueue = (err: unknown, token: string | null): void => {
  pending.forEach((p) => (err ? p.reject(err) : p.resolve(token)));
  pending = [];
};

_axios.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // Preserve error message handling
    const message =
      (error.response?.data as { message?: string; error?: string } | undefined)?.message ||
      (error.response?.data as { message?: string; error?: string } | undefined)?.error ||
      error.message ||
      'An unexpected error occurred';
    error.message = message;

    const url = original?.url ?? '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/admin-login') ||
      url.includes('/auth/verify-otp') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/signup');

    if (error.response?.status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pending.push({
          resolve: (token) => {
            if (token) {
              original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            }
            resolve(_axios(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshRes = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newToken = (refreshRes.data as { accessToken?: string }).accessToken ?? null;
      if (newToken) setAccessToken(newToken);
      drainQueue(null, newToken);
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
      }
      return _axios(original);
    } catch (refreshErr) {
      drainQueue(refreshErr, null);
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
