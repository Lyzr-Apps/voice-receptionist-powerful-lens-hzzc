'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { uploadAndTrainDocument, getDocuments, deleteDocuments, crawlWebsite } from '@/lib/ragKnowledgeBase'
import type { RAGDocument } from '@/lib/ragKnowledgeBase'
import { RiUploadCloud2Line, RiDeleteBinLine, RiGlobalLine, RiAddLine, RiCheckLine, RiLoader4Line, RiFileTextLine, RiSaveLine } from 'react-icons/ri'

const RAG_ID = '69a309fe00c2d274880f7f5e'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface RoutingRule {
  id: string
  department: string
  phone: string
  description: string
}

interface GeneralSettings {
  businessName: string
  greeting: string
  tone: 'professional' | 'friendly' | 'casual'
  hours: Record<string, { start: string; end: string; enabled: boolean }>
}

const defaultHours: Record<string, { start: string; end: string; enabled: boolean }> = {}
DAYS.forEach(d => {
  defaultHours[d] = { start: '09:00', end: '17:00', enabled: d !== 'Saturday' && d !== 'Sunday' }
})

export default function SettingsSection() {
  const [activeTab, setActiveTab] = useState('general')
  const [general, setGeneral] = useState<GeneralSettings>({ businessName: 'VoiceDesk AI', greeting: 'Hello! Thank you for calling. How can I help you today?', tone: 'professional', hours: defaultHours })
  const [saved, setSaved] = useState(false)
  const [docs, setDocs] = useState<RAGDocument[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [crawlUrl, setCrawlUrl] = useState('')
  const [crawlLoading, setCrawlLoading] = useState(false)
  const [crawlMsg, setCrawlMsg] = useState('')
  const [routes, setRoutes] = useState<RoutingRule[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    try {
      const savedGeneral = localStorage.getItem('voicedesk_settings')
      if (savedGeneral) setGeneral(JSON.parse(savedGeneral))
      const savedRoutes = localStorage.getItem('voicedesk_routes')
      if (savedRoutes) setRoutes(JSON.parse(savedRoutes))
    } catch {}
  }, [])

  const loadDocs = useCallback(async () => {
    setDocsLoading(true)
    try {
      const res = await getDocuments(RAG_ID)
      if (res.success && Array.isArray(res.documents)) {
        setDocs(res.documents)
      }
    } catch {}
    setDocsLoading(false)
  }, [])

  useEffect(() => { if (activeTab === 'knowledge') loadDocs() }, [activeTab, loadDocs])

  const handleSaveGeneral = () => {
    localStorage.setItem('voicedesk_settings', JSON.stringify(general))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArr = Array.from(files)
    if (fileArr.length === 0) return
    setUploadLoading(true)
    setUploadMsg('')
    try {
      for (const file of fileArr) {
        const res = await uploadAndTrainDocument(RAG_ID, file)
        if (!res.success) {
          setUploadMsg(`Failed to upload ${file.name}: ${res.error ?? 'Unknown error'}`)
          setUploadLoading(false)
          return
        }
      }
      setUploadMsg(`Successfully uploaded ${fileArr.length} file(s)`)
      await loadDocs()
    } catch {
      setUploadMsg('Upload failed')
    }
    setUploadLoading(false)
  }

  const handleDeleteDoc = async (fileName: string) => {
    try {
      const res = await deleteDocuments(RAG_ID, [fileName])
      if (res.success) {
        setDocs(prev => prev.filter(d => d.fileName !== fileName))
      }
    } catch {}
  }

  const handleCrawl = async () => {
    if (!crawlUrl.trim()) return
    setCrawlLoading(true)
    setCrawlMsg('')
    try {
      const res = await crawlWebsite(RAG_ID, crawlUrl.trim())
      setCrawlMsg(res.success ? 'Website crawled and added to knowledge base!' : (res.error ?? 'Crawl failed'))
    } catch {
      setCrawlMsg('Crawl failed')
    }
    setCrawlLoading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files)
  }

  const addRoute = () => {
    const newRoute: RoutingRule = { id: Date.now().toString(), department: '', phone: '', description: '' }
    setRoutes(prev => [...prev, newRoute])
  }

  const updateRoute = (id: string, field: keyof RoutingRule, value: string) => {
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const removeRoute = (id: string) => {
    setRoutes(prev => prev.filter(r => r.id !== id))
  }

  const saveRoutes = () => {
    localStorage.setItem('voicedesk_routes', JSON.stringify(routes))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure your voice receptionist</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList style={{ borderRadius: '0.875rem' }}>
          <TabsTrigger value="general" style={{ borderRadius: '0.625rem' }}>General</TabsTrigger>
          <TabsTrigger value="knowledge" style={{ borderRadius: '0.625rem' }}>Knowledge Base</TabsTrigger>
          <TabsTrigger value="routing" style={{ borderRadius: '0.625rem' }}>Call Routing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card className="bg-white/75 backdrop-blur-md border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label htmlFor="biz-name">Business Name</Label>
                <Input id="biz-name" value={general.businessName} onChange={(e) => setGeneral(prev => ({ ...prev, businessName: e.target.value }))} style={{ borderRadius: '0.875rem' }} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="greeting">Greeting Message</Label>
                <Textarea id="greeting" value={general.greeting} onChange={(e) => setGeneral(prev => ({ ...prev, greeting: e.target.value }))} rows={3} style={{ borderRadius: '0.875rem' }} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">{general.greeting.length}/500 characters</p>
              </div>

              <div>
                <Label className="mb-3 block">Receptionist Tone</Label>
                <RadioGroup value={general.tone} onValueChange={(v) => setGeneral(prev => ({ ...prev, tone: v as GeneralSettings['tone'] }))} className="flex gap-4">
                  {(['professional', 'friendly', 'casual'] as const).map(tone => (
                    <div key={tone} className="flex items-center gap-2">
                      <RadioGroupItem value={tone} id={`tone-${tone}`} />
                      <Label htmlFor={`tone-${tone}`} className="capitalize cursor-pointer">{tone}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Separator />

              <div>
                <Label className="mb-3 block">Business Hours</Label>
                <div className="space-y-2">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 w-32 text-sm">
                        <input type="checkbox" checked={general.hours[day]?.enabled ?? false} onChange={(e) => setGeneral(prev => ({ ...prev, hours: { ...prev.hours, [day]: { ...prev.hours[day], enabled: e.target.checked } } }))} className="rounded" />
                        {day}
                      </label>
                      {general.hours[day]?.enabled && (
                        <>
                          <Input type="time" value={general.hours[day]?.start ?? '09:00'} onChange={(e) => setGeneral(prev => ({ ...prev, hours: { ...prev.hours, [day]: { ...prev.hours[day], start: e.target.value } } }))} className="w-32" style={{ borderRadius: '0.875rem' }} />
                          <span className="text-sm text-muted-foreground">to</span>
                          <Input type="time" value={general.hours[day]?.end ?? '17:00'} onChange={(e) => setGeneral(prev => ({ ...prev, hours: { ...prev.hours, [day]: { ...prev.hours[day], end: e.target.value } } }))} className="w-32" style={{ borderRadius: '0.875rem' }} />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveGeneral} className="bg-[hsl(346,77%,50%)] hover:bg-[hsl(346,77%,45%)] text-white" style={{ borderRadius: '0.875rem' }}>
                {saved ? <><RiCheckLine className="mr-2 h-4 w-4" /> Saved!</> : <><RiSaveLine className="mr-2 h-4 w-4" /> Save Settings</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="mt-4 space-y-4">
          <Card className="bg-white/75 backdrop-blur-md border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader><CardTitle className="text-base">Upload Documents</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-[hsl(346,77%,50%)] bg-[hsl(346,77%,50%)]/5' : 'border-border hover:border-[hsl(346,77%,50%)]/50'}`}
              >
                <RiUploadCloud2Line className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Drop files here or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT supported</p>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" multiple className="hidden" onChange={(e) => { if (e.target.files) handleFileUpload(e.target.files) }} />
              </div>
              {uploadLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><RiLoader4Line className="h-4 w-4 animate-spin" /> Uploading...</div>}
              {uploadMsg && <p className={`text-sm ${uploadMsg.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>{uploadMsg}</p>}
            </CardContent>
          </Card>

          <Card className="bg-white/75 backdrop-blur-md border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader><CardTitle className="text-base">Uploaded Files</CardTitle></CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><RiLoader4Line className="h-4 w-4 animate-spin" /> Loading documents...</div>
              ) : docs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {docs.map((doc, idx) => (
                    <div key={doc.id ?? idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <RiFileTextLine className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">{doc.fileType?.toUpperCase()} {doc.status ? <Badge variant="outline" className="ml-2 text-[10px]">{doc.status}</Badge> : null}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDoc(doc.fileName)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <RiDeleteBinLine className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/75 backdrop-blur-md border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader><CardTitle className="text-base">Crawl Website</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <RiGlobalLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="https://example.com" value={crawlUrl} onChange={(e) => setCrawlUrl(e.target.value)} className="pl-9" style={{ borderRadius: '0.875rem' }} />
                </div>
                <Button onClick={handleCrawl} disabled={crawlLoading || !crawlUrl.trim()} className="bg-[hsl(346,77%,50%)] hover:bg-[hsl(346,77%,45%)] text-white" style={{ borderRadius: '0.875rem' }}>
                  {crawlLoading ? <RiLoader4Line className="h-4 w-4 animate-spin" /> : 'Crawl'}
                </Button>
              </div>
              {crawlMsg && <p className={`text-sm mt-2 ${crawlMsg.includes('success') || crawlMsg.includes('crawled') ? 'text-green-600' : 'text-red-600'}`}>{crawlMsg}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routing" className="mt-4">
          <Card className="bg-white/75 backdrop-blur-md border border-white/18 shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Call Routing Rules</CardTitle>
                <Button variant="outline" size="sm" onClick={addRoute} style={{ borderRadius: '0.875rem' }}>
                  <RiAddLine className="mr-1 h-4 w-4" /> Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {routes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No routing rules configured. Add a rule to get started.</p>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {routes.map((r) => (
                      <div key={r.id} className="flex gap-3 items-start p-3 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex-1 space-y-2">
                          <Input placeholder="Department" value={r.department} onChange={(e) => updateRoute(r.id, 'department', e.target.value)} style={{ borderRadius: '0.875rem' }} />
                          <Input placeholder="Phone Number" value={r.phone} onChange={(e) => updateRoute(r.id, 'phone', e.target.value)} style={{ borderRadius: '0.875rem' }} />
                          <Input placeholder="Description" value={r.description} onChange={(e) => updateRoute(r.id, 'description', e.target.value)} style={{ borderRadius: '0.875rem' }} />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeRoute(r.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-1">
                          <RiDeleteBinLine className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {routes.length > 0 && (
                <Button onClick={saveRoutes} className="mt-4 bg-[hsl(346,77%,50%)] hover:bg-[hsl(346,77%,45%)] text-white" style={{ borderRadius: '0.875rem' }}>
                  {saved ? <><RiCheckLine className="mr-2 h-4 w-4" /> Saved!</> : <><RiSaveLine className="mr-2 h-4 w-4" /> Save Rules</>}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
