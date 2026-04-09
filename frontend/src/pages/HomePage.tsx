import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function HomePage() {
  const { user, membership } = useAuth()

  const features = [
    { key: 'learning', label: 'Learning', desc: 'Study English materials', path: '/learning', icon: '📚' },
    { key: 'conversation', label: 'Conversation', desc: 'Practice with AI tutor', path: '/conversations', icon: '💬' },
    { key: 'analysis', label: 'Analysis', desc: 'Review your progress', path: '/analysis', icon: '📊' },
  ]

  const hasFeature = (f: string) => membership?.plan.features.includes(f)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name}!</h1>
        {membership ? (
          <p className="text-gray-400">
            <span className="text-primary font-medium">{membership.plan.name}</span> plan
            — {membership.remaining_days} days remaining
          </p>
        ) : (
          <p className="text-gray-400">
            No active membership.{' '}
            <Link to="/plans" className="text-primary hover:underline">Get a plan</Link> to unlock features.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map(f => {
          const active = hasFeature(f.key)
          return (
            <Link
              key={f.key}
              to={active ? f.path : '/plans'}
              className={`block rounded-xl border p-6 transition-all ${
                active
                  ? 'border-gray-700 bg-gray-900 hover:border-primary hover:bg-gray-800'
                  : 'border-gray-800 bg-gray-900/50 opacity-60'
              }`}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h2 className="text-lg font-semibold mb-1">{f.label}</h2>
              <p className="text-sm text-gray-400">{f.desc}</p>
              {!active && (
                <span className="inline-block mt-3 text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                  Requires membership
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
