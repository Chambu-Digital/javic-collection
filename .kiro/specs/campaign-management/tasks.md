# Implementation Plan: Campaign Management

## Overview

The Campaign model, all API routes (CRUD, analytics, tracking, public active endpoint), the campaign list page with all actions (view, edit, duplicate, activate, disable/enable, delete), and the page scaffolding for the new and edit pages already exist. The remaining work is:

1. Extract `computeStatus` into a shared utility (`lib/campaign-scheduler.ts`)
2. Build the `CampaignForm` component body (shared by new and edit pages)
3. Build the `CampaignPreview` component
4. Wire the form into the new and edit page shells
5. Build the campaign detail page
6. Build `lib/campaign-client.ts` — pure filtering/utility functions
7. Build the `CampaignRenderer` and its sub-components
8. Mount `CampaignRenderer` in the root layout
9. Build `CampaignCountdown`
10. Install `fast-check` and write property-based tests

All code is TypeScript/React, matching the project's existing Next.js 14 App Router, Tailwind CSS, shadcn/ui, and Mongoose patterns.

---

## Tasks

- [ ] 1. Extract `computeStatus` into a shared utility
  - [ ] 1.1 Create `lib/campaign-scheduler.ts` that exports `computeStatus(currentStatus, startDate, endDate?): CampaignStatus`
    - Copy the `computeStatus` function from `app/api/admin/campaigns/route.ts` into this file
    - Add the `CampaignStatus` return type using the existing type from `models/Campaign.ts`
    - Export it so both API routes and test files can import it without triggering Next.js server-only restrictions
    - _Requirements: 5.4, 5.5, 5.6_

- [ ] 2. Build `lib/campaign-client.ts` — pure client-side filtering utilities
  - [ ] 2.1 Implement `matchesPage`, `filterByPage`, `filterByAudience`, `shouldShowCampaign`, `filterCampaigns`
    - All functions are pure (no React, no browser globals as required parameters)
    - `matchesPage` checks if a `VisibilityPage[]` includes `'entire_website'` or the page type matching the pathname
    - `filterByPage` applies `matchesPage` to a campaign list
    - `filterByAudience` filters by `audience.targets` using `isLoggedIn` and `isFirstVisit` context
    - `shouldShowCampaign` accepts `campaign` and `lastShown: Record<string, number>` (ms timestamps); returns `boolean` per the frequency window table from the design
    - `filterCampaigns` combines page + audience + frequency filters and sorts by priority descending
    - Export `FREQUENCY_WINDOWS` constant mapping `DisplayFrequency` to ms thresholds
    - _Requirements: 16.2, 16.3, 16.4, 11.2_
  - [ ] 2.2 Implement `getAnimationClass` and `getPositionClasses` helpers
    - `getAnimationClass(animation: AnimationType): string` returns a Tailwind/CSS animation class string
    - `getPositionClasses(mode: DisplayMode, position: DisplayPosition): string` returns positioning Tailwind classes
    - _Requirements: 16.5, 16.6_
  - [ ]* 2.3 Write property tests for `filterByPage` (Property 19)
    - **Property 19: Page filter — campaigns are shown only on matching pages**
    - **Validates: Requirements 16.2**
    - Install `fast-check` as a dev dependency (`npm install --save-dev fast-check@3.22.0`) if not present
    - Create `__tests__/campaign-client.test.ts`
    - Use `fc.array` of campaign-like objects with random `visibility.pages` and `fc.constantFrom` for pathname values
    - Assert every result's `visibility.pages` includes `'entire_website'` or the resolved page type
    - Run with `npx vitest --run __tests__/campaign-client.test.ts` (or Jest equivalent)
  - [ ]* 2.4 Write property tests for `filterByAudience` (Property 20)
    - **Property 20: Audience filter — campaigns match visitor state**
    - **Validates: Requirements 16.3**
    - Use `fc.boolean()` for `isLoggedIn` and `isFirstVisit`; random `audience.targets` arrays
    - Assert every result's targets are applicable to the given visitor state
  - [ ]* 2.5 Write property tests for `shouldShowCampaign` (Property 21)
    - **Property 21: Frequency filter respects display windows**
    - **Validates: Requirements 16.4**
    - Use `fc.constantFrom(...FREQUENCY_VALUES)` and `fc.nat()` for elapsed ms
    - Assert return value matches expected boolean per `FREQUENCY_WINDOWS` table

