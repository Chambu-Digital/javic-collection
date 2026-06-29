# Design Document: Campaign Management

## Overview

The Campaign Management feature adds a complete promotional campaign system to the Javic e-commerce storefront. Administrators create and manage time-bound marketing campaigns (popups, banners, floating cards, etc.) through a multi-section form in the admin dashboard. Active campaigns are served to visitors via a public API and rendered client-side by a `CampaignRenderer` component that enforces audience targeting, display frequency, and scheduling rules entirely in the browser.

The infrastructure is already partially in place: the `Campaign` and `CampaignAnalytics` Mongoose models, the admin and public API routes (CRUD, active campaigns, analytics, tracking), the campaign list page, and the navigation entry all exist. The remaining work covers the form UI (create and edit), the campaign detail/view page, the public `CampaignRenderer`, wiring analytics charts into the admin, and the campaign preview feature.

### Design Goals

- Reuse existing patterns: `ImageUpload`, `useToast`, `PermissionGuard`, `shadcn/ui` components, `recharts` for charts.
- Keep the `CampaignRenderer` a single client component mounted in the root layout so it fetches once per page load.
- Keep status computation server-side (in API routes) using the existing `computeStatus` function; the client never derives status.
- Encode all audience and frequency filtering as pure functions so they are testable in isolation.

---

## Architecture

The feature spans three layers:

```mermaid
graph TD
    subgraph Admin UI
        CL[Campaign List Page]
        CF[CampaignForm component]
        CD[Campaign Detail Page]
        CP[Campaign Preview Panel]
    end

    subgraph Public Storefront
        CRend[CampaignRenderer component]
        CFilter[filterCampaigns util]
        CFreq[shouldShowCampaign util]
    end

    subgraph API Layer
        ADMIN_API[/api/admin/campaigns/]
        ANALYTICS_API[/api/admin/campaigns/id/analytics]
        ACTIVE_API[/api/campaigns/active]
        TRACK_API[/api/campaigns/track]
    end

    subgraph Data Layer
        Campaign[(Campaign collection)]
        CampaignAnalytics[(CampaignAnalytics collection)]
    end

    CL --> ADMIN_API
    CF --> ADMIN_API
    CD --> ADMIN_API
    CD --> ANALYTICS_API
    CRend --> ACTIVE_API
    CRend --> TRACK_API
    ADMIN_API --> Campaign
    ANALYTICS_API --> CampaignAnalytics
    ACTIVE_API --> Campaign
    TRACK_API --> CampaignAnalytics
```

### Key Design Decisions

**Single `CampaignRenderer` in root layout.** Rather than adding campaign rendering to each individual page, the renderer is mounted once in the storefront layout. It receives the current pathname as a prop (via `usePathname`) to perform page-based filtering. This avoids duplicate fetches across page navigations when using client-side routing.

**Pure filtering utilities.** Audience filtering (`filterByAudience`), page filtering (`filterByPage`), and frequency checking (`shouldShowCampaign`) are extracted into a standalone `lib/campaign-client.ts` module. This makes them independently testable without needing to mount a React component.

**`CampaignForm` as a shared component.** Both the new and edit pages render the same `CampaignForm` component. The form accepts an optional `initialData` prop; when present, it pre-populates all fields and uses `PATCH`, otherwise it uses `POST`.

**Recharts for analytics charts.** The project already has `recharts@2.15.4` installed. The campaign detail page uses a `<LineChart>` from recharts to render the daily view/click breakdown, matching the approach used elsewhere in the admin analytics dashboard.

---

## Components and Interfaces

### Admin UI Components

#### `CampaignForm` (`components/admin/campaign-form.tsx`)

The primary form component shared between new and edit pages. Accepts:

```typescript
interface CampaignFormProps {
  initialData?: ICampaign & { _id: string }  // undefined = create mode
  onSuccess?: (campaign: ICampaign) => void
}
```

Internal structure — tabs using `shadcn/ui` `<Tabs>`:

| Tab | Sections |
|-----|----------|
| Basic Info | Title, Subtitle, Description, Type |
| Media | Desktop Image, Mobile Image, Carousel Images |
| Display | Mode, Position, Animation, Background, Overlay, Delay, Close Button, Text Color |
| Visibility & Audience | Visibility Pages, Display Frequency, Audience Targets |
| Extras | Badge, CTA, Countdown, Coupon, Priority |
| Schedule | Start Date, End Date |
| Preview | Desktop / Tablet / Mobile preview tabs |

State is held in a single `formData` object matching `ICampaign`. Validation is run on submit via a local `validate()` function before calling the API.

#### `CampaignPreview` (`components/admin/campaign-preview.tsx`)

A read-only rendering of a campaign using the current `formData`. Accepts a `campaign: Partial<ICampaign>` prop and renders a simplified representation of the campaign display mode, background, text, badge, and CTA. Does **not** fire analytics events — it renders only a visual mock.

Viewport tabs control a CSS `transform: scale()` wrapper:
- Desktop: full width (~1200px container scaled to fit)
- Tablet: 768px scaled to fit
- Mobile: 375px scaled to fit

#### `CampaignDetailPage` (`app/admin/campaigns/[id]/page.tsx`)

Fetches campaign data and analytics from `GET /api/admin/campaigns/[id]`. Displays:
- Header: title, status badge, type badge, priority, edit button
- Overview cards: Total Views, Total Clicks, CTR (%), Dismissals, Unique Visitors
- Daily chart: `<LineChart>` with views and clicks series over last 30 days (data from `GET /api/admin/campaigns/[id]/analytics`)
- Detail sections: Schedule, Display Settings, Visibility Rules, Audience Targets, Badge, CTA, Countdown, Coupon — all read-only

#### `CampaignNewPage` (`app/admin/campaigns/new/page.tsx`)

Thin page that renders `<CampaignForm />` without `initialData`.

#### `CampaignEditPage` (`app/admin/campaigns/[id]/edit/page.tsx`)

Fetches campaign from `GET /api/admin/campaigns/[id]`, then renders `<CampaignForm initialData={campaign} />`. Shows a loading skeleton while fetching.

### Public Components

#### `CampaignRenderer` (`components/campaign-renderer.tsx`)

Client component mounted in the root storefront layout. Lifecycle:

1. On mount, generate or retrieve `visitorId` from `localStorage` (`javic_visitor_id`).
2. Fetch `GET /api/campaigns/active`.
3. Run `filterCampaigns(campaigns, { pathname, isLoggedIn, isFirstVisit })`.
4. For each eligible campaign, call `shouldShowCampaign(campaign, localStorage)` to check frequency.
5. Apply `display.delaySeconds` via `setTimeout`.
6. Render each eligible campaign as its own sub-component based on `display.mode`.
7. On render, call `POST /api/campaigns/track` with `{ campaignId, event: 'view', visitorId }`.
8. On CTA click, call track with `event: 'click'`.
9. On dismiss, call track with `event: 'dismiss'`, update localStorage frequency key, hide campaign.

Sub-components (all within `campaign-renderer.tsx` or a `components/campaigns/` folder):
- `CampaignPopupModal`
- `CampaignFloatingCard`
- `CampaignAnnouncementBar`
- `CampaignSlideInPanel`
- `CampaignHeroBanner`
- `CampaignFullScreenOverlay`
- `CampaignInlineSection`

Each sub-component receives the full `ICampaign` object and `onDismiss`/`onCtaClick` callbacks.

#### `CampaignCountdown` (`components/campaigns/campaign-countdown.tsx`)

Reusable countdown timer component. Accepts `endsAt: Date`. Computes remaining time via `setInterval`. When the timer reaches zero, hides itself (sets internal `expired` state) without unmounting the parent campaign.

### Utility Module

#### `lib/campaign-client.ts`

Pure functions with no React or browser dependencies:

