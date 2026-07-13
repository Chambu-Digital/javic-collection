'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/custom-toast'
import ImageUpload from '@/components/image-upload'
import type { ICampaign, ICampaignImage, ICampaignBadge, CampaignType, CampaignStatus, DisplayMode, DisplayPosition, AnimationType, BackgroundType, OverlayType, BadgeType, DiscountType, VisibilityPage, DisplayFrequency, AudienceTarget } from '@/models/Campaign'

function toLocal(d?: Date | string) {
  if (!d) return ''
  const dt = new Date(d)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`
}

const TYPES: {v: CampaignType; l: string}[] = [
  {v:'discount',l:'Discount'},{v:'promotion',l:'Promotion'},{v:'new_product',l:'New Product'},
  {v:'new_arrival',l:'New Arrival'},{v:'event',l:'Event'},{v:'announcement',l:'Announcement'},
  {v:'holiday',l:'Holiday'},{v:'clearance',l:'Clearance'},{v:'limited_time',l:'Limited Time'},{v:'other',l:'Other'},
]
const MODES: {v: DisplayMode; l: string}[] = [
  {v:'popup_modal',l:'Popup Modal'},{v:'floating_card',l:'Floating Card'},
  {v:'announcement_bar',l:'Announcement Bar'},{v:'slide_in_panel',l:'Slide-in Panel'},
  {v:'hero_banner',l:'Hero Banner'},{v:'full_screen_overlay',l:'Full Screen Overlay'},{v:'inline_section',l:'Inline Section'},
]
const POSITIONS: {v: DisplayPosition; l: string}[] = [
  {v:'center',l:'Center'},{v:'top',l:'Top'},{v:'bottom_left',l:'Bottom Left'},{v:'bottom_right',l:'Bottom Right'},
]
const ANIMS: {v: AnimationType; l: string}[] = [
  {v:'fade',l:'Fade'},{v:'zoom',l:'Zoom'},{v:'slide_up',l:'Slide Up'},{v:'slide_down',l:'Slide Down'},{v:'bounce',l:'Bounce'},{v:'none',l:'None'},
]
const BG_TYPES: {v: BackgroundType; l: string}[] = [
  {v:'color',l:'Solid Color'},{v:'gradient',l:'Gradient'},{v:'image',l:'Image'},
]
const OVERLAYS: {v: OverlayType; l: string}[] = [
  {v:'none',l:'None'},{v:'dark',l:'Dark'},{v:'blur',l:'Blur'},
]
const BADGES: {v: BadgeType; l: string}[] = [
  {v:'sale',l:'Sale'},{v:'new',l:'New'},{v:'hot',l:'Hot'},{v:'exclusive',l:'Exclusive'},
  {v:'popular',l:'Popular'},{v:'clearance',l:'Clearance'},{v:'limited',l:'Limited'},{v:'custom',l:'Custom'},
]
const DISCOUNT_TYPES: {v: DiscountType; l: string}[] = [
  {v:'percentage',l:'Percentage (%)'},{v:'fixed',l:'Fixed Amount'},
]
const VIS_PAGES: {v: VisibilityPage; l: string}[] = [
  {v:'entire_website',l:'Entire Website'},{v:'homepage',l:'Homepage Only'},
  {v:'product_pages',l:'Product Pages'},{v:'category_pages',l:'Category Pages'},{v:'checkout',l:'Checkout'},
]
const FREQS: {v: DisplayFrequency; l: string}[] = [
  {v:'every_visit',l:'Every Visit'},{v:'once_per_session',l:'Once Per Session'},
  {v:'once_per_day',l:'Once Per Day'},{v:'once_per_3_days',l:'Once Every 3 Days'},
  {v:'once_per_7_days',l:'Once Every 7 Days'},{v:'only_once',l:'Only Once Ever'},
]
const AUDIENCES: {v: AudienceTarget; l: string}[] = [
  {v:'everyone',l:'Everyone'},{v:'first_time_visitors',l:'First-time Visitors'},
  {v:'returning_visitors',l:'Returning Visitors'},{v:'logged_in_users',l:'Logged-in Users'},{v:'guests',l:'Guests'},
]
const STATUSES: {v: CampaignStatus; l: string}[] = [
  {v:'draft',l:'Draft'},{v:'scheduled',l:'Scheduled'},{v:'active',l:'Active'},{v:'expired',l:'Expired'},{v:'disabled',l:'Disabled'},
]
const PAGE_ROUTES = [
  {v:'/',l:'Homepage'},
  {v:'/products',l:'Products'},
  {v:'/categories',l:'Categories'},
  {v:'/about',l:'About Us'},
  {v:'/contact',l:'Contact'},
  {v:'/cart',l:'Shopping Cart'},
  {v:'/checkout',l:'Checkout'},
  {v:'/account',l:'My Account'},
  {v:'/blog',l:'Blog'},
  {v:'/testimonials',l:'Testimonials'},
  {v:'/track-order',l:'Track Order'},
  {v:'/search',l:'Search'},
]
const CTA_PRESETS = ['Shop Now','View Products','Book Now','Learn More','Contact Us','WhatsApp']

const DEFAULT: {
  title: string; subtitle: string; description: string; type: CampaignType; status: CampaignStatus;
  images: ICampaignImage[]; badge: ICampaignBadge | undefined;
  cta: { enabled: boolean; text: string; url: string; isExternal: boolean };
  schedule: { startDate: Date | string; endDate: Date | undefined };
  display: { mode: DisplayMode; position: DisplayPosition; animation: AnimationType; background: { type: BackgroundType; color: string; gradientFrom: string; gradientTo: string; gradientDirection: string; imageUrl: string | undefined }; overlay: OverlayType; delaySeconds: number; showCloseButton: boolean; textColor: string };
  visibility: { pages: VisibilityPage[]; frequency: DisplayFrequency };
  audience: { targets: AudienceTarget[] };
  countdown: { enabled: boolean; endsAt: Date | undefined };
  coupon: { enabled: boolean; code: string; copyConfirmationText: string };
  priority: number;
} = {
  title: '', subtitle: '', description: '',
  type: 'promotion', status: 'draft', images: [], badge: undefined,
  cta: { enabled: false, text: '', url: '', isExternal: false },
  schedule: { startDate: '', endDate: undefined },
  display: {
    mode: 'popup_modal', position: 'center', animation: 'fade',
    background: { type: 'color', color: '#5a1e5c', gradientFrom: '#5a1e5c', gradientTo: '#9c4a9e', gradientDirection: 'to right', imageUrl: undefined },
    overlay: 'dark', delaySeconds: 0, showCloseButton: true, textColor: '#ffffff',
  },
  visibility: { pages: ['entire_website'], frequency: 'once_per_session' },
  audience: { targets: ['everyone'] },
  countdown: { enabled: false, endsAt: undefined },
  coupon: { enabled: false, code: '', copyConfirmationText: 'Code copied!' },
  priority: 0,
}

export function CampaignForm({ initialData, campaignId }: { initialData?: Partial<ICampaign>; campaignId?: string }) {
  const router = useRouter()
  const toast = useToast()
  const isEdit = Boolean(campaignId)
  const [fd, setFd] = useState({ ...DEFAULT, ...(initialData ? {
    title: initialData.title ?? '', subtitle: initialData.subtitle ?? '', description: initialData.description ?? '',
    type: initialData.type ?? DEFAULT.type, status: initialData.status ?? DEFAULT.status, priority: initialData.priority ?? 0,
    images: (initialData.images ?? []) as ICampaignImage[], badge: initialData.badge,
    cta: initialData.cta ?? DEFAULT.cta,
    schedule: { startDate: initialData.schedule?.startDate ?? '', endDate: initialData.schedule?.endDate },
    display: { ...DEFAULT.display, ...initialData.display, background: { ...DEFAULT.display.background, ...(initialData.display?.background ?? {}) } },
    visibility: initialData.visibility ?? DEFAULT.visibility,
    audience: initialData.audience ?? DEFAULT.audience,
    countdown: { enabled: initialData.countdown?.enabled ?? false, endsAt: initialData.countdown?.endsAt },
    coupon: { enabled: initialData.coupon?.enabled ?? false, code: initialData.coupon?.code ?? '', copyConfirmationText: initialData.coupon?.copyConfirmationText ?? 'Code copied!' },
  } : {}) })
  const [badgeType, setBadgeType] = useState<BadgeType | ''>(initialData?.badge?.type ?? '')
  const [badgeCustom, setBadgeCustom] = useState(initialData?.badge?.customText ?? '')
  const [discType, setDiscType] = useState<DiscountType>(initialData?.badge?.discountType ?? 'percentage')
  const [discValue, setDiscValue] = useState(initialData?.badge?.discountValue ?? 0)
  const [startStr, setStartStr] = useState(toLocal(initialData?.schedule?.startDate))
  const [endStr, setEndStr] = useState(toLocal(initialData?.schedule?.endDate))
  const [cdStr, setCdStr] = useState(toLocal(initialData?.countdown?.endsAt))
  const [selectedPage, setSelectedPage] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  type D = typeof fd; type Disp = D['display']; type Bg = Disp['background']
  const s = <K extends keyof D>(k: K, v: D[K]) => setFd(p => ({ ...p, [k]: v }))
  const sd = <K extends keyof Disp>(k: K, v: Disp[K]) => setFd(p => ({ ...p, display: { ...p.display, [k]: v } }))
  const sb = <K extends keyof Bg>(k: K, v: Bg[K]) => setFd(p => ({ ...p, display: { ...p.display, background: { ...p.display.background, [k]: v } } }))
  const tPage = (pg: VisibilityPage) => { const cur = fd.visibility.pages; setFd(p => ({ ...p, visibility: { ...p.visibility, pages: cur.includes(pg) ? cur.filter(x => x !== pg) : [...cur, pg] } })) }
  const tAud = (a: AudienceTarget) => { const cur = fd.audience.targets; setFd(p => ({ ...p, audience: { ...p.audience, targets: cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a] } })) }
  const setDev = (dev: 'desktop'|'mobile', url: string) => setFd(p => ({ ...p, images: [...p.images.filter(i => i.device !== dev), { url, device: dev, order: 0, alt: '' }] }))
  const rmDev = (dev: 'desktop'|'mobile') => setFd(p => ({ ...p, images: p.images.filter(i => i.device !== dev) }))
  const addCar = (url: string) => { const n = fd.images.filter(i => i.device === 'carousel').length; setFd(p => ({ ...p, images: [...p.images, { url, device: 'carousel', order: n, alt: '' }] })) }
  const rmCar = (idx: number) => { const c = fd.images.filter(i => i.device === 'carousel'); setFd(p => ({ ...p, images: p.images.filter(i => i !== c[idx]) })) }
  const handlePageSelect = (page: string) => {
    setSelectedPage(page)
    if (page) {
      setFd(p => ({ ...p, cta: { ...p.cta, url: page } }))
    }
  }
  function validate() {
    const e: Record<string,string> = {}
    if (!fd.title.trim()) e.title = 'Title is required'
    else if (fd.title.length > 120) e.title = 'Max 120 characters'
    if (!startStr) e.start = 'Start date required'
    if (endStr && startStr && new Date(endStr) <= new Date(startStr)) e.end = 'End must be after start'
    setErrors(e); return !Object.keys(e).length
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!validate()) return; setSaving(true)
    try {
      const badge = badgeType ? { type: badgeType, ...(badgeType==='custom'?{customText:badgeCustom}:{}), ...(fd.type==='discount'?{discountType:discType,discountValue:discValue}:{}) } : undefined
      const body = { ...fd, badge, schedule: { startDate: new Date(startStr), ...(endStr?{endDate:new Date(endStr)}:{}) }, countdown: { enabled: fd.countdown.enabled, ...(fd.countdown.enabled&&cdStr?{endsAt:new Date(cdStr)}:{}) }, visibility: { ...fd.visibility, pages: fd.visibility.pages.length ? fd.visibility.pages : ['entire_website'] }, audience: { targets: fd.audience.targets.length ? fd.audience.targets : ['everyone'] } }
      const res = await fetch(isEdit ? `/api/admin/campaigns/${campaignId}` : '/api/admin/campaigns', { method: isEdit?'PATCH':'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      toast.success('Campaign saved'); router.push('/admin/campaigns')
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }
  const dImg = fd.images.find(i => i.device==='desktop')
  const mImg = fd.images.find(i => i.device==='mobile')
  const cImgs = fd.images.filter(i => i.device==='carousel')
  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/campaigns"><Button type="button" variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button></Link>
          <div><h1 className="text-2xl font-bold">{isEdit?'Edit Campaign':'New Campaign'}</h1></div>
        </div>
        <Button type="submit" disabled={saving} size="sm">{saving?<Loader2 className="w-4 h-4 mr-2 animate-spin"/>:<Save className="w-4 h-4 mr-2"/>}{saving?'Saving…':'Save Campaign'}</Button>
      </div>
      <Tabs defaultValue="basic">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="basic">Basic Info</TabsTrigger><TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger><TabsTrigger value="visibility">Visibility</TabsTrigger>
          <TabsTrigger value="extras">Extras</TabsTrigger><TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="mt-4"><Card><CardHeader><CardTitle>Basic Information</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><Label>Title <span className="text-destructive">*</span></Label><Input value={fd.title} maxLength={120} onChange={e=>{s('title',e.target.value);if(errors.title)setErrors(p=>({...p,title:''}))}} placeholder="Campaign title" className="mt-1"/>{errors.title&&<p className="text-sm text-destructive mt-1">{errors.title}</p>}<p className="text-xs text-muted-foreground mt-1">{fd.title.length}/120</p></div>
          <div><Label>Subtitle</Label><Input value={fd.subtitle??''} maxLength={200} onChange={e=>s('subtitle',e.target.value)} placeholder="Optional" className="mt-1"/></div>
          <div><Label>Description</Label><Textarea value={fd.description??''} maxLength={1000} rows={3} onChange={e=>s('description',e.target.value)} className="mt-1"/></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Type <span className="text-destructive">*</span></Label><Select value={fd.type} onValueChange={v=>s('type',v as CampaignType)}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent>{TYPES.map(t=><SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Status</Label><Select value={fd.status} onValueChange={v=>s('status',v as CampaignStatus)}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent>{STATUSES.map(st=><SelectItem key={st.v} value={st.v}>{st.l}</SelectItem>)}</SelectContent></Select></div>
          </div>
        </CardContent></Card></TabsContent>
        <TabsContent value="media" className="mt-4"><Card><CardHeader><CardTitle>Images</CardTitle></CardHeader><CardContent className="space-y-6">
          <div><Label className="mb-2 block">Desktop</Label><ImageUpload currentImage={dImg?.url} onUpload={url=>setDev('desktop',url)} onRemove={()=>rmDev('desktop')}/></div>
          <div><Label className="mb-2 block">Mobile</Label><ImageUpload currentImage={mImg?.url} onUpload={url=>setDev('mobile',url)} onRemove={()=>rmDev('mobile')}/></div>
          <div><Label className="mb-2 block">Carousel ({cImgs.length}/10)</Label>
            {cImgs.length>0&&<div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">{cImgs.map((img,i)=><div key={i} className="relative group aspect-square"><img src={img.url} alt="" className="w-full h-full object-cover rounded border"/><button type="button" onClick={()=>rmCar(i)} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button></div>)}</div>}
            {cImgs.length<10&&<ImageUpload onUpload={url=>addCar(url)}/>}
          </div>
        </CardContent></Card></TabsContent>
        <TabsContent value="display" className="mt-4"><Card><CardHeader><CardTitle>Display Settings</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Mode</Label><Select value={fd.display.mode} onValueChange={v=>sd('mode',v as DisplayMode)}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent>{MODES.map(m=><SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Position</Label><Select value={fd.display.position} onValueChange={v=>sd('position',v as DisplayPosition)}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent>{POSITIONS.map(p=><SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Animation</Label><Select value={fd.display.animation} onValueChange={v=>sd('animation',v as AnimationType)}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent>{ANIMS.map(a=><SelectItem key={a.v} value={a.v}>{a.l}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Overlay</Label><Select value={fd.display.overlay} onValueChange={v=>sd('overlay',v as OverlayType)}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent>{OVERLAYS.map(o=><SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label>Background</Label><Select value={fd.display.background.type} onValueChange={v=>sb('type',v as BackgroundType)}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent>{BG_TYPES.map(b=><SelectItem key={b.v} value={b.v}>{b.l}</SelectItem>)}</SelectContent></Select></div>
          {fd.display.background.type==='color'&&<div className="flex gap-3 items-center"><Label>Color</Label><input type="color" value={fd.display.background.color} onChange={e=>sb('color',e.target.value)} className="h-9 w-14 rounded border"/><Input value={fd.display.background.color} onChange={e=>sb('color',e.target.value)} className="w-32"/></div>}
          {fd.display.background.type==='gradient'&&<div className="space-y-2">
            <div className="flex gap-3 items-center"><Label className="w-12">From</Label><input type="color" value={fd.display.background.gradientFrom} onChange={e=>sb('gradientFrom',e.target.value)} className="h-9 w-14 rounded border"/><Input value={fd.display.background.gradientFrom} onChange={e=>sb('gradientFrom',e.target.value)} className="w-32"/></div>
            <div className="flex gap-3 items-center"><Label className="w-12">To</Label><input type="color" value={fd.display.background.gradientTo} onChange={e=>sb('gradientTo',e.target.value)} className="h-9 w-14 rounded border"/><Input value={fd.display.background.gradientTo} onChange={e=>sb('gradientTo',e.target.value)} className="w-32"/></div>
            <div><Label>Direction</Label><Input value={fd.display.background.gradientDirection} onChange={e=>sb('gradientDirection',e.target.value)} className="mt-1" placeholder="to right"/></div>
          </div>}
          {fd.display.background.type==='image'&&<div><Label className="mb-2 block">BG Image</Label><ImageUpload currentImage={fd.display.background.imageUrl} onUpload={url=>sb('imageUrl',url)} onRemove={()=>sb('imageUrl',undefined)}/></div>}
          <div className="flex gap-3 items-center"><Label>Text Color</Label><input type="color" value={fd.display.textColor??'#ffffff'} onChange={e=>sd('textColor',e.target.value)} className="h-9 w-14 rounded border"/><Input value={fd.display.textColor??'#ffffff'} onChange={e=>sd('textColor',e.target.value)} className="w-32"/></div>
          <div><Label>Delay (s)</Label><Input type="number" min={0} max={60} value={fd.display.delaySeconds} onChange={e=>sd('delaySeconds',Number(e.target.value))} className="mt-1 w-24"/></div>
          <div className="flex gap-3 items-center"><Switch checked={fd.display.showCloseButton} onCheckedChange={v=>sd('showCloseButton',v)}/><Label>Show Close Button</Label></div>
        </CardContent></Card></TabsContent>
        <TabsContent value="visibility" className="mt-4 space-y-4">
          <Card><CardHeader><CardTitle>Pages</CardTitle></CardHeader><CardContent className="space-y-2">{VIS_PAGES.map(p=><label key={p.v} className="flex gap-2 items-center cursor-pointer"><input type="checkbox" checked={fd.visibility.pages.includes(p.v)} onChange={()=>tPage(p.v)} className="rounded"/><span className="text-sm">{p.l}</span></label>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Frequency &amp; Audience</CardTitle></CardHeader><CardContent className="space-y-4">
            <div><Label>Display Frequency</Label><Select value={fd.visibility.frequency} onValueChange={v=>setFd(p=>({...p,visibility:{...p.visibility,frequency:v as DisplayFrequency}}))}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent>{FREQS.map(f=><SelectItem key={f.v} value={f.v}>{f.l}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2">{AUDIENCES.map(a=><label key={a.v} className="flex gap-2 items-center cursor-pointer"><input type="checkbox" checked={fd.audience.targets.includes(a.v)} onChange={()=>tAud(a.v)} className="rounded"/><span className="text-sm">{a.l}</span></label>)}</div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="extras" className="mt-4 space-y-4">
          <Card><CardHeader><CardTitle>Badge</CardTitle></CardHeader><CardContent className="space-y-3">
            <Select value={badgeType || 'none'} onValueChange={v=>setBadgeType(v==='none' ? '' : v as BadgeType)}><SelectTrigger><SelectValue placeholder="No badge"/></SelectTrigger><SelectContent><SelectItem value="none">No Badge</SelectItem>{BADGES.map(b=><SelectItem key={b.v} value={b.v}>{b.l}</SelectItem>)}</SelectContent></Select>
            {badgeType==='custom'&&<Input value={badgeCustom} onChange={e=>setBadgeCustom(e.target.value)} maxLength={30} placeholder="Custom text"/>}
            {badgeType&&fd.type==='discount'&&<div className="grid grid-cols-2 gap-3"><Select value={discType} onValueChange={v=>setDiscType(v as DiscountType)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{DISCOUNT_TYPES.map(d=><SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}</SelectContent></Select><Input type="number" min={0} value={discValue} onChange={e=>setDiscValue(Number(e.target.value))}/></div>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Call to Action</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="flex gap-3 items-center"><Switch checked={fd.cta.enabled} onCheckedChange={v=>setFd(p=>({...p,cta:{...p.cta,enabled:v}}))}/><Label>Enable CTA</Label></div>
            {fd.cta.enabled&&<><Input value={fd.cta.text} onChange={e=>setFd(p=>({...p,cta:{...p.cta,text:e.target.value}}))} placeholder="Button label" className="mt-1"/>
            <div className="flex gap-2 flex-wrap">{CTA_PRESETS.map(pr=><button key={pr} type="button" onClick={()=>setFd(p=>({...p,cta:{...p.cta,text:pr}}))} className="text-xs px-2 py-1 rounded-full border hover:bg-muted">{pr}</button>)}</div>
            <div className="space-y-2">
              <Label>Link to Page (optional)</Label>
              <Select value={selectedPage} onValueChange={handlePageSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a page to auto-fill URL" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_ROUTES.map(pg=>(<SelectItem key={pg.v} value={pg.v}>{pg.l}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Input value={fd.cta.url} onChange={e=>setFd(p=>({...p,cta:{...p.cta,url:e.target.value}}))} placeholder="URL" className="mt-1"/>
            <div className="flex gap-3 items-center"><Switch checked={fd.cta.isExternal} onCheckedChange={v=>setFd(p=>({...p,cta:{...p.cta,isExternal:v}}))}/><Label>Open in new tab</Label></div></>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Countdown</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="flex gap-3 items-center"><Switch checked={fd.countdown.enabled} onCheckedChange={v=>setFd(p=>({...p,countdown:{...p.countdown,enabled:v}}))}/><Label>Enable</Label></div>
            {fd.countdown.enabled&&<Input type="datetime-local" value={cdStr} onChange={e=>setCdStr(e.target.value)} className="mt-1"/>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Coupon</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="flex gap-3 items-center"><Switch checked={fd.coupon.enabled} onCheckedChange={v=>setFd(p=>({...p,coupon:{...p.coupon,enabled:v}}))}/><Label>Show Coupon</Label></div>
            {fd.coupon.enabled&&<><Input value={fd.coupon.code??''} onChange={e=>setFd(p=>({...p,coupon:{...p.coupon,code:e.target.value}}))} placeholder="SAVE20" className="mt-1 font-mono" maxLength={50}/>
            <Input value={fd.coupon.copyConfirmationText??'Code copied!'} onChange={e=>setFd(p=>({...p,coupon:{...p.coupon,copyConfirmationText:e.target.value}}))} className="mt-1"/></>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Priority</CardTitle></CardHeader><CardContent>
            <Input type="number" min={0} max={100} value={fd.priority} onChange={e=>s('priority',Math.min(100,Math.max(0,Number(e.target.value))))} className="w-24"/>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="schedule" className="mt-4"><Card><CardHeader><CardTitle>Schedule</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><Label>Start Date &amp; Time <span className="text-destructive">*</span></Label><Input type="datetime-local" value={startStr} onChange={e=>{setStartStr(e.target.value);if(errors.start)setErrors(p=>({...p,start:''}))}} className="mt-1"/>{errors.start&&<p className="text-sm text-destructive mt-1">{errors.start}</p>}</div>
          <div><Label>End Date &amp; Time <span className="text-muted-foreground text-xs">(optional)</span></Label><Input type="datetime-local" value={endStr} onChange={e=>{setEndStr(e.target.value);if(errors.end)setErrors(p=>({...p,end:''}))}} className="mt-1"/>{errors.end&&<p className="text-sm text-destructive mt-1">{errors.end}</p>}<p className="text-xs text-muted-foreground mt-1">Leave empty for no expiry.</p></div>
        </CardContent></Card></TabsContent>
        <TabsContent value="preview" className="mt-4"><Card><CardHeader><CardTitle>Live Preview</CardTitle></CardHeader><CardContent>
          <div className="rounded-xl overflow-hidden relative min-h-[200px] flex flex-col items-center justify-center p-8 text-center" style={{ background: fd.display.background.type==='gradient'?`linear-gradient(${fd.display.background.gradientDirection},${fd.display.background.gradientFrom},${fd.display.background.gradientTo})`:fd.display.background.type==='image'&&fd.display.background.imageUrl?`url(${fd.display.background.imageUrl}) center/cover`:fd.display.background.color, color: fd.display.textColor }}>
            {fd.display.overlay!=='none'&&<div className={`absolute inset-0 ${fd.display.overlay==='dark'?'bg-black/40':'backdrop-blur-sm bg-black/20'}`}/>}
            <div className="relative z-10 space-y-2">
              {badgeType&&<span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20">{badgeType==='custom'?(badgeCustom||'Custom'):badgeType.toUpperCase()}</span>}
              <h2 className="text-2xl font-bold">{fd.title||'Campaign Title'}</h2>
              {fd.subtitle&&<p className="opacity-90">{fd.subtitle}</p>}
              {fd.coupon.enabled&&fd.coupon.code&&<div className="inline-block px-4 py-2 bg-white/20 rounded font-mono font-bold">{fd.coupon.code}</div>}
              {fd.cta.enabled&&fd.cta.text&&<button type="button" className="px-6 py-2 bg-white text-gray-900 rounded-full text-sm font-semibold">{fd.cta.text}</button>}
            </div>
            {fd.display.showCloseButton&&<button type="button" className="absolute top-3 right-3 opacity-70"><X className="w-5 h-5"/></button>}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">{MODES.find(m=>m.v===fd.display.mode)?.l} · {fd.display.delaySeconds}s delay</p>
        </CardContent></Card></TabsContent>
      </Tabs>
      <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving?<Loader2 className="w-4 h-4 mr-2 animate-spin"/>:<Save className="w-4 h-4 mr-2"/>}{saving?'Saving…':'Save Campaign'}</Button></div>
    </form>
  )
}
