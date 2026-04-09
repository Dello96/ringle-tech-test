import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import type { Message } from '../types'

function RecordingTimer() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return <span className="tabular-nums font-mono">{mm}:{ss}</span>
}

export function ConversationPage() {
  const { id } = useParams<{ id: string }>()
  const conversationId = Number(id)
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendingType, setSendingType] = useState<'text' | 'audio' | null>(null)
  const [error, setError] = useState('')
  const [playingId, setPlayingId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasAutoPlayed = useRef(false)
  const { isRecording, volume, startRecording, stopRecording } = useAudioRecorder()

  const { data, isLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => api.conversations.get(conversationId),
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setPlayingId(null)
  }, [])

  const playAudio = useCallback((msg: Message) => {
    if (!msg.audio_url) return
    stopAudio()
    const audio = new Audio(msg.audio_url)
    audioRef.current = audio
    setPlayingId(msg.id)
    audio.onended = () => {
      setPlayingId(null)
      audioRef.current = null
    }
    audio.onerror = () => {
      console.error('Audio playback failed for:', msg.audio_url)
      setPlayingId(null)
      audioRef.current = null
    }
    audio.play().catch((err) => {
      console.error('Audio play() rejected:', err)
      setPlayingId(null)
      audioRef.current = null
    })
  }, [stopAudio])

  useEffect(scrollToBottom, [data?.messages])

  useEffect(() => {
    if (hasAutoPlayed.current || !data?.messages?.length) return
    const assistantMessages = data.messages.filter(m => m.role === 'assistant')
    const lastAssistant = assistantMessages[assistantMessages.length - 1]
    if (lastAssistant?.audio_url) {
      hasAutoPlayed.current = true
      playAudio(lastAssistant)
    }
  }, [data?.messages, playAudio])

  // Cleanup: stop audio when leaving the page
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  const addMessages = (...msgs: Message[]) => {
    queryClient.setQueryData(['conversation', conversationId], (old: typeof data) => {
      if (!old) return old
      return {
        ...old,
        messages: [...old.messages, ...msgs],
        conversation: {
          ...old.conversation,
          messages_count: old.conversation.messages_count + msgs.length,
        },
      }
    })
  }

  const handleSendText = async () => {
    if (!text.trim() || sending) return
    const msg = text.trim()
    setText('')
    setError('')
    setSending(true)
    setSendingType('text')
    try {
      const result = await api.messages.create(conversationId, { text: msg })
      addMessages(result.user_message, result.ai_message)
      playAudio(result.ai_message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.')
    } finally {
      setSending(false)
      setSendingType(null)
    }
  }

  const handleSendAudio = async () => {
    if (isRecording) {
      const blob = await stopRecording()
      if (!blob) {
        setError('No voice detected. Please try again and speak clearly.')
        return
      }
      setError('')
      setSending(true)
      setSendingType('audio')
      try {
        const result = await api.messages.create(conversationId, { audio: blob })
        addMessages(result.user_message, result.ai_message)
        playAudio(result.ai_message)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send audio. Please try again.')
      } finally {
        setSending(false)
        setSendingType(null)
      }
    } else {
      try {
        await startRecording()
      } catch {
        setError('Microphone access denied. Please allow microphone permissions.')
      }
    }
  }

  const limitReached = (data?.conversation.messages_count ?? 0) >= 20

  if (isLoading) return <div className="text-gray-400">Loading conversation...</div>

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link to="/conversations" className="text-sm text-gray-400 hover:text-primary">&larr; Back</Link>
          <h1 className="text-xl font-bold">{data?.conversation.topic}</h1>
        </div>
        <span className="text-sm text-gray-500">{data?.conversation.messages_count} messages</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {data?.messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-primary text-white rounded-br-md'
                : 'bg-gray-800 text-gray-100 rounded-bl-md'
            }`}>
              {msg.role === 'user' && msg.audio_url && (
                <span className="text-xs opacity-60 block mb-0.5">🎙 Voice message</span>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.content || '(empty transcription)'}</p>
              {msg.audio_url && (
                <div className="mt-1 flex items-center gap-1">
                  {playingId === msg.id ? (
                    <button
                      onClick={stopAudio}
                      className="text-xs flex items-center gap-1 text-accent"
                    >
                      ⏹ Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => playAudio(msg)}
                      className="text-xs flex items-center gap-1 opacity-60 hover:opacity-100"
                    >
                      ▶ Play audio
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2">
              <p className="text-sm text-gray-400 animate-pulse">
                {sendingType === 'audio' ? 'Transcribing your voice & generating response...' : 'AI is thinking...'}
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm mb-2 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-200 ml-2">✕</button>
        </div>
      )}

      {limitReached ? (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-center text-sm text-gray-400">
          Message limit reached. <Link to="/conversations" className="text-primary hover:underline">Start a new conversation</Link>
        </div>
      ) : isRecording ? (
        <div className="bg-gray-900 border-2 border-red-500 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSendAudio}
              className="shrink-0 w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all animate-pulse"
              title="Stop recording and send"
            >
              <span className="w-4 h-4 bg-white rounded-sm" />
            </button>

            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-400">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Recording</span>
                  <RecordingTimer />
                </div>
                <span className="text-xs text-gray-500">Tap stop to send</span>
              </div>

              <div className="w-full h-6 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-75"
                  style={{ width: `${Math.max(2, volume * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 flex items-center gap-2">
          <button
            onClick={handleSendAudio}
            disabled={sending}
            className="shrink-0 w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all disabled:opacity-50"
            title="Start recording"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-2a5 5 0 01-10 0H3a7.001 7.001 0 006 6.93V17H6v2h8v-2h-3v-2.07z" />
            </svg>
          </button>

          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendText()}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm disabled:opacity-50"
          />

          <button
            onClick={handleSendText}
            disabled={!text.trim() || sending}
            className="shrink-0 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}
