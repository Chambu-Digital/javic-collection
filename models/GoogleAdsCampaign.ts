import mongoose from 'mongoose'

export interface IAudienceSegment {
  type: 'location' | 'demographics' | 'interests' | 'custom'
  value: string
  operator?: 'include' | 'exclude'
}

export interface IDailyMetric {
  date: Date
  impressions: number
  clicks: number
  conversions: number
  cost: number
  revenue: number
}

export interface IGoogleAdsCampaign {
  _id?: string
  
  // Campaign basics
  name: string
  description?: string
  
  // Google Ads IDs
  googleCampaignId?: string
  googleAccountId: string
  
  // Campaign configuration
  campaignType: 'search' | 'display' | 'shopping' | 'app' | 'video'
  status: 'active' | 'paused' | 'removed' | 'draft'
  
  // Targeting
  keywords?: string[]
  negativeKeywords?: string[]
  audienceSegments: IAudienceSegment[]
  targetCounties?: string[]
  targetLanguages?: string[]
  
  // Budget & bidding
  dailyBudget: number
  totalBudget: number
  bidStrategy: 'manual' | 'enhanced_cpc' | 'target_cpa' | 'maximize_conversions'
  maxBidAmount?: number
  
  // Links
  landingPageUrl: string
  displayUrl?: string
  
  // Ads
  adCopies: Array<{
    headline: string
    description: string
    callToAction?: string
  }>
  
  // Tracking
  conversionTrackingId?: string
  enableConversionTracking: boolean
  linkedServiceIds?: mongoose.Types.ObjectId[]
  
  // Performance
  metrics: {
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    totalCost: number
    totalRevenue: number
    ctr?: number // click-through rate
    cpc?: number // cost per click
    conversionRate?: number
    roi?: number
  }
  dailyMetrics?: IDailyMetric[]
  
  // Schedule
  startDate: Date
  endDate?: Date
  
  // Sync status
  lastSyncedAt?: Date
  syncStatus: 'synced' | 'pending' | 'failed'
  syncError?: string
  
  // Metadata
  createdBy: mongoose.Types.ObjectId
  adminNotes?: string
  
  createdAt?: Date
  updatedAt?: Date
}

const AudienceSegmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['location', 'demographics', 'interests', 'custom'],
    required: true
  },
  value: { type: String, required: true },
  operator: {
    type: String,
    enum: ['include', 'exclude'],
    default: 'include'
  }
}, { _id: false })

const DailyMetricSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  impressions: { type: Number, default: 0, min: 0 },
  clicks: { type: Number, default: 0, min: 0 },
  conversions: { type: Number, default: 0, min: 0 },
  cost: { type: Number, default: 0, min: 0 },
  revenue: { type: Number, default: 0, min: 0 }
}, { _id: false })

const GoogleAdsCampaignSchema = new mongoose.Schema<IGoogleAdsCampaign>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  
  googleCampaignId: { type: String, sparse: true },
  googleAccountId: { type: String, required: true },
  
  campaignType: {
    type: String,
    enum: ['search', 'display', 'shopping', 'app', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'removed', 'draft'],
    default: 'draft'
  },
  
  keywords: [{ type: String, trim: true }],
  negativeKeywords: [{ type: String, trim: true }],
  audienceSegments: [AudienceSegmentSchema],
  targetCounties: [{ type: String, trim: true }],
  targetLanguages: [{ type: String, trim: true }],
  
  dailyBudget: { type: Number, required: true, min: 0 },
  totalBudget: { type: Number, required: true, min: 0 },
  bidStrategy: {
    type: String,
    enum: ['manual', 'enhanced_cpc', 'target_cpa', 'maximize_conversions'],
    default: 'manual'
  },
  maxBidAmount: { type: Number, min: 0 },
  
  landingPageUrl: { type: String, required: true },
  displayUrl: String,
  
  adCopies: [{
    headline: { type: String, required: true },
    description: { type: String, required: true },
    callToAction: String
  }],
  
  conversionTrackingId: String,
  enableConversionTracking: { type: Boolean, default: true },
  linkedServiceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  
  metrics: {
    totalImpressions: { type: Number, default: 0, min: 0 },
    totalClicks: { type: Number, default: 0, min: 0 },
    totalConversions: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    ctr: { type: Number, min: 0 },
    cpc: { type: Number, min: 0 },
    conversionRate: { type: Number, min: 0 },
    roi: { type: Number }
  },
  dailyMetrics: [DailyMetricSchema],
  
  startDate: { type: Date, required: true, default: Date.now },
  endDate: Date,
  
  lastSyncedAt: Date,
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'failed'],
    default: 'pending'
  },
  syncError: String,
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminNotes: String
}, { timestamps: true })

// Calculate metrics after save
GoogleAdsCampaignSchema.post('save', function() {
  if (this.metrics.totalClicks > 0) {
    this.metrics.ctr = (this.metrics.totalClicks / this.metrics.totalImpressions) * 100
    this.metrics.cpc = this.metrics.totalCost / this.metrics.totalClicks
  }
  
  if (this.metrics.totalConversions > 0) {
    this.metrics.conversionRate = (this.metrics.totalConversions / this.metrics.totalClicks) * 100
  }
  
  if (this.metrics.totalRevenue > 0 && this.metrics.totalCost > 0) {
    this.metrics.roi = ((this.metrics.totalRevenue - this.metrics.totalCost) / this.metrics.totalCost) * 100
  }
})

GoogleAdsCampaignSchema.index({ googleCampaignId: 1, sparse: true })
GoogleAdsCampaignSchema.index({ googleAccountId: 1 })
GoogleAdsCampaignSchema.index({ status: 1, createdAt: -1 })
GoogleAdsCampaignSchema.index({ createdBy: 1 })
GoogleAdsCampaignSchema.index({ 'linkedServiceIds': 1 })
GoogleAdsCampaignSchema.index({ startDate: 1, endDate: 1 })

if (mongoose.models.GoogleAdsCampaign) delete mongoose.models.GoogleAdsCampaign

export default mongoose.model<IGoogleAdsCampaign>('GoogleAdsCampaign', GoogleAdsCampaignSchema)
