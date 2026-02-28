'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { RiDashboardLine, RiPhoneLine, RiSettings3Line, RiNotification3Line, RiSignalWifiLine, RiSignalWifiOffLine, RiRobot2Line, RiCalendarCheckLine } from 'react-icons/ri'

import DashboardSection from './sections/DashboardSection'
import CallLogSection from './sections/CallLogSection'
import SettingsSection from './sections/SettingsSection'
import VoiceCallModal from './sections/VoiceCallModal'

import type { CallRecord } from './sections/DashboardSection'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const THEME_VARS = {
  '--background': '350 30% 98%',
  '--foreground': '350 30% 10%',
  '--card': '350 30% 96%',
  '--card-foreground': '350 30% 10%',
  '--popover': '350 30% 94%',
  '--primary': '346 77% 50%',
  '--primary-foreground': '350 30% 98%',
  '--secondary': '350 25% 92%',
  '--secondary-foreground': '350 30% 15%',
  '--accent': '330 65% 45%',
  '--accent-foreground': '350 30% 98%',
  '--destructive': '0 84% 60%',
  '--muted': '350 20% 90%',
  '--muted-foreground': '350 20% 45%',
  '--border': '350 25% 88%',
  '--input': '350 20% 80%',
  '--ring': '346 77% 50%',
  '--radius': '0.875rem',
  '--sidebar-background': '350 28% 95%',
  '--sidebar-foreground': '350 30% 10%',
  '--sidebar-border': '350 25% 88%',
  '--sidebar-primary': '346 77% 50%',
  '--sidebar-primary-foreground': '350 30% 98%',
  '--sidebar-accent': '350 25% 90%',
  '--sidebar-accent-foreground': '350 30% 10%',
  '--chart-1': '346 77% 50%',
  '--chart-2': '330 65% 45%',
  '--chart-3': '10 70% 55%',
  '--chart-4': '320 55% 50%',
  '--chart-5': '0 60% 55%',
} as React.CSSProperties

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

const VOICE_AGENT_ID = '69a30a159584b911c2613442'
const APPOINTMENT_AGENT_ID = '69a30a349584b911c2613447'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: RiDashboardLine },
  { id: 'calllog', label: 'Call Log', icon: RiPhoneLine },
  { id: 'settings', label: 'Settings', icon: RiSettings3Line },
]

export default function Page() {
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('voicedesk_calls')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCalls(parsed)
          return
        }
      }
    } catch {}
    setCalls(SAMPLE_CALLS)
    localStorage.setItem('voicedesk_calls', JSON.stringify(SAMPLE_CALLS))
  }, [])

  useEffect(() => {
    if (calls.length > 0) {
      localStorage.setItem('voicedesk_calls', JSON.stringify(calls))
    }
  }, [calls])

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

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans" >
        <div className="flex h-screen" style={{ background: 'linear-gradient(135deg, hsl(350,35%,97%) 0%, hsl(340,30%,95%) 35%, hsl(330,25%,96%) 70%, hsl(355,30%,97%) 100%)' }}>
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 bg-white/75 backdrop-blur-md border-r border-border/50 flex flex-col">
            <div className="p-5">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-[hsl(346,77%,50%)] flex items-center justify-center">
                  <RiPhoneLine className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight leading-tight">VoiceDesk AI</h1>
                  <p className="text-[10px] text-muted-foreground">AI Receptionist</p>
                </div>
              </div>
            </div>

            <Separator className="mx-4" />

            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeScreen === item.id ? 'bg-[hsl(346,77%,50%)] text-white shadow-md shadow-[hsl(346,77%,50%)]/20' : 'text-foreground hover:bg-muted/60'}`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </nav>

            <Separator className="mx-4" />

            {/* Agent Status */}
            <div className="p-4 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Agents</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className={`h-2 w-2 rounded-full ${activeAgentId === VOICE_AGENT_ID ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <RiRobot2Line className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">Voice Receptionist</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`h-2 w-2 rounded-full ${activeAgentId === APPOINTMENT_AGENT_ID ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <RiCalendarCheckLine className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">Appointment Scheduler</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="h-14 border-b border-border/50 bg-white/60 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0">
              <h2 className="text-sm font-semibold capitalize">{activeScreen === 'calllog' ? 'Call Log' : activeScreen}</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {isActive ? (
                    <RiSignalWifiLine className="h-4 w-4 text-green-500" />
                  ) : (
                    <RiSignalWifiOffLine className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">{isActive ? 'Active' : 'Inactive'}</span>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
                <button className="relative p-2 rounded-lg hover:bg-muted/60 transition-colors">
                  <RiNotification3Line className="h-5 w-5 text-muted-foreground" />
                  {calls.some(c => c.status === 'new') && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[hsl(346,77%,50%)]" />
                  )}
                </button>
              </div>
            </header>

            {/* Screen Content */}
            <ScrollArea className="flex-1">
              <div className="p-6">
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
            </ScrollArea>
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
    </ErrorBoundary>
  )
}
