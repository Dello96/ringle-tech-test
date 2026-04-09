import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold text-primary">AI Tutor</Link>
            <div className="flex gap-4 text-sm">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <Link to="/plans" className="hover:text-primary transition-colors">Plans</Link>
              <Link to="/conversations" className="hover:text-primary transition-colors">Conversations</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="hover:text-accent transition-colors">Admin</Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">{user?.name}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">
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
