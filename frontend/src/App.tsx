import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { PlansPage } from './pages/PlansPage'
import { ConversationListPage } from './pages/ConversationListPage'
import { ConversationPage } from './pages/ConversationPage'
import { AdminPage } from './pages/AdminPage'
import { FeatureStubPage } from './pages/FeatureStubPage'
import type { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>
  return user ? <>{children}</> : <Navigate to="/login" />
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>
  if (!user) return <Navigate to="/login" />
  return user.role === 'admin' ? <>{children}</> : <Navigate to="/" />
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>
  return user ? <Navigate to="/" /> : <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route element={<Layout />}>
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
              <Route path="/plans" element={<PrivateRoute><PlansPage /></PrivateRoute>} />
              <Route path="/conversations" element={<PrivateRoute><ConversationListPage /></PrivateRoute>} />
              <Route path="/conversations/:id" element={<PrivateRoute><ConversationPage /></PrivateRoute>} />
              <Route path="/learning" element={<PrivateRoute><FeatureStubPage feature="learning" /></PrivateRoute>} />
              <Route path="/analysis" element={<PrivateRoute><FeatureStubPage feature="analysis" /></PrivateRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
