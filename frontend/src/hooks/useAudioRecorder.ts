import { useState, useRef, useCallback } from 'react'

const VOICE_THRESHOLD = 0.015
const BUFFER_CHUNKS = 2

interface ChunkInfo {
  data: Blob
  peakVolume: number
}

interface UseAudioRecorderReturn {
  isRecording: boolean
  volume: number
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<ChunkInfo[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const peakSinceLastChunkRef = useRef(0)
  const busyRef = useRef(false)

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
    recorder.start(200)
    setIsRecording(true)
    updateVolume()
    } finally {
      busyRef.current = false
    }
  }, [updateVolume])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    if (busyRef.current) return Promise.resolve(null)
    busyRef.current = true

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

  return { isRecording, volume, startRecording, stopRecording }
}

// Trim trailing silence only. The first chunk (index 0) must always be kept
// because it contains the webm container header and codec initialization data.
function trimSilence(chunks: ChunkInfo[]): ChunkInfo[] {
  if (chunks.length === 0) return []

  let lastVoice = -1
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].peakVolume >= VOICE_THRESHOLD) {
      lastVoice = i
    }
  }

  if (lastVoice === -1) return chunks

  const end = Math.min(chunks.length - 1, lastVoice + BUFFER_CHUNKS)
  return chunks.slice(0, end + 1)
}
