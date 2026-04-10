import { useState, useRef, useCallback, useEffect } from 'react'

const VOICE_THRESHOLD = 0.015
const BUFFER_CHUNKS = 2
const MIN_RECORDING_MS = 1000
const MAX_RECORDING_MS = 60000

interface ChunkInfo {
  data: Blob
  peakVolume: number
}

export interface UseAudioRecorderReturn {
  isRecording: boolean
  volume: number
  recordingDuration: number
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<ChunkInfo[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const peakSinceLastChunkRef = useRef(0)
  const busyRef = useRef(false)
  const startTimeRef = useRef(0)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopFnRef = useRef<(() => Promise<Blob | null>) | null>(null)

  const updateVolume = useCallback(() => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.fftSize)
    analyserRef.current.getByteTimeDomainData(data)

    let sum = 0
    for (let i = 0; i < data.length; i++) {
      const val = (data[i] - 128) / 128
      sum += val * val
    }
    const rms = Math.sqrt(sum / data.length)
    const normalized = Math.min(1, rms * 3)
    setVolume(normalized)

    peakSinceLastChunkRef.current = Math.max(peakSinceLastChunkRef.current, rms)

    animFrameRef.current = requestAnimationFrame(updateVolume)
  }, [])

  // Duration counter while recording
  useEffect(() => {
    if (!isRecording) {
      setRecordingDuration(0)
      return
    }
    const interval = setInterval(() => {
      setRecordingDuration(Date.now() - startTimeRef.current)
    }, 200)
    return () => clearInterval(interval)
  }, [isRecording])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    if (busyRef.current) return Promise.resolve(null)
    busyRef.current = true

    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current)
      maxTimerRef.current = null
    }

    const elapsed = Date.now() - startTimeRef.current

    return new Promise((resolve) => {
      cancelAnimationFrame(animFrameRef.current)
      setVolume(0)
      setIsRecording(false)

      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        mediaRecorderRef.current = null
        busyRef.current = false
        resolve(null)
        return
      }

      recorder.onstop = () => {
        mediaRecorderRef.current = null
        busyRef.current = false

        if (elapsed < MIN_RECORDING_MS) {
          resolve(null)
          return
        }

        const trimmed = trimSilence(chunksRef.current)
        if (trimmed.length === 0) {
          resolve(null)
          return
        }
        const blob = new Blob(trimmed.map(c => c.data), { type: 'audio/webm' })
        resolve(blob)
      }
      recorder.stop()

      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null

      if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
      }
      analyserRef.current = null
    })
  }, [])

  // Keep stopFnRef in sync so the max-time timer can call the latest version
  useEffect(() => { stopFnRef.current = stopRecording }, [stopRecording])

  const startRecording = useCallback(async () => {
    if (busyRef.current || mediaRecorderRef.current) return
    busyRef.current = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      peakSinceLastChunkRef.current = 0

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push({
            data: e.data,
            peakVolume: peakSinceLastChunkRef.current,
          })
          peakSinceLastChunkRef.current = 0
        }
      }
      mediaRecorderRef.current = recorder
      startTimeRef.current = Date.now()
      recorder.start(200)
      setIsRecording(true)
      updateVolume()

      maxTimerRef.current = setTimeout(() => {
        stopFnRef.current?.()
      }, MAX_RECORDING_MS)
    } finally {
      busyRef.current = false
    }
  }, [updateVolume])

  return { isRecording, volume, recordingDuration, startRecording, stopRecording }
}

// Trim both leading and trailing silence.
// Chunk 0 must always be included — it contains the webm header/codec init.
function trimSilence(chunks: ChunkInfo[]): ChunkInfo[] {
  if (chunks.length === 0) return []

  let firstVoice = -1
  let lastVoice = -1
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].peakVolume >= VOICE_THRESHOLD) {
      if (firstVoice === -1) firstVoice = i
      lastVoice = i
    }
  }

  if (firstVoice === -1) return []

  const start = Math.max(1, firstVoice - BUFFER_CHUNKS)
  const end = Math.min(chunks.length - 1, lastVoice + BUFFER_CHUNKS)

  return [chunks[0], ...chunks.slice(start, end + 1)]
}