```typescript
// Checks if a campaign's visibility pages match the current page
export function matchesPage(
  pages: VisibilityPage[],
  pathname: string
): boolean

// Filters campaigns to only those matching the current page
export function filterByPage(
  campaigns: ICampaign[],
  pathname: string
): ICampaign[]

// Filters campaigns to only those matching the visitor's audience state
export function filterByAudience(
  campaigns: ICampaign[],
  context: { isLoggedIn: boolean; isFirstVisit: boolean }
): ICampaign[]

// Determines if a campaign should be shown given the stored localStorage state
// Takes the campaign and a record of { [campaignId]: lastShownTimestamp }
export function shouldShowCampaign(
  campaign: ICampaign,
  lastShown: Record<string, number>  // ms since epoch
): boolean

// Combined filter (page + audience + frequency)
export function filterCampaigns(
  campaigns: ICampaign[],
  context: {
    pathname: string
    isLoggedIn: boolean
    isFirstVisit: boolean
    lastShown: Record<string, number>
  }
): ICampaign[]

// Returns CSS animation class for a given AnimationType
export function getAnimationClass(animation: AnimationType): string

// Returns positioning CSS classes for a given DisplayMode + DisplayPosition
export function getPositionClasses(
  mode: DisplayMode,
  position: DisplayPosition
): string
```

---

## Data Models

The `Campaign` and `CampaignAnalytics` models are fully defined in `models/Campaign.ts` and require no schema changes. Key interfaces for the frontend:

### Campaign Status Computation

The `computeStatus` function (already implemented in both API route files) determines status from schedule dates:

```
disabled | draft  →  unchanged
endDate < now     →  expired
startDate <= now  →  active
startDate > now   →  scheduled
```

### Analytics Aggregation

The `GET /api/admin/campaigns/[id]` endpoint returns:
```typescript
{
  campaign: ICampaign,
  analytics: {
    totalViews: number
    totalClicks: number
    totalDismissals: number
    totalUniqueVisitors: number
  }
}
```

The `GET /api/admin/campaigns/[id]/analytics` endpoint returns:
```typescript
{
  rows: Array<{ date: Date; views: number; clicks: number; dismissals: number; uniqueVisitors: number }>
  totals: { totalViews: number; totalClicks: number; totalDismissals: number; totalUniqueVisitors: number; ctr: number }
}
```

### localStorage Schema (Client)

| Key | Type | Purpose |
|-----|------|---------|
| `javic_visitor_id` | `string` (UUID-like) | Stable visitor identifier for analytics |
| `javic_visit_recorded` | `"1"` | Marks visitor as returning on next visit |
| `javic_campaign_{id}_shown` | `string` (ms timestamp) | Last shown timestamp for frequency enforcement |
| `javic_campaign_{id}_session` | `"1"` | Session flag for `once_per_session` |

The `once_per_session` key uses `sessionStorage` instead of `localStorage`.

### Frequency Window Mapping

| Frequency | Window |
|-----------|--------|
| `every_visit` | Always show |
| `once_per_session` | sessionStorage key presence |
| `once_per_day` | 24 hours (86400000 ms) |
| `once_per_3_days` | 72 hours (259200000 ms) |
| `once_per_7_days` | 168 hours (604800000 ms) |
| `only_once` | localStorage key presence (no expiry) |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Title length validation

*For any* string submitted as a campaign title, the form validation should accept it if and only if the trimmed string is non-empty and has length ≤ 120 characters.

**Validates: Requirements 1.1, 12.1**

---

### Property 2: Campaign type must be a valid enum value

*For any* string submitted as the `type` field, the API should reject it if it is not one of the ten valid `CampaignType` values, and accept it if it is.

**Validates: Requirements 1.4**

---

### Property 3: Type change preserves form state

*For any* set of populated form field values, changing the campaign type dropdown should leave all other form fields (title, subtitle, description, images, schedule, display settings, etc.) unchanged.

**Validates: Requirements 1.5**

---

### Property 4: Carousel image list grows by one per addition

*For any* existing list of N carousel images and any new image URL added to it, the resulting list should have length N+1 and contain the new URL.

**Validates: Requirements 2.3**

---

### Property 5: Removing an image removes it from the list

*For any* non-empty image list and any image in that list, after removing that image the list should have length reduced by 1 and should no longer contain that image.

**Validates: Requirements 2.5**

---

### Property 6: Missing badge is omitted from the saved payload

*For any* campaign saved without a badge type selected, the persisted campaign document should have no `badge` field (or `badge` should be `undefined`/`null`).

**Validates: Requirements 3.4**

---

### Property 7: CTA disabled omits CTA from payload

