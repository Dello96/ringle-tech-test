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
        <p className="text-xl text-gray-400 mb-4">Conversation feature requires a membership</p>
        <Link to="/plans" className="text-primary hover:underline">View Plans</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Conversations</h1>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-200 ml-2">✕</button>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-300">Start a new conversation</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => handleNewConversation(topic)}
              disabled={creating}
              className="text-left bg-gray-900 border border-gray-700 hover:border-primary rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-50"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading conversations...</div>
      ) : data?.conversations.length === 0 ? (
        <p className="text-gray-500">No conversations yet. Choose a topic above to start!</p>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-300">Past conversations</h2>
          <div className="space-y-2">
            {data?.conversations.map(conv => (
              <Link
                key={conv.id}
                to={`/conversations/${conv.id}`}
                className="block bg-gray-900 border border-gray-700 hover:border-primary rounded-lg px-4 py-3 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{conv.topic}</span>
                    <span className="text-gray-500 text-sm ml-3">{conv.messages_count} messages</span>
                  </div>
                  <span className="text-gray-500 text-sm">
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
