import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FEATURE_INFO: Record<string, { title: string; icon: string; description: string }> = {
  learning: {
    title: 'Learning',
    icon: '📚',
    description: 'Access curated English learning materials, grammar exercises, and vocabulary building tools.',
  },
  analysis: {
    title: 'Analysis',
    icon: '📊',
    description: 'Review your conversation history, track progress, and get personalized improvement suggestions.',
  },
}

export function FeatureStubPage({ feature }: { feature: string }) {
  const { membership } = useAuth()
  const info = FEATURE_INFO[feature]
  const hasAccess = membership?.plan.features.includes(feature)

  if (!hasAccess) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">{info?.icon}</div>
        <h1 className="text-2xl font-bold mb-2">{info?.title}</h1>
        <p className="text-gray-400 mb-6">This feature requires a membership that includes {feature}.</p>
        <Link
          to="/plans"
          className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium"
        >
          View Plans
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{info?.icon}</div>
      <h1 className="text-2xl font-bold mb-2">{info?.title}</h1>
      <p className="text-gray-400 mb-4">{info?.description}</p>
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md mx-auto">
        <p className="text-gray-500 text-sm">
          This feature is coming soon. Your <strong className="text-primary">{membership?.plan.name}</strong> plan
          includes access to {feature}.
        </p>
      </div>
    </div>
  )
}