*For any* campaign saved with the CTA toggle disabled, the persisted campaign's `cta.enabled` field should be `false`.

**Validates: Requirements 4.6**

---

### Property 8: End date before start date is always rejected

*For any* pair of dates where `endDate < startDate`, submitting the campaign form should produce a validation error and not call the save API.

**Validates: Requirements 5.3**

---

### Property 9: Status computation from schedule dates

*For any* `startDate` and optional `endDate`, `computeStatus` should return:
- `'expired'` when `endDate` exists and `endDate < now`
- `'active'` when `startDate <= now` and (`endDate` is absent or `endDate >= now`)
- `'scheduled'` when `startDate > now`

**Validates: Requirements 5.4, 5.5, 5.6**

---

### Property 10: Empty visibility pages default to `entire_website`

*For any* campaign payload submitted with an empty or absent `visibility.pages` array, the resulting saved campaign should have `visibility.pages = ['entire_website']`.

**Validates: Requirements 7.3**

---

### Property 11: Empty audience targets default to `everyone`

*For any* campaign payload submitted with an empty or absent `audience.targets` array, the resulting saved campaign should have `audience.targets = ['everyone']`.

**Validates: Requirements 8.2**

---

### Property 12: Countdown is hidden when expired

*For any* campaign where `countdown.enabled` is `true` and `countdown.endsAt` is in the past, rendering the campaign should produce no countdown display element, while the campaign itself remains visible.

**Validates: Requirements 9.3**

---

### Property 13: Priority range validation

*For any* number outside the range [0, 100], submitting it as the `priority` field should be rejected. *For any* number within [0, 100], it should be accepted.

**Validates: Requirements 11.1**

---

### Property 14: Title whitespace rejection

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), submitting it as the campaign title should fail validation with an inline error.

**Validates: Requirements 12.1**

---

### Property 15: Edit form round-trip preserves all fields

*For any* campaign stored in the database, loading the edit form and immediately checking all field values should produce values that match the stored campaign — i.e., no field is dropped, defaulted, or transformed during the load-and-populate cycle.

**Validates: Requirements 13.1**

---

### Property 16: Campaign detail displays correct CTR

*For any* analytics dataset with `totalViews > 0`, the displayed CTR percentage should equal `(totalClicks / totalViews) * 100`, rounded to 2 decimal places. When `totalViews === 0`, CTR should display as `0`.

**Validates: Requirements 14.2, 18.1**

---

### Property 17: Campaign detail renders all required fields

*For any* campaign object, the detail page render should include the campaign title, subtitle, type, status badge, priority, and both schedule dates (start; end if present).

**Validates: Requirements 14.1, 14.5**

---

### Property 18: Duplicate produces a draft copy with modified title

*For any* campaign, the duplicate action should create a new campaign with `status = 'draft'`, `title = originalTitle + ' (Copy)'`, and all other data fields matching the original.

**Validates: Requirements 15.3**

---

### Property 19: Page filter — campaigns are shown only on matching pages

*For any* list of campaigns with varying `visibility.pages` settings and any `pathname`, `filterByPage` should return only campaigns whose `visibility.pages` includes `'entire_website'` or the resolved page type for the given pathname.

**Validates: Requirements 16.2**

---

### Property 20: Audience filter — campaigns match visitor state

*For any* visitor context (`isLoggedIn`, `isFirstVisit`) and any list of campaigns, `filterByAudience` should return only campaigns whose `audience.targets` includes a target applicable to that visitor state.

**Validates: Requirements 16.3**

---

### Property 21: Frequency filter — campaigns respect display windows

*For any* campaign with a `displayFrequency` setting and a `lastShown` timestamp for that campaign, `shouldShowCampaign` should return `false` if the elapsed time since last shown is less than the frequency window, and `true` otherwise (except `only_once`, which permanently returns `false` once shown).

**Validates: Requirements 16.4**

---

### Property 22: Campaigns sorted by priority descending

*For any* list of eligible campaigns with varying `priority` values, `filterCampaigns` (or the renderer) should return them sorted in descending order of priority.

**Validates: Requirements 11.2**

---

### Property 23: Invalid tracking event type returns 400

