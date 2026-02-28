'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { RiPhoneLine, RiPhoneFill, RiMicLine, RiMicOffLine, RiLoader4Line, RiStopCircleLine } from 'react-icons/ri'

import type { CallRecord } from './DashboardSection'

const VOICE_AGENT_ID = '69a30a159584b911c2613442'
const SESSION_URL = 'https://voice-sip.studio.lyzr.ai/session/start'

interface TranscriptEntry {
  speaker: 'AI' | 'Caller'
  text: string
  timestamp: string
}

interface VoiceCallModalProps {
  open: boolean
  onClose: () => void
  onCallComplete: (record: CallRecord) => void
  setActiveAgentId: (id: string | null) => void
}

export default function VoiceCallModal({ open, onClose, onCallComplete, setActiveAgentId }: VoiceCallModalProps) {
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const isMutedRef = useRef(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [error, setError] = useState('')
  const [callDuration, setCallDuration] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const nextPlayTimeRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const callStartRef = useRef<number>(0)
  const sampleRateRef = useRef(24000)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  const getNow = (): string => {
    const d = new Date()
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDuration = (secs: number): string => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const floatTo16BitPCM = (float32Array: Float32Array): Int16Array => {
    const int16 = new Int16Array(float32Array.length)
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]))
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    return int16
  }

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64)
    const len = binary.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  const startCall = useCallback(async () => {
    setError('')
    setTranscript([])
    setCallDuration(0)
    setCallState('connecting')
    setActiveAgentId(VOICE_AGENT_ID)

    try {
      const res = await fetch(SESSION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: VOICE_AGENT_ID }),
      })

      if (!res.ok) {
        setError('Failed to start voice session')
        setCallState('idle')
        setActiveAgentId(null)
        return
      }

      const data = await res.json()
      const wsUrl = data?.wsUrl
      const sampleRate = data?.audioConfig?.sampleRate ?? 24000
      sampleRateRef.current = sampleRate

      if (!wsUrl) {
        setError('No WebSocket URL returned')
        setCallState('idle')
        setActiveAgentId(null)
        return
      }

      const audioCtx = new AudioContext({ sampleRate })
      audioContextRef.current = audioCtx

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate, channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      streamRef.current = stream

      const source = audioCtx.createMediaStreamSource(stream)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      const silentGain = audioCtx.createGain()
      silentGain.gain.value = 0
      silentGain.connect(audioCtx.destination)
      source.connect(processor)
      processor.connect(silentGain)

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setCallState('active')
        callStartRef.current = Date.now()
        timerRef.current = setInterval(() => {
          setCallDuration(Math.floor((Date.now() - callStartRef.current) / 1000))
        }, 1000)
      }

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) return
        if (ws.readyState !== WebSocket.OPEN) return
        const inputData = e.inputBuffer.getChannelData(0)
        const pcm16 = floatTo16BitPCM(inputData)
        const b64 = arrayBufferToBase64(pcm16.buffer)
        ws.send(JSON.stringify({ type: 'audio', audio: b64, sampleRate: sampleRateRef.current }))
      }

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data)

          if (msg.type === 'audio' && msg.audio && audioContextRef.current) {
            const pcmBuffer = base64ToArrayBuffer(msg.audio)
            const sr = msg.sampleRate ?? sampleRateRef.current
            const int16 = new Int16Array(pcmBuffer)
            const float32 = new Float32Array(int16.length)
            for (let i = 0; i < int16.length; i++) {
              float32[i] = int16[i] / 0x8000
            }
            const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, sr)
            audioBuffer.getChannelData(0).set(float32)

            const sourceNode = audioContextRef.current.createBufferSource()
            sourceNode.buffer = audioBuffer
            sourceNode.connect(audioContextRef.current.destination)

            const now = audioContextRef.current.currentTime
            const startTime = Math.max(now, nextPlayTimeRef.current)
            sourceNode.start(startTime)
            nextPlayTimeRef.current = startTime + audioBuffer.duration
          }

          if (msg.type === 'transcript') {
            const speaker = msg.role === 'assistant' ? 'AI' : 'Caller'
            const text = msg.text ?? msg.transcript ?? ''
            if (text) {
              setTranscript(prev => {
                if (prev.length > 0 && prev[prev.length - 1].speaker === speaker && msg.is_partial) {
                  const updated = [...prev]
                  updated[updated.length - 1] = { ...updated[updated.length - 1], text }
                  return updated
                }
                return [...prev, { speaker, text, timestamp: getNow() }]
              })
            }
          }

          if (msg.type === 'thinking') {
            // AI is processing — could show indicator
          }

          if (msg.type === 'error') {
            setError(msg.message ?? 'Voice error occurred')
          }

          if (msg.type === 'clear') {
            nextPlayTimeRef.current = 0
          }
        } catch {}
      }

      ws.onerror = () => {
        setError('WebSocket connection error')
        setCallState('ended')
      }

      ws.onclose = () => {
        setCallState('ended')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start call')
      setCallState('idle')
      setActiveAgentId(null)
    }
  }, [setActiveAgentId, callState])

  const endCall = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    nextPlayTimeRef.current = 0
    setCallState('ended')
    setActiveAgentId(null)
  }, [setActiveAgentId])

  const handleSaveAndClose = () => {
    if (transcript.length > 0) {
      const hasAppointment = transcript.some(t => t.text.toLowerCase().includes('appointment') || t.text.toLowerCase().includes('schedule') || t.text.toLowerCase().includes('book'))
      const hasLead = transcript.some(t => t.text.toLowerCase().includes('interested') || t.text.toLowerCase().includes('quote') || t.text.toLowerCase().includes('pricing'))
      const hasMessage = transcript.some(t => t.text.toLowerCase().includes('message') || t.text.toLowerCase().includes('call back'))

      let intent: CallRecord['intent'] = 'faq'
      if (hasAppointment) intent = 'appointment'
      else if (hasLead) intent = 'lead'
      else if (hasMessage) intent = 'message'

      const record: CallRecord = {
        id: Date.now().toString(),
        caller_name: 'Test Caller',
        caller_phone: '+1 (555) 000-0000',
        intent,
        summary: transcript.length > 0 ? transcript[0].text.slice(0, 100) : 'Voice call',
        transcript,
        action_items: hasAppointment ? 'Schedule appointment' : hasLead ? 'Follow up on lead' : hasMessage ? 'Return call' : '',
        appointment_details: hasAppointment ? { date: '', time: '', purpose: 'Discussed during call' } : undefined,
        call_duration: formatDuration(callDuration),
        status: 'new',
        timestamp: new Date().toISOString(),
      }
      onCallComplete(record)
    }
    setCallState('idle')
    setTranscript([])
    setCallDuration(0)
    setError('')
    onClose()
  }

  const handleClose = () => {
    if (callState === 'active') {
      endCall()
    }
    if (callState === 'ended' && transcript.length > 0) {
      handleSaveAndClose()
      return
    }
    setCallState('idle')
    setTranscript([])
    setCallDuration(0)
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-lg" style={{ borderRadius: '0.875rem' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RiPhoneLine className="h-5 w-5 text-[hsl(346,77%,50%)]" />
            Voice Call
            {callState === 'active' && <Badge className="bg-green-100 text-green-700 border-green-200 ml-2">Live</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {callState === 'active' && (
            <div className="text-center">
              <p className="text-3xl font-mono font-bold text-foreground">{formatDuration(callDuration)}</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          <div className="flex justify-center gap-4">
            {callState === 'idle' && (
              <Button onClick={startCall} className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg">
                <RiPhoneFill className="h-7 w-7" />
              </Button>
            )}

            {callState === 'connecting' && (
              <Button disabled className="h-16 w-16 rounded-full bg-amber-400 text-white shadow-lg">
                <RiLoader4Line className="h-7 w-7 animate-spin" />
              </Button>
            )}

            {callState === 'active' && (
              <>
                <Button onClick={() => setIsMuted(!isMuted)} variant="outline" className={`h-14 w-14 rounded-full ${isMuted ? 'bg-red-50 border-red-200 text-red-500' : 'bg-muted'}`}>
                  {isMuted ? <RiMicOffLine className="h-6 w-6" /> : <RiMicLine className="h-6 w-6" />}
                </Button>
                <Button onClick={endCall} className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg">
                  <RiStopCircleLine className="h-7 w-7" />
                </Button>
              </>
            )}

            {callState === 'ended' && (
              <Button onClick={handleSaveAndClose} className="bg-[hsl(346,77%,50%)] hover:bg-[hsl(346,77%,45%)] text-white" style={{ borderRadius: '0.875rem' }}>
                Save & Close
              </Button>
            )}
          </div>

          {callState === 'active' && (
            <div className="flex justify-center">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1 bg-[hsl(346,77%,50%)] rounded-full animate-pulse" style={{ height: `${12 + Math.random() * 20}px`, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {(callState === 'active' || callState === 'ended') && transcript.length > 0 && (
            <Card className="bg-muted/30 border border-border/50" style={{ borderRadius: '0.875rem' }}>
              <CardContent className="p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Live Transcript</p>
                <ScrollArea className="h-[200px]">
                  <div ref={scrollRef} className="space-y-2">
                    {transcript.map((entry, idx) => (
                      <div key={idx} className={`flex gap-2 ${entry.speaker === 'AI' ? '' : 'flex-row-reverse'}`}>
                        <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${entry.speaker === 'AI' ? 'bg-[hsl(346,77%,50%)]/10 text-[hsl(346,77%,50%)]' : 'bg-muted text-muted-foreground'}`}>
                          {entry.speaker}
                        </div>
                        <p className="text-sm flex-1">{entry.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {callState === 'idle' && (
            <p className="text-sm text-muted-foreground text-center">Press the call button to start a test conversation with your AI receptionist.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