- [ ] 3. Build the `CampaignForm` component
  - [ ] 3.1 Create `components/admin/campaign-form.tsx` — form skeleton with state and validation
    - Define `CampaignFormProps` interface (`initialData?: ICampaign & { _id: string }`, `onSuccess?`)
    - Initialize `formData` state with default values matching the `ICampaign` schema defaults
    - Implement `validate()` function covering: title non-empty (trimmed), title ≤ 120 chars, start date present, end date > start date if both set, priority in [0, 100]
    - Wire submit handler: `POST /api/admin/campaigns` for new, `PATCH /api/admin/campaigns/[id]` for edit
    - On success: call `useToast` success, redirect to `/admin/campaigns`
    - On error: call `useToast` error, re-enable save button
    - Disable save button and show `<Loader2>` spinner during submission
    - Wrap the whole component in `PermissionGuard` checking `CAMPAIGNS_CREATE` or `CAMPAIGNS_EDIT` based on mode
    - _Requirements: 12.1–12.6, 13.4, 20.1–20.3_
  - [ ] 3.2 Implement the Basic Info tab
    - Title field: `<Input>` with max 120 chars, inline error display, character counter
    - Subtitle field: optional `<Input>` with max 200 chars
    - Description field: optional `<Textarea>`
    - Type dropdown: `<Select>` with all 10 `CampaignType` values from the existing `TYPES` constant in the page scaffolding
    - Changing type must not reset other fields — verify with a controlled state update
    - _Requirements: 1.1–1.5_
  - [ ] 3.3 Implement the Media tab
    - Desktop image slot: `<ImageUpload onUpload={...} currentImage={...} onRemove={...} />`
    - Mobile image slot: same pattern
    - Carousel images: dynamic list — render one `<ImageUpload>` per existing carousel image plus an "Add Image" button that appends a new slot; include a remove button per slot
    - _Requirements: 2.1–2.6_
  - [ ] 3.4 Implement the Display Settings tab
    - Mode: `<Select>` with all 7 `DisplayMode` values
    - Position: `<Select>` with 4 `DisplayPosition` values
    - Animation: `<Select>` with 6 `AnimationType` values
    - Background Type: `<Select>` with 3 `BackgroundType` values; conditionally show color picker (type=color), two color pickers + direction input (type=gradient), or `<ImageUpload>` (type=image)
    - Overlay: `<Select>` with 3 `OverlayType` values
    - Delay: `<Input type="number" min={0} max={60} />`
    - Show Close Button: `<Switch>`
    - Text Color: `<Input type="color">`
    - _Requirements: 6.1–6.11_
  - [ ] 3.5 Implement the Visibility & Audience tab
    - Visibility Pages: checkbox group using `VIS_PAGES` constant; default to `['entire_website']` when nothing selected on save
    - Display Frequency: `<Select>` using `FREQS` constant
    - Audience Targets: checkbox group using `AUDIENCES` constant; default to `['everyone']` when nothing selected on save
    - _Requirements: 7.1–7.3, 8.1–8.2_
  - [ ] 3.6 Implement the Extras tab (Badge, CTA, Priority)
    - Badge section: optional badge type `<Select>` (8 values); show custom text input when type=`custom`; show discount type + value fields when campaign type=`discount`; when no badge type selected, omit badge from payload
    - CTA section: `<Switch>` to enable/disable; when enabled show label input with preset suggestions (Shop Now, View Products, Book Now, Learn More, Contact Us, WhatsApp), URL input, and external toggle; when disabled, set `cta.enabled = false`
    - Priority: `<Input type="number" min={0} max={100} defaultValue={0} />`
    - _Requirements: 3.1–3.4, 4.1–4.6, 11.1_
  - [ ] 3.7 Implement the Countdown and Coupon sections (within Extras tab or a dedicated section)
    - Countdown: `<Switch>` to enable; when enabled show datetime input for `countdown.endsAt` (default to campaign end date if set)
    - Coupon: `<Switch>` to enable; when enabled show code input and copy confirmation message input (default "Code copied!")
    - _Requirements: 9.1–9.2, 10.1–10.3_
  - [ ] 3.8 Implement the Schedule tab
    - Start Date: required `<Input type="datetime-local">`; show inline error if empty on submit
    - End Date: optional `<Input type="datetime-local">`; show inline error if end < start
    - _Requirements: 5.1–5.3_
  - [ ]* 3.9 Write property tests for form validation logic (Properties 1, 8, 13, 14)
    - **Property 1: Title length validation** — accepts trimmed non-empty strings ≤ 120 chars; rejects empty/whitespace/> 120
    - **Property 8: End date before start date is always rejected**
    - **Property 13: Priority range validation** — rejects outside [0, 100], accepts within
    - **Property 14: Title whitespace rejection**
    - **Validates: Requirements 1.1, 5.3, 11.1, 12.1**
    - Extract `validate()` as a pure function importable in tests; create `__tests__/campaign-form-validation.test.ts`

