import { ApiRequestError, useAuthStore } from '../stores/auth'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '')

type ApiEnvelope<T> = {
  success: boolean
  data?: T
  meta?: Record<string, unknown>
  message?: string
  errors?: Record<string, string[]>
}

async function readResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T
  const envelope = await response.json().catch(() => ({})) as ApiEnvelope<T>
  if (!response.ok || envelope.success === false) {
    throw new ApiRequestError(envelope.message || 'Permintaan gagal. Silakan coba lagi.', response.status, envelope.errors)
  }
  if (envelope.meta) return { data: envelope.data, meta: envelope.meta } as T
  return envelope.data as T
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = useAuthStore()
  const send = () => fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
      ...init.headers,
    },
  })

  let response: Response
  try {
    response = await send()
  } catch {
    throw new ApiRequestError('Tidak dapat terhubung ke server. Periksa koneksi backend.', 0)
  }

  if (response.status === 401 && auth.accessToken) {
    try {
      await auth.refreshAccessToken()
    } catch (error) {
      window.dispatchEvent(new Event('auth:expired'))
      throw error
    }
    try {
      response = await send()
    } catch {
      throw new ApiRequestError('Tidak dapat terhubung ke server. Periksa koneksi backend.', 0)
    }
  }

  if (response.status === 401) window.dispatchEvent(new Event('auth:expired'))

  return readResponse<T>(response)
}