*For any* string that is not one of `'view'`, `'click'`, or `'dismiss'`, posting it as the `event` field to `POST /api/campaigns/track` should return HTTP 400.

**Validates: Requirements 17.3**

---

### Property 24: Tracking increments the correct counter

*For any* valid campaign ID and valid event type (`view`, `click`, or `dismiss`), posting to `POST /api/campaigns/track` should increment the corresponding counter (`views`, `clicks`, or `dismissals`) in the day bucket by exactly 1.

**Validates: Requirements 17.4, 17.5**

---

### Property 25: Daily chart has one data point per analytics row

*For any* array of N daily `CampaignAnalytics` rows returned by the API, the rendered chart should contain exactly N data points.

**Validates: Requirements 14.3, 18.2**

---

### Property 26: Preview reflects current form values

*For any* form state, the `CampaignPreview` component should render using the current form values — e.g., the background color shown in the preview should match `formData.display.background.color`.

**Validates: Requirements 19.2**

---

### Property 27: Admin API routes reject unauthenticated and non-admin requests

*For any* admin campaign API endpoint (`/api/admin/campaigns`, `/api/admin/campaigns/[id]`, `/api/admin/campaigns/[id]/analytics`), a request with no auth cookie should receive HTTP 401, and a request with a non-admin (`customer`) auth token should receive HTTP 403.

**Validates: Requirements 20.5**

---

## Error Handling

### Form Validation Errors

| Condition | Handling |
|-----------|----------|
| Title empty / whitespace | Inline error below the title field; save button not called |
| Title > 120 chars | Inline error; save blocked |
| Start date missing | Inline error below the start date field |
| End date < start date | Inline error below the end date field |
| Priority outside 0–100 | Clamped to [0, 100] by the `<input min=0 max=100>` attribute; additional JS validation before submit |
| Custom badge text > 30 chars | Inline character counter + error |

### API Error Handling

All API errors follow the existing project pattern: errors from `fetch` throw; the `catch` block calls `toast.error(...)`. The save button re-enables after an error so the user can retry.

For the `CampaignRenderer`, any fetch error or empty response silently renders nothing — the component is non-critical and should never surface errors to the visitor.

### Analytics Tracking Errors

The tracking call (`POST /api/campaigns/track`) is fire-and-forget — the result is not awaited in a blocking way and never shown to the user. The API returns HTTP 200 even on failure (already implemented) to prevent noisy client-side error logs.

### Loading States

| Component | Loading State |
|-----------|--------------|
| `CampaignForm` (edit mode) | Full-page skeleton using `<Skeleton>` components for each field |
| `CampaignDetailPage` analytics | Skeleton cards for metric tiles; placeholder chart area |
| Campaign list | Spinner row (already implemented) |
| `CampaignRenderer` | No loading state — renders nothing until campaigns are fetched |

---

## Testing Strategy

### Unit Tests

Unit tests are focused on specific behavioral examples and edge cases:

- `CampaignForm` validates required fields (title, start date)
- `CampaignForm` blocks submission when end date < start date
- `CampaignForm` in edit mode pre-populates all fields from `initialData`
- `CampaignDetailPage` shows `0` CTR when views are zero
- `CampaignRenderer` renders nothing when fetch fails
- `CampaignCountdown` hides itself after countdown reaches zero

### Property-Based Tests

The project uses TypeScript with React. The recommended PBT library is **fast-check** (`npm install --save-dev fast-check`), which provides strong TypeScript support and integrates cleanly with Jest or Vitest.

Each property test runs a minimum of **100 iterations** to exercise edge cases through randomized inputs.

#### Property test: Status computation (Properties 9)

```typescript
// Feature: campaign-management, Property 9: status computation from schedule dates
fc.assert(
  fc.property(
    fc.date({ min: new Date(Date.now() - 1e10), max: new Date(Date.now() + 1e10) }),
    fc.option(fc.date({ min: new Date(Date.now() - 1e10), max: new Date(Date.now() + 1e10) })),
    (startDate, endDate) => {
      const result = computeStatus('active', startDate, endDate ?? undefined)
      const now = new Date()
      if (endDate && endDate < now) return result === 'expired'
      if (startDate <= now) return result === 'active'
      return result === 'scheduled'
    }
  ),
  { numRuns: 100 }
)
```