- [ ] 4. Build the `CampaignPreview` component
  - [ ] 4.1 Create `components/admin/campaign-preview.tsx`
    - Accept `campaign: Partial<ICampaign>` prop
    - Render a simplified visual mock using `display.mode`, `display.background`, `display.textColor`, `title`, `subtitle`, `badge`, and `cta`
    - Do not fire any analytics events or call any API
    - Viewport tabs (Desktop ~1200px, Tablet 768px, Mobile 375px) using `<Tabs>` with a CSS `transform: scale()` wrapper for each breakpoint
    - _Requirements: 19.1–19.3_
  - [ ] 4.2 Add the Preview tab to `CampaignForm`
    - Add a seventh "Preview" tab to the `<Tabs>` in `CampaignForm`
    - Render `<CampaignPreview campaign={formData} />` inside that tab
    - _Requirements: 19.1–19.2_
  - [ ]* 4.3 Write property test for preview value reflection (Property 26)
    - **Property 26: Preview reflects current form values**
    - **Validates: Requirements 19.2**
    - Use `fc.record` to generate random background colors and verify the rendered preview's background matches `formData.display.background.color`

- [ ] 5. Wire `CampaignForm` into the new and edit page shells
  - [ ] 5.1 Complete `app/admin/campaigns/new/page.tsx`
    - The file already has all imports and label constants; add the page body
    - Render a page header with back link to `/admin/campaigns`
    - Render `<CampaignForm />` (no `initialData`)
    - _Requirements: 12.3, 20.1_
  - [ ] 5.2 Complete `app/admin/campaigns/[id]/edit/page.tsx`
    - The file already has all imports and label constants; add the page body
    - Fetch campaign from `GET /api/admin/campaigns/[id]` on mount
    - Show `<Skeleton>` loading state while fetching
    - Show error state with back link if campaign not found or fetch fails
    - Pass `initialData={campaign}` to `<CampaignForm>`
    - _Requirements: 13.1–13.4, 20.1_
  - [ ]* 5.3 Write property test for edit round-trip (Property 15)
    - **Property 15: Edit form round-trip preserves all fields**
    - **Validates: Requirements 13.1**
    - Use `fc.record` to generate random `ICampaign`-shaped objects; pass as `initialData` to a test-rendered `CampaignForm`; assert every field in `formData` state matches the input

