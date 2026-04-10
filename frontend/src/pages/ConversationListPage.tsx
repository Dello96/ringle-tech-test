import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

const TOPICS = [
  'Travel and Vacation',
  'Food and Cooking',
  'Technology and Innovation',
  'Health and Fitness',
  'Movies and Entertainment',
  'Career and Work Life',
  'Education and Learning',
  'Environment and Sustainability',
]

export function ConversationListPage() {
  const { membership } = useAuth()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const hasConversation = membership?.plan.features.includes('conversation')

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.conversations.list(),
    enabled: !!hasConversation,
  })

  const handleNewConversation = async (topic: string) => {
    setCreating(true)
    setError('')
    try {
      const result = await api.conversations.create(topic)
      navigate(`/conversations/${result.conversation.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation. Please try again.')
      setCreating(false)
    }
  }

  if (!hasConversation) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-gray-400 mb-4">Conversation 기능은 멤버십이 필요합니다</p>
        <Link to="/plans" className="text-primary font-medium hover:underline">플랜 보기</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Conversations</h1>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-2.5 rounded-xl text-sm mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-danger/60 hover:text-danger ml-2">✕</button>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">새 대화 시작하기</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => handleNewConversation(topic)}
              disabled={creating}
              className="text-left bg-white border border-gray-200 hover:border-primary hover:shadow-sm rounded-xl px-4 py-3 text-sm text-gray-700 transition-all disabled:opacity-50"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading conversations...</div>
      ) : data?.conversations.length === 0 ? (
        <p className="text-gray-400">대화 기록이 없습니다. 위에서 주제를 선택해 시작하세요!</p>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">이전 대화</h2>
          <div className="space-y-2">
            {data?.conversations.map(conv => (
              <Link
                key={conv.id}
                to={`/conversations/${conv.id}`}
                className="block bg-white border border-gray-200 hover:border-primary hover:shadow-sm rounded-xl px-5 py-4 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{conv.topic}</span>
                    <span className="text-gray-400 text-sm ml-3">{conv.messages_count} messages</span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {new Date(conv.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
