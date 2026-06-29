import mongoose from 'mongoose'

// ─── Enums / Union types ────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'disabled'

export type CampaignType =
  | 'discount'
  | 'promotion'
  | 'new_product'
  | 'new_arrival'
  | 'event'
  | 'announcement'
  | 'holiday'
  | 'clearance'
  | 'limited_time'
  | 'other'

export type DisplayMode =
  | 'popup_modal'
  | 'floating_card'
  | 'announcement_bar'
  | 'slide_in_panel'
  | 'hero_banner'
  | 'full_screen_overlay'
  | 'inline_section'

export type DisplayPosition = 'center' | 'top' | 'bottom_left' | 'bottom_right'

export type AnimationType = 'fade' | 'zoom' | 'slide_up' | 'slide_down' | 'bounce' | 'none'

export type BackgroundType = 'color' | 'gradient' | 'image'

export type OverlayType = 'none' | 'dark' | 'blur'

export type BadgeType =
  | 'sale'
  | 'new'
  | 'hot'
  | 'exclusive'
  | 'popular'
  | 'clearance'
  | 'limited'
  | 'custom'

export type DiscountType = 'percentage' | 'fixed'

export type VisibilityPage =
  | 'homepage'
  | 'product_pages'
  | 'category_pages'
  | 'checkout'
  | 'entire_website'

export type DisplayFrequency =
  | 'every_visit'
  | 'once_per_session'
  | 'once_per_day'
  | 'once_per_3_days'
  | 'once_per_7_days'
  | 'only_once'

export type AudienceTarget =
  | 'everyone'
  | 'first_time_visitors'
  | 'returning_visitors'
  | 'logged_in_users'
  | 'guests'

// ─── Sub-document interfaces ────────────────────────────────────────────────

export interface ICampaignImage {
  url: string
  alt?: string
  device: 'desktop' | 'mobile' | 'carousel'
  order: number
}

export interface ICampaignBadge {
  type: BadgeType
  customText?: string
  discountType?: DiscountType
  discountValue?: number
}

export interface ICampaignCTA {
  enabled: boolean
  text: string
  url: string
  isExternal: boolean
}

export interface ICampaignBackground {
  type: BackgroundType
  color?: string
  gradientFrom?: string
  gradientTo?: string
  gradientDirection?: string
  imageUrl?: string
}

export interface ICampaignDisplay {
  mode: DisplayMode
  position: DisplayPosition
  animation: AnimationType
  background: ICampaignBackground
  overlay: OverlayType
  delaySeconds: number
  showCloseButton: boolean
  textColor?: string
}

export interface ICampaignSchedule {
  startDate: Date
  endDate?: Date
  timezone?: string
}

export interface ICampaignVisibility {
  pages: VisibilityPage[]
  frequency: DisplayFrequency
}

export interface ICampaignAudience {
  targets: AudienceTarget[]
}

export interface ICampaignCountdown {
  enabled: boolean
  endsAt?: Date
}

export interface ICampaignCoupon {
  enabled: boolean
  code?: string
  copyConfirmationText?: string
}

// ─── Main Campaign interface ─────────────────────────────────────────────────

export interface ICampaign {
  _id?: string
  title: string
  subtitle?: string
  description?: string
  type: CampaignType
  status: CampaignStatus

  images: ICampaignImage[]

  badge?: ICampaignBadge
  cta?: ICampaignCTA

  schedule: ICampaignSchedule
  display: ICampaignDisplay
  visibility: ICampaignVisibility
  audience: ICampaignAudience
  countdown?: ICampaignCountdown
  coupon?: ICampaignCoupon