#### Property test: Audience filter (Property 20)

```typescript
// Feature: campaign-management, Property 20: audience filter matches visitor state
fc.assert(
  fc.property(
    fc.array(fc.record({ audience: fc.record({ targets: fc.array(fc.constantFrom(...AUDIENCE_VALUES)) }) })),
    fc.boolean(),
    fc.boolean(),
    (campaigns, isLoggedIn, isFirstVisit) => {
      const result = filterByAudience(campaigns as any, { isLoggedIn, isFirstVisit })
      return result.every(c => audienceMatches(c.audience.targets, isLoggedIn, isFirstVisit))
    }
  ),
  { numRuns: 100 }
)
```

#### Property test: Frequency filter (Property 21)

```typescript
// Feature: campaign-management, Property 21: frequency filter respects display windows
fc.assert(
  fc.property(
    fc.constantFrom(...FREQUENCY_VALUES),
    fc.nat(),  // elapsed ms
    (frequency, elapsed) => {
      const campaignId = 'test-id'
      const lastShown = { [campaignId]: Date.now() - elapsed }
      const campaign = { _id: campaignId, visibility: { frequency } } as any
      const result = shouldShowCampaign(campaign, lastShown)
      const window = FREQUENCY_WINDOWS[frequency]
      if (frequency === 'every_visit') return result === true
      if (frequency === 'only_once') return result === false
      return result === (elapsed >= window)
    }
  ),
  { numRuns: 100 }
)
```

#### Property test: Analytics CTR (Property 16)

```typescript
// Feature: campaign-management, Property 16: campaign detail displays correct CTR
fc.assert(
  fc.property(
    fc.nat(100000),  // totalViews
    fc.nat(100000),  // totalClicks
    (totalViews, totalClicks) => {
      const ctr = computeCTR(totalViews, totalClicks)
      if (totalViews === 0) return ctr === 0
      return Math.abs(ctr - (totalClicks / totalViews) * 100) < 0.01
    }
  ),
  { numRuns: 100 }
)
```

#### Property test: Page filter (Property 19)

```typescript
// Feature: campaign-management, Property 19: page filter shows only matching pages
fc.assert(
  fc.property(
    fc.array(fc.record({ visibility: fc.record({ pages: fc.array(fc.constantFrom(...PAGE_VALUES)) }) })),
    fc.constantFrom('/', '/products/slug', '/categories/slug', '/checkout'),
    (campaigns, pathname) => {
      const result = filterByPage(campaigns as any, pathname)
      const resolvedPage = resolvePageType(pathname)
      return result.every(c =>
        c.visibility.pages.includes('entire_website') ||
        c.visibility.pages.includes(resolvedPage)
      )
    }
  ),
  { numRuns: 100 }
)
```

#### Property test: Tracking counter increment (Property 24)

```typescript
// Feature: campaign-management, Property 24: tracking increments the correct counter
// Uses mocked CampaignAnalytics.findOneAndUpdate to capture $inc arguments
fc.assert(
  fc.property(
    fc.constantFrom('view', 'click', 'dismiss'),
    async (eventType) => {
      const { inc } = await simulateTrackEvent(validCampaignId, eventType)
      const expectedField = { view: 'views', click: 'clicks', dismiss: 'dismissals' }[eventType]
      return inc[expectedField] === 1
    }
  ),
  { numRuns: 100 }
)
```

### Integration Tests

Integration tests (using Jest + `mongodb-memory-server`) cover:

- Admin API returns 401 for unauthenticated requests and 403 for non-admin tokens (Property 27)
- `POST /api/campaigns/track` with invalid event type returns 400 (Property 23)
- Duplicate action creates correct copy (Property 18)
- Campaign status auto-computed on save via POST/PATCH

### Notes on Test Setup

- PBT runs via `vitest --run` (single execution, no watch mode)
- `lib/campaign-client.ts` has zero browser/React dependencies so it can be imported directly in test files
- The `computeStatus` function should be extracted from the API route files into `lib/campaign-scheduler.ts` to make it importable in tests without triggering Next.js server-only imports
