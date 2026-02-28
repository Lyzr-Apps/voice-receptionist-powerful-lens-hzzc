'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import { RiDashboardLine, RiPhoneLine, RiSettings3Line, RiNotification3Line, RiSignalWifiLine, RiSignalWifiOffLine, RiRobot2Line, RiCalendarCheckLine } from 'react-icons/ri'

import DashboardSection from './sections/DashboardSection'
import CallLogSection from './sections/CallLogSection'
import SettingsSection from './sections/SettingsSection'
import VoiceCallModal from './sections/VoiceCallModal'

import type { CallRecord } from './sections/DashboardSection'

const VOICE_AGENT_ID = '69a30a159584b911c2613442'
const APPOINTMENT_AGENT_ID = '69a30a349584b911c2613447'

const SAMPLE_CALLS: CallRecord[] = [
  {
    id: '1', caller_name: 'Sarah Mitchell', caller_phone: '+1 (555) 234-5678', intent: 'appointment',
    summary: 'Wants to schedule a consultation for next Tuesday afternoon regarding a new project proposal.',
    transcript: [
      { speaker: 'AI', text: 'Hello! Thank you for calling. How can I help you today?', timestamp: '10:01:05' },
      { speaker: 'Caller', text: 'Hi, I would like to schedule an appointment for a consultation.', timestamp: '10:01:12' },
      { speaker: 'AI', text: 'Of course! I can help you with that. What day works best for you?', timestamp: '10:01:18' },
      { speaker: 'Caller', text: 'Next Tuesday afternoon if possible. Around 2 PM.', timestamp: '10:01:25' },
      { speaker: 'AI', text: 'Let me check availability. Tuesday at 2 PM works. May I have your name and the purpose of the consultation?', timestamp: '10:01:32' },
      { speaker: 'Caller', text: 'Sarah Mitchell. It is for a new project proposal discussion.', timestamp: '10:01:40' },
    ],
    action_items: 'Schedule consultation for Tuesday 2 PM',
    appointment_details: { date: '2026-03-03', time: '14:00', purpose: 'New project proposal discussion' },
    call_duration: '2:35', status: 'new', timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2', caller_name: 'James Rodriguez', caller_phone: '+1 (555) 876-5432', intent: 'lead',
    summary: 'Interested in enterprise pricing for a team of 50. Wants a custom quote.',
    transcript: [
      { speaker: 'AI', text: 'Hello! Thank you for calling. How can I help you today?', timestamp: '09:30:05' },
      { speaker: 'Caller', text: 'Hi, I am interested in your enterprise plan. We have about 50 team members.', timestamp: '09:30:15' },
      { speaker: 'AI', text: 'That sounds great! Our enterprise plan is perfect for teams of that size. Can I get some details about your needs?', timestamp: '09:30:22' },
      { speaker: 'Caller', text: 'We need the full suite with API access. Budget is around 10k per month.', timestamp: '09:30:35' },
    ],
    action_items: 'Send enterprise pricing quote, follow up within 48 hours',
    lead_details: { budget: '$10,000/month', timeline: 'Q2 2026', needs: 'Full suite with API access for 50 users' },
    call_duration: '4:12', status: 'new', timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3', caller_name: 'Emily Chen', caller_phone: '+1 (555) 345-6789', intent: 'message',
    summary: 'Left a message for Dr. Williams about rescheduling her follow-up appointment.',
    transcript: [
      { speaker: 'AI', text: 'Hello! Thank you for calling. How can I help you today?', timestamp: '14:15:05' },
      { speaker: 'Caller', text: 'Hi, can I leave a message for Dr. Williams?', timestamp: '14:15:12' },
      { speaker: 'AI', text: 'Of course! I will make sure the message gets to Dr. Williams. Go ahead.', timestamp: '14:15:18' },
      { speaker: 'Caller', text: 'Please let her know Emily Chen called. I need to reschedule my follow-up from Thursday to Friday.', timestamp: '14:15:28' },
    ],
    action_items: 'Deliver message to Dr. Williams',
    message_content: 'Emily Chen needs to reschedule follow-up appointment from Thursday to Friday. Please call back to confirm.',
    call_duration: '1:45', status: 'reviewed', timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: '4', caller_name: 'Michael Brooks', caller_phone: '+1 (555) 567-8901', intent: 'faq',
    summary: 'Asked about business hours and location. Provided information from knowledge base.',
    transcript: [
      { speaker: 'AI', text: 'Hello! Thank you for calling. How can I help you today?', timestamp: '11:00:05' },
      { speaker: 'Caller', text: 'What are your business hours?', timestamp: '11:00:10' },
      { speaker: 'AI', text: 'We are open Monday through Friday, 9 AM to 5 PM. Is there anything else I can help with?', timestamp: '11:00:16' },
      { speaker: 'Caller', text: 'Where are you located?', timestamp: '11:00:22' },
      { speaker: 'AI', text: 'We are located at 123 Main Street, Suite 400. Is there anything else?', timestamp: '11:00:28' },
    ],
    action_items: '', call_duration: '0:55', status: 'reviewed', timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '5', caller_name: 'Rachel Kim', caller_phone: '+1 (555) 789-0123', intent: 'appointment',
    summary: 'Booked a demo session for Friday at 10 AM. Interested in the premium tier.',
    transcript: [
      { speaker: 'AI', text: 'Hello! Thank you for calling. How can I help you today?', timestamp: '15:30:05' },
      { speaker: 'Caller', text: 'I would like to book a product demo. I am interested in the premium tier.', timestamp: '15:30:14' },
      { speaker: 'AI', text: 'Excellent! I can help schedule that for you. When works best?', timestamp: '15:30:20' },
      { speaker: 'Caller', text: 'This Friday at 10 AM if available. My name is Rachel Kim.', timestamp: '15:30:28' },
      { speaker: 'AI', text: 'Perfect! I have noted a demo session for Rachel Kim, Friday at 10 AM for the premium tier. Is that correct?', timestamp: '15:30:36' },
      { speaker: 'Caller', text: 'Yes, that is correct. Thank you!', timestamp: '15:30:42' },
    ],
    action_items: 'Schedule demo for Friday 10 AM',
    appointment_details: { date: '2026-02-27', time: '10:00', purpose: 'Premium tier product demo' },
    call_duration: '1:50', status: 'booked', timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '6', caller_name: 'David Park', caller_phone: '+1 (555) 456-7890', intent: 'order_status',
    summary: 'Inquired about order #ORD-2847. Order is in transit, expected delivery Wednesday.',
    transcript: [
      { speaker: 'AI', text: 'Hello! Thank you for calling. How can I help you today?', timestamp: '13:20:05' },
      { speaker: 'Caller', text: 'Hi, I am calling about my order status. Order number ORD-2847.', timestamp: '13:20:14' },
      { speaker: 'AI', text: 'Let me check that for you. Order ORD-2847 is currently in transit and expected to arrive by Wednesday.', timestamp: '13:20:22' },
      { speaker: 'Caller', text: 'Great, thank you for the update.', timestamp: '13:20:30' },
    ],
    action_items: '', call_duration: '0:40', status: 'reviewed', timestamp: new Date(Date.now() - 259200000).toISOString(),
  },
]

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: RiDashboardLine },
  { id: 'calllog', label: 'Call Log', icon: RiPhoneLine },
  { id: 'settings', label: 'Settings', icon: RiSettings3Line },
] as const

