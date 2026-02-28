'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { callAIAgent } from '@/lib/aiAgent'
import { RiSearchLine, RiCalendarCheckLine, RiCheckLine, RiPhoneLine, RiTimeLine, RiUserLine, RiFileTextLine, RiExternalLinkLine, RiLoader4Line } from 'react-icons/ri'

import type { CallRecord } from './DashboardSection'

interface CallLogSectionProps {
  calls: CallRecord[]
  selectedCallId: string | null
  onSelectCall: (id: string) => void
  onUpdateCall: (updated: CallRecord) => void
  setActiveAgentId: (id: string | null) => void
}

const APPOINTMENT_AGENT_ID = '69a30a349584b911c2613447'

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

export default function CallLogSection({ calls, selectedCallId, onSelectCall, onUpdateCall, setActiveAgentId }: CallLogSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [intentFilter, setIntentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingResult, setBookingResult] = useState<{ success: boolean; message: string; eventLink?: string } | null>(null)
  const [bookingForm, setBookingForm] = useState({ date: '', time: '', name: '', purpose: '' })

  const selectedCall = useMemo(() => calls.find(c => c.id === selectedCallId), [calls, selectedCallId])

  const filteredCalls = useMemo(() => {
    return calls
      .filter(c => {
        if (intentFilter !== 'all' && c.intent !== intentFilter) return false
        if (statusFilter !== 'all' && c.status !== statusFilter) return false
        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          return (c.caller_name?.toLowerCase().includes(term) || c.caller_phone?.toLowerCase().includes(term) || c.summary?.toLowerCase().includes(term))
        }
        return true
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [calls, intentFilter, statusFilter, searchTerm])

  const handleMarkReviewed = () => {
    if (!selectedCall) return
    onUpdateCall({ ...selectedCall, status: 'reviewed' })
  }

  const handleOpenBooking = () => {
    if (!selectedCall) return
    setBookingForm({
      date: selectedCall.appointment_details?.date ?? '',
      time: selectedCall.appointment_details?.time ?? '',
      name: selectedCall.caller_name ?? '',
      purpose: selectedCall.appointment_details?.purpose ?? selectedCall.summary ?? '',
    })
    setBookingResult(null)
    setBookingModalOpen(true)
  }

  const handleBookAppointment = async () => {
    if (!selectedCall) return
    setBookingLoading(true)
    setBookingResult(null)
    setActiveAgentId(APPOINTMENT_AGENT_ID)

    try {
      const msg = `Book appointment for ${bookingForm.name} on ${bookingForm.date} at ${bookingForm.time} for ${bookingForm.purpose}`
      const result = await callAIAgent(msg, APPOINTMENT_AGENT_ID)

      if (result.success) {
        const data = result?.response?.result
        const status = data?.booking_status ?? 'unknown'
        if (status === 'confirmed' || status === 'success') {
          setBookingResult({
            success: true,
            message: data?.message ?? 'Appointment booked successfully!',
            eventLink: data?.event_link,
          })
          onUpdateCall({ ...selectedCall, status: 'booked' })
        } else {
          setBookingResult({ success: false, message: data?.message ?? `Booking status: ${status}` })
        }
      } else {
        setBookingResult({ success: false, message: result?.error ?? 'Failed to book appointment' })
      }
    } catch (err) {
      setBookingResult({ success: false, message: 'Network error occurred' })
    }

    setBookingLoading(false)
    setActiveAgentId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold tracking-tight">Call Log</h2>
        <p className="text-sm text-muted-foreground mt-1">Browse, filter, and manage all call records</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search calls..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" style={{ borderRadius: '0.875rem' }} />
        </div>
        <Select value={intentFilter} onValueChange={setIntentFilter}>
          <SelectTrigger className="w-[140px]" style={{ borderRadius: '0.875rem' }}>
            <SelectValue placeholder="Intent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intents</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="appointment">Appointment</SelectItem>
            <SelectItem value="message">Message</SelectItem>
            <SelectItem value="faq">FAQ</SelectItem>
            <SelectItem value="order_status">Order Status</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]" style={{ borderRadius: '0.875rem' }}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <Card className="w-[360px] flex-shrink-0 bg-white/75 backdrop-blur-md border border-white/18 shadow-md overflow-hidden" style={{ borderRadius: '0.875rem' }}>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-3 space-y-2">
              {filteredCalls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No calls match your filters</p>
              ) : (
                filteredCalls.map((call) => (
                  <div
                    key={call.id}
                    onClick={() => onSelectCall(call.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${selectedCallId === call.id ? 'border-[hsl(346,77%,50%)] bg-[hsl(346,77%,50%)]/5 shadow-sm' : 'border-border/50 hover:bg-muted/40'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate">{call.caller_name}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[call.status] ?? ''}`}>{call.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${INTENT_COLORS[call.intent] ?? ''}`}>{call.intent?.replace('_', ' ')}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><RiTimeLine className="h-3 w-3" />{call.call_duration}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{call.summary}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="flex-1 bg-white/75 backdrop-blur-md border border-white/18 shadow-md overflow-hidden" style={{ borderRadius: '0.875rem' }}>
          {!selectedCall ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <RiFileTextLine className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a call to view details</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedCall.caller_name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedCall.caller_phone}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedCall.status === 'new' && (
                      <Button variant="outline" size="sm" onClick={handleMarkReviewed} style={{ borderRadius: '0.875rem' }}>
                        <RiCheckLine className="mr-1 h-4 w-4" /> Mark Reviewed
                      </Button>
                    )}
                    {selectedCall.intent === 'appointment' && selectedCall.status !== 'booked' && (
                      <Button size="sm" onClick={handleOpenBooking} className="bg-[hsl(346,77%,50%)] hover:bg-[hsl(346,77%,45%)] text-white" style={{ borderRadius: '0.875rem' }}>
                        <RiCalendarCheckLine className="mr-1 h-4 w-4" /> Book Appointment
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40">
                    <p className="text-[10px] text-muted-foreground uppercase">Intent</p>
                    <Badge variant="outline" className={`mt-1 text-xs ${INTENT_COLORS[selectedCall.intent] ?? ''}`}>{selectedCall.intent?.replace('_', ' ')}</Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
                    <p className="text-sm font-medium mt-1">{selectedCall.call_duration}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                    <Badge variant="outline" className={`mt-1 text-xs ${STATUS_COLORS[selectedCall.status] ?? ''}`}>{selectedCall.status}</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground">{selectedCall.summary}</p>
                </div>

                {selectedCall.action_items && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Action Items</h4>
                    <p className="text-sm text-muted-foreground">{selectedCall.action_items}</p>
                  </div>
                )}

                {selectedCall.appointment_details && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <h4 className="font-semibold text-sm mb-2 text-blue-800">Appointment Details</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><p className="text-[10px] text-blue-600 uppercase">Date</p><p className="font-medium">{selectedCall.appointment_details.date}</p></div>
                      <div><p className="text-[10px] text-blue-600 uppercase">Time</p><p className="font-medium">{selectedCall.appointment_details.time}</p></div>
                      <div><p className="text-[10px] text-blue-600 uppercase">Purpose</p><p className="font-medium">{selectedCall.appointment_details.purpose}</p></div>
                    </div>
                  </div>
                )}

                {selectedCall.lead_details && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <h4 className="font-semibold text-sm mb-2 text-emerald-800">Lead Details</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><p className="text-[10px] text-emerald-600 uppercase">Budget</p><p className="font-medium">{selectedCall.lead_details.budget}</p></div>
                      <div><p className="text-[10px] text-emerald-600 uppercase">Timeline</p><p className="font-medium">{selectedCall.lead_details.timeline}</p></div>
                      <div><p className="text-[10px] text-emerald-600 uppercase">Needs</p><p className="font-medium">{selectedCall.lead_details.needs}</p></div>
                    </div>
                  </div>
                )}

                {selectedCall.message_content && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <h4 className="font-semibold text-sm mb-2 text-amber-800">Message</h4>
                    <p className="text-sm">{selectedCall.message_content}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm mb-3">Transcript</h4>
                  <div className="space-y-3">
                    {Array.isArray(selectedCall?.transcript) && selectedCall.transcript.map((entry, idx) => (
                      <div key={idx} className={`flex gap-3 ${entry.speaker === 'AI' ? '' : 'flex-row-reverse'}`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${entry.speaker === 'AI' ? 'bg-[hsl(346,77%,50%)]/10 text-[hsl(346,77%,50%)]' : 'bg-muted text-muted-foreground'}`}>
                          {entry.speaker === 'AI' ? 'AI' : <RiUserLine className="h-4 w-4" />}
                        </div>
                        <div className={`max-w-[80%] p-3 rounded-xl text-sm ${entry.speaker === 'AI' ? 'bg-muted/60' : 'bg-[hsl(346,77%,50%)]/5 border border-[hsl(346,77%,50%)]/10'}`}>
                          <p>{entry.text}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{entry.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>

      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="sm:max-w-md" style={{ borderRadius: '0.875rem' }}>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          {bookingResult ? (
            <div className={`p-4 rounded-xl text-sm ${bookingResult.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
              <p className="font-medium mb-1">{bookingResult.success ? 'Booking Confirmed!' : 'Booking Failed'}</p>
              <p>{bookingResult.message}</p>
              {bookingResult.eventLink && (
                <a href={bookingResult.eventLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:underline">
                  <RiExternalLinkLine className="h-4 w-4" /> View in Calendar
                </a>
              )}
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => setBookingModalOpen(false)} style={{ borderRadius: '0.875rem' }}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div><Label htmlFor="bk-name">Name</Label><Input id="bk-name" value={bookingForm.name} onChange={(e) => setBookingForm(prev => ({ ...prev, name: e.target.value }))} style={{ borderRadius: '0.875rem' }} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="bk-date">Date</Label><Input id="bk-date" type="date" value={bookingForm.date} onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))} style={{ borderRadius: '0.875rem' }} /></div>
                <div><Label htmlFor="bk-time">Time</Label><Input id="bk-time" type="time" value={bookingForm.time} onChange={(e) => setBookingForm(prev => ({ ...prev, time: e.target.value }))} style={{ borderRadius: '0.875rem' }} /></div>
              </div>
              <div><Label htmlFor="bk-purpose">Purpose</Label><Textarea id="bk-purpose" value={bookingForm.purpose} onChange={(e) => setBookingForm(prev => ({ ...prev, purpose: e.target.value }))} rows={3} style={{ borderRadius: '0.875rem' }} /></div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBookingModalOpen(false)} style={{ borderRadius: '0.875rem' }}>Cancel</Button>
                <Button onClick={handleBookAppointment} disabled={bookingLoading || !bookingForm.name || !bookingForm.date || !bookingForm.time} className="bg-[hsl(346,77%,50%)] hover:bg-[hsl(346,77%,45%)] text-white" style={{ borderRadius: '0.875rem' }}>
                  {bookingLoading ? <><RiLoader4Line className="mr-2 h-4 w-4 animate-spin" /> Booking...</> : 'Confirm Booking'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
