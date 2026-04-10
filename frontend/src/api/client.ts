const API_BASE = '/api/v1'
const REQUEST_TIMEOUT_MS = 30_000

function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('auth_token')
}

let onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your connection and try again.', 0)
    }
    throw new ApiError('Network error. Please check your internet connection.', 0)
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) {
      clearToken()
      onUnauthorized?.()
    }
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiError(body.error || 'Request failed', res.status)
  }

  return res.json()
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string; role?: string; admin_code?: string }) =>
      request<{ user: import('../types').User }>('/auth/register', {
        method: 'POST', body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ user: import('../types').User; token: string }>('/auth/login', {
        method: 'POST', body: JSON.stringify(data),
      }),
    me: () => request<import('../types').MeResponse>('/auth/me'),
  },
  plans: {
    list: () => request<{ plans: import('../types').MembershipPlan[] }>('/plans'),
  },
  purchases: {
    create: (data: { plan_id: number; card_token: string; replace_existing?: boolean }) =>
      request<{ membership: import('../types').UserMembership; transaction_id: string }>('/purchases', {
        method: 'POST', body: JSON.stringify(data),
      }),
  },
  conversations: {
    list: () => request<{ conversations: import('../types').Conversation[] }>('/conversations'),
    get: (id: number) =>
      request<{ conversation: import('../types').Conversation; messages: import('../types').Message[] }>(`/conversations/${id}`),
    create: (topic?: string) =>
      request<{ conversation: import('../types').Conversation; message: import('../types').Message }>('/conversations', {
        method: 'POST', body: JSON.stringify({ topic }),
      }),
  },
  messages: {
    create: (conversationId: number, data: { text?: string; audio?: Blob }) => {
      if (data.audio) {
        const form = new FormData()
        form.append('audio', data.audio, 'recording.webm')
        return request<{ user_message: import('../types').Message; ai_message: import('../types').Message }>(
          `/conversations/${conversationId}/messages`, { method: 'POST', body: form }
        )
      }
      return request<{ user_message: import('../types').Message; ai_message: import('../types').Message }>(
        `/conversations/${conversationId}/messages`, {
          method: 'POST', body: JSON.stringify({ text: data.text }),
        }
      )
    },
  },
  admin: {
    users: {
      list: () => request<{ users: import('../types').AdminUser[] }>('/admin/users'),
    },
    memberships: {
      list: (params?: { user_id?: number; status?: string }) => {
        const query = new URLSearchParams()
        if (params?.user_id) query.set('user_id', String(params.user_id))
        if (params?.status) query.set('status', params.status)
        const qs = query.toString()
        return request<{ memberships: import('../types').AdminMembership[] }>(
          `/admin/memberships${qs ? `?${qs}` : ''}`
        )
      },
      create: (data: { user_id: number; plan_id: number }) =>
        request<{ membership: import('../types').UserMembership }>('/admin/memberships', {
          method: 'POST', body: JSON.stringify(data),
        }),
      update: (id: number, data: { plan_id: number }) =>
        request<{ membership: import('../types').UserMembership }>(`/admin/memberships/${id}`, {
          method: 'PATCH', body: JSON.stringify(data),
        }),
      destroy: (id: number) =>
        request<{ message: string }>(`/admin/memberships/${id}`, { method: 'DELETE' }),
    },
  },
}