- [ ] 6. Build the Campaign Detail Page
  - [ ] 6.1 Create `app/admin/campaigns/[id]/page.tsx`
    - Wrap in `PermissionGuard` with `CAMPAIGNS_VIEW`
    - Fetch `GET /api/admin/campaigns/[id]` for campaign data and aggregated analytics
    - Fetch `GET /api/admin/campaigns/[id]/analytics` for daily rows
    - Show `<Skeleton>` cards while loading
    - Display header: title, status badge (use `STATUS_CLASSES` pattern from list page), type badge, priority, and an Edit button linking to the edit page
    - Display overview metric cards: Total Views, Total Clicks, CTR (%), Total Dismissals, Unique Visitors Reached
    - CTR displayed as `(totalClicks / totalViews * 100).toFixed(2)` or `'0'` when views = 0
    - When no analytics data: display zeros and an empty-state message for the chart
    - _Requirements: 14.1–14.5, 18.1–18.4_
  - [ ] 6.2 Add the daily analytics `<LineChart>` to the detail page
    - Import `LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer` from `recharts`
    - Render daily `rows` data with views and clicks series (two `<Line>` elements)
    - Format date labels using `date-fns` `format(date, 'MMM d')`
    - Show a placeholder / empty message when `rows.length === 0`
    - _Requirements: 14.3, 18.2_
  - [ ] 6.3 Add read-only detail sections to the detail page
    - Display Schedule, Display Settings, Visibility Rules, Audience Targets, Badge, CTA, Countdown, Coupon in labeled read-only `<Card>` sections
    - _Requirements: 14.5_
  - [ ]* 6.4 Write property test for CTR calculation (Property 16) and detail rendering (Property 17)
    - **Property 16: Campaign detail displays correct CTR**
    - **Property 17: Campaign detail renders all required fields**
    - **Validates: Requirements 14.2, 14.1, 14.5, 18.1**
    - Extract `computeCTR(views, clicks): number` as a standalone testable function
    - Use `fc.nat(100000)` for views and clicks; assert CTR formula and zero-views edge case

- [ ] 7. Checkpoint — Admin UI complete
  - Ensure campaign list, new, edit, and detail pages all render without TypeScript errors
  - Verify `npx next build` passes (or `npx tsc --noEmit` at minimum)
  - Ask the user if any adjustments are needed before proceeding to the public renderer

- [ ] 8. Build `CampaignCountdown` component
  - [ ] 8.1 Create `components/campaigns/campaign-countdown.tsx`
    - Accept `endsAt: Date` prop
    - Compute remaining time with `setInterval` (1 s tick), formatting as `HH:MM:SS` or `Xd Xh Xm Xs`
    - When countdown reaches zero, set internal `expired` state to `true` and render `null` (hide without unmounting parent)
    - Clear interval on unmount
    - _Requirements: 9.3, 16.10_

- [ ] 9. Build the `CampaignRenderer` and campaign sub-components
  - [ ] 9.1 Create the campaign display sub-components in `components/campaigns/`
    - Create `CampaignPopupModal`, `CampaignFloatingCard`, `CampaignAnnouncementBar`, `CampaignSlideInPanel`, `CampaignHeroBanner`, `CampaignFullScreenOverlay`, `CampaignInlineSection`
    - Each accepts `campaign: ICampaign`, `onDismiss: () => void`, `onCtaClick: () => void`
    - Each applies `display.background`, `display.textColor`, `display.overlay`, entrance animation via `getAnimationClass`, and position via `getPositionClasses`
    - Render campaign `title`, `subtitle`, `description`, images (Next.js `<Image>`), badge, CTA button, coupon copy button, and `<CampaignCountdown>` if `countdown.enabled` and not expired
    - Close button (when `display.showCloseButton`) calls `onDismiss`; CTA button calls `onCtaClick` then navigates to `cta.url`
    - Coupon copy button: copy code to clipboard, show confirmation message for 2 s
    - _Requirements: 16.5–16.12, 10.4_
  - [ ] 9.2 Create `components/campaign-renderer.tsx`
    - Mark as `'use client'`
    - On mount: generate or retrieve `visitorId` from `localStorage` (`javic_visitor_id`)
    - Mark/detect first visit using `javic_visit_recorded` localStorage key; set it after the first load
    - Fetch `GET /api/campaigns/active`; silently render nothing on error (Req 16.13)
    - Read `isLoggedIn` from user store (`useUserStore`)
    - Call `filterCampaigns(campaigns, { pathname, isLoggedIn, isFirstVisit, lastShown })` — read `lastShown` map from localStorage keys prefixed `javic_campaign_{id}_shown`
    - For each eligible campaign, apply `display.delaySeconds` via `setTimeout` then render the appropriate sub-component
    - On view: call `POST /api/campaigns/track` with `{ campaignId, event: 'view', visitorId }` (fire-and-forget)
    - On CTA click: call track with `event: 'click'`
    - On dismiss: call track with `event: 'dismiss'`; update `javic_campaign_{id}_shown` or `javic_campaign_{id}_session` localStorage key; remove campaign from rendered list
    - `once_per_session` uses `sessionStorage`; all others use `localStorage`
    - _Requirements: 16.1–16.13_
  - [ ]* 9.3 Write property test for `filterCampaigns` priority sort (Property 22)
    - **Property 22: Campaigns sorted by priority descending**
    - **Validates: Requirements 11.2**
    - Create random campaigns with varied `priority` values; assert result is sorted descending

