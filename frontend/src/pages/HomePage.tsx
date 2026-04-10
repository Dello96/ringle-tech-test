import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function HomePage() {
  const { user, membership } = useAuth()

  const features = [
    { key: 'learning', label: 'Learning', desc: '영어 학습 자료를 확인하세요', path: '/learning', icon: '📚' },
    { key: 'conversation', label: 'Conversation', desc: 'AI 튜터와 영어 회화 연습', path: '/conversations', icon: '💬' },
    { key: 'analysis', label: 'Analysis', desc: '학습 진도를 분석하세요', path: '/analysis', icon: '📊' },
  ]

  const hasFeature = (f: string) => membership?.plan.features.includes(f)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Welcome back, {user?.name}!
        </h1>
        {membership ? (
          <p className="text-gray-500">
            <span className="text-primary font-semibold">{membership.plan.name}</span> plan
            — {membership.remaining_days}일 남음
          </p>
        ) : (
          <p className="text-gray-500">
            활성 멤버십이 없습니다.{' '}
            <Link to="/plans" className="text-primary font-medium hover:underline">플랜 보기</Link>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map(f => {
          const active = hasFeature(f.key)
          return (
            <Link
              key={f.key}
              to={active ? f.path : '/plans'}
              className={`block rounded-2xl border p-6 transition-all ${
                active
                  ? 'border-gray-200 bg-white hover:border-primary hover:shadow-md'
                  : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{f.label}</h2>
              <p className="text-sm text-gray-500">{f.desc}</p>
              {!active && (
                <span className="inline-block mt-3 text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                  멤버십 필요
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
