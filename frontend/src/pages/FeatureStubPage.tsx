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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{info?.title}</h1>
        <p className="text-gray-500 mb-6">이 기능은 {feature}을(를) 포함하는 멤버십이 필요합니다.</p>
        <Link
          to="/plans"
          className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
        >
          플랜 보기
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{info?.icon}</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{info?.title}</h1>
      <p className="text-gray-500 mb-4">{info?.description}</p>
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
        <p className="text-gray-500 text-sm">
          이 기능은 준비 중입니다. <strong className="text-primary">{membership?.plan.name}</strong> 플랜에 {feature} 접근 권한이 포함되어 있습니다.
        </p>
      </div>
    </div>
  )
}