- [ ] 10. Mount `CampaignRenderer` in the root storefront layout
  - [ ] 10.1 Import `CampaignRenderer` into `app/layout.tsx` and add it inside `<ToastProvider>` alongside `<WhatsAppFloat />`
    - `CampaignRenderer` is a client component so it is safe to include in this server layout file
    - It must only render on storefront pages (not admin pages) — conditionally render using pathname check or by placing it in a storefront-specific layout; if the root layout serves both admin and storefront, check if pathname starts with `/admin` and suppress rendering
    - _Requirements: 16.1_

- [ ] 11. Install `fast-check` and run all property tests
  - [ ] 11.1 Install `fast-check` dev dependency
    - Run `npm install --save-dev fast-check@3.22.0`
    - Verify `__tests__/` folder exists or create it
    - Ensure the test runner (Vitest or Jest) is configured to pick up `__tests__/**/*.test.ts` files
    - _Requirements: (test infrastructure)_
  - [ ]* 11.2 Write property tests for `computeStatus` (Property 9)
    - **Property 9: Status computation from schedule dates**
    - **Validates: Requirements 5.4, 5.5, 5.6**
    - Import `computeStatus` from `lib/campaign-scheduler.ts`
    - Use `fc.date` for `startDate` and `fc.option(fc.date(...))` for `endDate`
    - Assert the mapping from dates to statuses per design Property 9
    - Run 100 iterations
  - [ ]* 11.3 Write property tests for tracking counter increment (Property 24)
    - **Property 24: Tracking increments the correct counter**
    - **Validates: Requirements 17.4, 17.5**
    - Mock `CampaignAnalytics.findOneAndUpdate` to capture `$inc` arguments
    - Use `fc.constantFrom('view', 'click', 'dismiss')` and assert the correct field is incremented by 1

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Run `npx vitest --run` (or `npx jest --forceExit`) to execute all property and unit tests
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for full traceability
- The `computeStatus` extraction (Task 1) must be done first because property tests import it directly
- `lib/campaign-client.ts` (Task 2) must be done before `CampaignRenderer` (Task 9) since the renderer imports from it
- `CampaignForm` (Task 3) is the largest single task; the tabs can be implemented and committed incrementally
- `fast-check` is not yet in `package.json` — Task 11.1 installs it before running any PBT tasks
- Property tests use `vitest --run` (single execution) to avoid watch mode blocking the agent
- The root layout currently serves both admin and storefront routes; Task 10.1 includes a note about suppressing renderer on `/admin/*` paths

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "11.1"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "3.1", "8.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8"] },
    { "id": 4, "tasks": ["3.9", "4.1", "11.2", "11.3"] },
    { "id": 5, "tasks": ["4.2", "5.1", "5.2", "6.1"] },
    { "id": 6, "tasks": ["4.3", "5.3", "6.2", "6.3", "9.1"] },
    { "id": 7, "tasks": ["6.4", "9.2"] },
    { "id": 8, "tasks": ["9.3", "10.1"] }
  ]
}
```