export default function Page() {
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('voicedesk_calls')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCalls(parsed)
          return
        }
      }
    } catch {
      // ignore parse errors
    }
    setCalls(SAMPLE_CALLS)
    localStorage.setItem('voicedesk_calls', JSON.stringify(SAMPLE_CALLS))
  }, [])

  useEffect(() => {
    if (calls.length > 0 && mounted) {
      localStorage.setItem('voicedesk_calls', JSON.stringify(calls))
    }
  }, [calls, mounted])

  const handleUpdateCall = useCallback((updated: CallRecord) => {
    setCalls(prev => prev.map(c => c.id === updated.id ? updated : c))
  }, [])

  const handleCallComplete = useCallback((record: CallRecord) => {
    setCalls(prev => [record, ...prev])
  }, [])

  const handleNavigateToCallLog = useCallback((callId?: string) => {
    setActiveScreen('calllog')
    if (callId) setSelectedCallId(callId)
  }, [])

  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, hsl(350,35%,97%) 0%, hsl(340,30%,95%) 35%, hsl(330,25%,96%) 70%, hsl(355,30%,97%) 100%)' }}
      >
        <div className="text-center">
          <div className="h-10 w-10 rounded-xl bg-[hsl(346,77%,50%)] flex items-center justify-center mx-auto mb-3">
            <RiPhoneLine className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm" style={{ color: 'hsl(350,20%,45%)' }}>Loading VoiceDesk AI...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: 'linear-gradient(135deg, hsl(350,35%,97%) 0%, hsl(340,30%,95%) 35%, hsl(330,25%,96%) 70%, hsl(355,30%,97%) 100%)' }}
    >
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside
          className="w-64 flex-shrink-0 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRight: '1px solid hsl(350,25%,88%)',
          }}
        >
          <div className="p-5">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-[hsl(346,77%,50%)] flex items-center justify-center">
                <RiPhoneLine className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight leading-tight" style={{ color: 'hsl(350,30%,10%)' }}>VoiceDesk AI</h1>
                <p className="text-[10px]" style={{ color: 'hsl(350,20%,45%)' }}>AI Receptionist</p>
              </div>
            </div>
          </div>

          <div className="mx-4 h-px" style={{ background: 'hsl(350,25%,88%)' }} />

          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map(item => {
              const isActiveNav = activeScreen === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={
                    isActiveNav
                      ? { background: 'hsl(346,77%,50%)', color: 'white', boxShadow: '0 4px 12px hsla(346,77%,50%,0.2)' }
                      : { color: 'hsl(350,30%,10%)' }
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="mx-4 h-px" style={{ background: 'hsl(350,25%,88%)' }} />

          {/* Agent Status */}
          <div className="p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(350,20%,45%)' }}>Agents</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className={`h-2 w-2 rounded-full ${activeAgentId === VOICE_AGENT_ID ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <RiRobot2Line className="h-3.5 w-3.5" style={{ color: 'hsl(350,20%,45%)' }} />
                <span style={{ color: 'hsl(350,20%,45%)' }} className="truncate">Voice Receptionist</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`h-2 w-2 rounded-full ${activeAgentId === APPOINTMENT_AGENT_ID ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <RiCalendarCheckLine className="h-3.5 w-3.5" style={{ color: 'hsl(350,20%,45%)' }} />
                <span style={{ color: 'hsl(350,20%,45%)' }} className="truncate">Appointment Scheduler</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header
            className="h-14 flex items-center justify-between px-6 flex-shrink-0"
            style={{
              borderBottom: '1px solid hsl(350,25%,88%)',
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <h2 className="text-sm font-semibold capitalize" style={{ color: 'hsl(350,30%,10%)' }}>
              {activeScreen === 'calllog' ? 'Call Log' : activeScreen}
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <RiSignalWifiLine className="h-4 w-4 text-green-500" />
                ) : (
                  <RiSignalWifiOffLine className="h-4 w-4" style={{ color: 'hsl(350,20%,45%)' }} />
                )}
                <span className="text-xs" style={{ color: 'hsl(350,20%,45%)' }}>{isActive ? 'Active' : 'Inactive'}</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <button className="relative p-2 rounded-lg transition-colors hover:bg-[hsl(350,20%,90%)]">
                <RiNotification3Line className="h-5 w-5" style={{ color: 'hsl(350,20%,45%)' }} />
                {calls.some(c => c.status === 'new') && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[hsl(346,77%,50%)]" />
                )}
              </button>
            </div>
          </header>

          {/* Screen Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeScreen === 'dashboard' && (
              <DashboardSection
                calls={calls}
                onNavigateToCallLog={handleNavigateToCallLog}
                onStartCall={() => setVoiceModalOpen(true)}
              />
            )}
            {activeScreen === 'calllog' && (
              <CallLogSection
                calls={calls}
                selectedCallId={selectedCallId}
                onSelectCall={setSelectedCallId}
                onUpdateCall={handleUpdateCall}
                setActiveAgentId={setActiveAgentId}
              />
            )}
            {activeScreen === 'settings' && (
              <SettingsSection />
            )}
          </div>
        </main>
      </div>

      {/* Voice Call Modal */}
      <VoiceCallModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onCallComplete={handleCallComplete}
        setActiveAgentId={setActiveAgentId}
      />
    </div>
  )
}
