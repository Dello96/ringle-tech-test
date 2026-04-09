import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User, UserMembership } from '../types'
import { api, setToken, clearToken } from '../api/client'

interface AuthState {
  user: User | null
  membership: UserMembership | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [membership, setMembership] = useState<UserMembership | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.auth.me()
      setUser(data.user)
      setMembership(data.membership)
    } catch {
      setUser(null)
      setMembership(null)
      clearToken()
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      refresh().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [refresh])

  const login = async (email: string, password: string) => {
    const data = await api.auth.login({ email, password })
    setToken(data.token)
    setUser(data.user)
    await refresh()
  }

  const register = async (email: string, password: string, name: string) => {
    const data = await api.auth.register({ email, password, name })
    setToken(data.token)
    setUser(data.user)
    await refresh()
  }

  const logout = () => {
    clearToken()
    setUser(null)
    setMembership(null)
  }

  return (
    <AuthContext.Provider value={{ user, membership, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
