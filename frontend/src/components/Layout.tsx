import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
    return (
      <Link
        to={to}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-primary/10 text-primary'
            : 'text-gray-600 hover:text-primary hover:bg-gray-50'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xl font-bold text-primary mr-4">
              Ringle AI Tutor
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              {navLink('/', 'Home')}
              {navLink('/plans', 'Plans')}
              {navLink('/conversations', 'Conversations')}
              {user?.role === 'admin' && navLink('/admin', 'Admin')}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:inline">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
