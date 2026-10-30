import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { API_BASE_URL } from '../lib/api'

export type AuthUser = { id: number; name: string; email: string }
type TokenResponse = {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_in: number
}
type ApiEnvelope<T> = { success: boolean; message?: string; data?: T; errors?: Record<string, string[]> }

export class ApiRequestError extends Error {
  readonly status: number
  readonly errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
    this.name = 'ApiRequestError'
  }
}

const keys = {
  accessToken: 'orderly-access-token',
  refreshToken: 'orderly-refresh-token',
  expiresAt: 'orderly-access-expiry',
  user: 'orderly-user',
}

function readStorage(key: string): string | null {
  try { return sessionStorage.getItem(key) } catch { return null }
}

function readStoredUser(): AuthUser | null {
  try {
    const value = readStorage(keys.user)
    return value ? JSON.parse(value) as AuthUser : null
  } catch { return null }
}

async function readEnvelope<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as ApiEnvelope<T>
  if (!response.ok || body.success === false) {
    throw new ApiRequestError(body.message || 'Permintaan gagal. Silakan coba lagi.', response.status, body.errors)
  }
  return body.data as T
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(readStorage(keys.accessToken))
  const refreshToken = ref(readStorage(keys.refreshToken))
  const expiresAt = ref(Number(readStorage(keys.expiresAt) || 0))
  const user = ref<AuthUser | null>(readStoredUser())
  const sessionCheckedAt = ref(0)
  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))

  function persistSession(tokens: TokenResponse) {
    accessToken.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    expiresAt.value = Date.now() + tokens.expires_in * 1000
    user.value = tokens.user
    sessionCheckedAt.value = Date.now()
    try {
      sessionStorage.setItem(keys.accessToken, tokens.access_token)
      sessionStorage.setItem(keys.refreshToken, tokens.refresh_token)
      sessionStorage.setItem(keys.expiresAt, String(expiresAt.value))
      sessionStorage.setItem(keys.user, JSON.stringify(tokens.user))
    } catch {
      // Keep the session active in memory if browser storage is unavailable.
    }
  }

  function clearSession() {
    accessToken.value = null
    refreshToken.value = null
    expiresAt.value = 0
    user.value = null
    sessionCheckedAt.value = 0
    try { Object.values(keys).forEach((key) => sessionStorage.removeItem(key)) } catch { /* ignore unavailable storage */ }
  }

  async function login(email: string, password: string) {
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      throw new ApiRequestError('Tidak dapat terhubung ke server. Pastikan backend berjalan.', 0)
    }
    const tokens = await readEnvelope<TokenResponse>(response)
    persistSession(tokens)
    return tokens.user
  }

  async function refreshSession() {
    if (!refreshToken.value) throw new ApiRequestError('Sesi berakhir. Silakan masuk kembali.', 401)
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken.value }),
      })
    } catch {
      throw new ApiRequestError('Tidak dapat terhubung ke server untuk memperbarui sesi.', 0)
    }
    const tokens = await readEnvelope<TokenResponse>(response)
    persistSession(tokens)
  }

  async function refreshAccessToken() {
    try {
      await refreshSession()
    } catch (error) {
      if (!(error instanceof ApiRequestError && error.status === 0)) clearSession()
      throw error
    }
  }

  async function fetchProfile() {
    if (!accessToken.value) throw new ApiRequestError('Sesi berakhir. Silakan masuk kembali.', 401)
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken.value}`, Accept: 'application/json' },
      })
    } catch {
      throw new ApiRequestError('Tidak dapat terhubung ke server untuk memeriksa sesi.', 0)
    }
    const profile = await readEnvelope<AuthUser>(response)
    user.value = profile
    sessionCheckedAt.value = Date.now()
    try { sessionStorage.setItem(keys.user, JSON.stringify(profile)) } catch { /* keep profile in memory */ }
  }

  async function restoreSession() {
    if (!accessToken.value || !user.value) return false
    if (expiresAt.value > Date.now() + 15_000 && sessionCheckedAt.value > Date.now() - 30_000) return true
    try {
      if (expiresAt.value <= Date.now() + 15_000) await refreshSession()
      await fetchProfile()
      return true
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 0) {
        return expiresAt.value > Date.now() + 15_000
      }
      if (error instanceof ApiRequestError && error.status === 401 && refreshToken.value) {
        try {
          await refreshSession()
          await fetchProfile()
          return true
        } catch (refreshError) {
          if (refreshError instanceof ApiRequestError && refreshError.status === 0) return false
        }
      }
      clearSession()
      return false
    }
  }

  async function logout() {
    try {
      if (accessToken.value && expiresAt.value <= Date.now() + 15_000) await refreshSession()
      if (accessToken.value) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken.value}` },
        })
      }
    } finally {
      clearSession()
    }
  }

  return { accessToken, user, isAuthenticated, login, logout, refreshAccessToken, restoreSession }
})
