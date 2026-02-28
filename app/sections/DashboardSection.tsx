'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RiPhoneLine, RiUserFollowLine, RiCalendarCheckLine, RiMailLine, RiTimeLine, RiArrowRightLine } from 'react-icons/ri'

export interface CallRecord {
  id: string
  caller_name: string
  caller_phone: string
  intent: 'faq' | 'appointment' | 'lead' | 'message' | 'order_status'
  summary: string
  transcript: { speaker: 'AI' | 'Caller'; text: string; timestamp: string }[]
  action_items: string
  appointment_details?: { date: string; time: string; purpose: string }
  lead_details?: { budget: string; timeline: string; needs: string }
  message_content?: string
  call_duration: string
  status: 'new' | 'reviewed' | 'booked'
  timestamp: string
}

interface DashboardSectionProps {
  calls: CallRecord[]
  onNavigateToCallLog: (callId?: string) => void
  onStartCall: () => void
}

const INTENT_COLORS: Record<string, string> = {
  lead: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  appointment: 'bg-blue-100 text-blue-700 border-blue-200',
  message: 'bg-amber-100 text-amber-700 border-amber-200',
  faq: 'bg-purple-100 text-purple-700 border-purple-200',
  order_status: 'bg-orange-100 text-orange-700 border-orange-200',
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-rose-100 text-rose-700 border-rose-200',
  reviewed: 'bg-slate-100 text-slate-600 border-slate-200',
  booked: 'bg-green-100 text-green-700 border-green-200',
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return d.toLocaleDateString()
  } catch {
    return ts
  }
}

export default function DashboardSection({ calls, onNavigateToCallLog, onStartCall }: DashboardSectionProps) {
  const todayCalls = calls.filter(c => {
    try {
      return new Date(c.timestamp).toDateString() === new Date().toDateString()
    } catch { return false }
  })

  const stats = [
    { label: 'Calls Today', value: todayCalls.length, icon: RiPhoneLine, color: 'text-[hsl(346,77%,50%)]' },
    { label: 'Leads Captured', value: calls.filter(c => c.intent === 'lead').length, icon: RiUserFollowLine, color: 'text-emerald-500' },
    { label: 'Appointments', value: calls.filter(c => c.intent === 'appointment').length, icon: RiCalendarCheckLine, color: 'text-blue-500' },
    { label: 'Messages Taken', value: calls.filter(c => c.intent === 'message').length, icon: RiMailLine, color: 'text-amber-500' },
  ]

  const recentCalls = [...calls].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Overview of your receptionist activity</p>
        </div>
        <Button onClick={onStartCall} className="bg-[hsl(346,77%,50%)] hover:bg-[hsl(346,77%,45%)] text-white" style={{ borderRadius: '0.875rem' }}>
          <RiPhoneLine className="mr-2 h-4 w-4" />
          Test Call
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-white/75 backdrop-blur-md border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted/50 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/75 backdrop-blur-md border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Calls</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigateToCallLog()} className="text-[hsl(346,77%,50%)] hover:text-[hsl(346,77%,40%)]">
              View All <RiArrowRightLine className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentCalls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <RiPhoneLine className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No calls yet. Start a test call to see activity here.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {recentCalls.map((call) => (
                  <div
                    key={call.id}
                    onClick={() => onNavigateToCallLog(call.id)}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-muted/60 cursor-pointer transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-full bg-[hsl(346,77%,50%)]/10 flex items-center justify-center flex-shrink-0">
                        <RiPhoneLine className="h-5 w-5 text-[hsl(346,77%,50%)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{call.caller_name}</p>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${INTENT_COLORS[call.intent] ?? ''}`}>
                            {call.intent?.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[call.status] ?? ''}`}>
                            {call.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{call.summary}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <RiTimeLine className="h-3 w-3" />
                          {call.call_duration}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatTimestamp(call.timestamp)}</p>
                      </div>
                      <RiArrowRightLine className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