  priority: number

  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

// ─── Analytics interface ─────────────────────────────────────────────────────

export interface ICampaignAnalytics {
  _id?: string
  campaignId: mongoose.Types.ObjectId
  date: Date                // Day-level bucket for daily rollups
  views: number
  clicks: number
  dismissals: number
  uniqueVisitors: number    // approximate via hashed fingerprints
  createdAt?: Date
  updatedAt?: Date
}

// ─── Sub-document schemas ────────────────────────────────────────────────────

const CampaignImageSchema = new mongoose.Schema<ICampaignImage>(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    device: { type: String, enum: ['desktop', 'mobile', 'carousel'], default: 'desktop' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
)

const CampaignBadgeSchema = new mongoose.Schema<ICampaignBadge>(
  {
    type: {
      type: String,
      enum: ['sale', 'new', 'hot', 'exclusive', 'popular', 'clearance', 'limited', 'custom'],
      required: true,
    },
    customText: { type: String },
    discountType: { type: String, enum: ['percentage', 'fixed'] },
    discountValue: { type: Number },
  },
  { _id: false }
)

const CampaignCTASchema = new mongoose.Schema<ICampaignCTA>(
  {
    enabled: { type: Boolean, default: false },
    text: { type: String, default: '' },
    url: { type: String, default: '' },
    isExternal: { type: Boolean, default: false },
  },
  { _id: false }
)

const CampaignBackgroundSchema = new mongoose.Schema<ICampaignBackground>(
  {
    type: { type: String, enum: ['color', 'gradient', 'image'], default: 'color' },
    color: { type: String, default: '#5a1e5c' },
    gradientFrom: { type: String },
    gradientTo: { type: String },
    gradientDirection: { type: String, default: 'to right' },
    imageUrl: { type: String },
  },
  { _id: false }
)

const CampaignDisplaySchema = new mongoose.Schema<ICampaignDisplay>(
  {
    mode: {
      type: String,
      enum: ['popup_modal', 'floating_card', 'announcement_bar', 'slide_in_panel', 'hero_banner', 'full_screen_overlay', 'inline_section'],
      default: 'popup_modal',
    },
    position: {
      type: String,
      enum: ['center', 'top', 'bottom_left', 'bottom_right'],
      default: 'center',
    },
    animation: {
      type: String,
      enum: ['fade', 'zoom', 'slide_up', 'slide_down', 'bounce', 'none'],
      default: 'fade',
    },
    background: { type: CampaignBackgroundSchema, default: () => ({}) },
    overlay: { type: String, enum: ['none', 'dark', 'blur'], default: 'dark' },
    delaySeconds: { type: Number, default: 0 },
    showCloseButton: { type: Boolean, default: true },
    textColor: { type: String, default: '#ffffff' },
  },
  { _id: false }
)

const CampaignScheduleSchema = new mongoose.Schema<ICampaignSchedule>(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    timezone: { type: String, default: 'Africa/Nairobi' },
  },
  { _id: false }
)

const CampaignVisibilitySchema = new mongoose.Schema<ICampaignVisibility>(
  {
    pages: {
      type: [String],
      enum: ['homepage', 'product_pages', 'category_pages', 'checkout', 'entire_website'],
      default: ['entire_website'],
    },
    frequency: {
      type: String,
      enum: ['every_visit', 'once_per_session', 'once_per_day', 'once_per_3_days', 'once_per_7_days', 'only_once'],
      default: 'once_per_session',
    },
  },
  { _id: false }
)

const CampaignAudienceSchema = new mongoose.Schema<ICampaignAudience>(
  {
    targets: {
      type: [String],
      enum: ['everyone', 'first_time_visitors', 'returning_visitors', 'logged_in_users', 'guests'],
      default: ['everyone'],
    },
  },
  { _id: false }
)

const CampaignCountdownSchema = new mongoose.Schema<ICampaignCountdown>(
  {
    enabled: { type: Boolean, default: false },
    endsAt: { type: Date },
  },
  { _id: false }
)

const CampaignCouponSchema = new mongoose.Schema<ICampaignCoupon>(
  {
    enabled: { type: Boolean, default: false },
    code: { type: String },
    copyConfirmationText: { type: String, default: 'Code copied!' },
  },
  { _id: false }
)

// ─── Main Campaign schema ────────────────────────────────────────────────────

const CampaignSchema = new mongoose.Schema<ICampaign>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ['discount', 'promotion', 'new_product', 'new_arrival', 'event', 'announcement', 'holiday', 'clearance', 'limited_time', 'other'],
      default: 'promotion',
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'expired', 'disabled'],
      default: 'draft',
    },

    images: { type: [CampaignImageSchema], default: [] },

    badge: { type: CampaignBadgeSchema },
    cta: { type: CampaignCTASchema, default: () => ({ enabled: false, text: '', url: '', isExternal: false }) },

    schedule: { type: CampaignScheduleSchema, required: true },
    display: { type: CampaignDisplaySchema, default: () => ({}) },
    visibility: { type: CampaignVisibilitySchema, default: () => ({}) },
    audience: { type: CampaignAudienceSchema, default: () => ({}) },
    countdown: { type: CampaignCountdownSchema, default: () => ({ enabled: false }) },
    coupon: { type: CampaignCouponSchema, default: () => ({ enabled: false }) },

    priority: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

// Index for fast active-campaign queries on the public site
CampaignSchema.index({ status: 1, 'schedule.startDate': 1, 'schedule.endDate': 1, priority: -1 })

// ─── Analytics schema ────────────────────────────────────────────────────────

const CampaignAnalyticsSchema = new mongoose.Schema<ICampaignAnalytics>(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    date: { type: Date, required: true },   // truncated to day (00:00 UTC)
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    dismissals: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Unique per campaign per day
CampaignAnalyticsSchema.index({ campaignId: 1, date: 1 }, { unique: true })

// ─── Model exports ────────────────────────────────────────────────────────────

const Campaign =
  mongoose.models.Campaign ||
  mongoose.model<ICampaign>('Campaign', CampaignSchema)

const CampaignAnalytics =
  mongoose.models.CampaignAnalytics ||
  mongoose.model<ICampaignAnalytics>('CampaignAnalytics', CampaignAnalyticsSchema)

export { CampaignAnalytics }
export default Campaign
