# Requirements Document

## Introduction

This document describes the requirements for the Campaign Management System integrated into the existing Next.js e-commerce project (Javic). The feature enables administrators to create, schedule, manage, and display promotional campaigns — including popups, banners, floating cards, announcement bars, and more — directly from the admin dashboard. Campaigns are rendered on the public storefront according to configurable visibility rules, audience targeting, display frequency, and scheduling. The system is designed as a reusable marketing module supporting promotions, announcements, events, seasonal greetings, product launches, discounts, and general marketing messages.

The project uses Next.js 14 (App Router), MongoDB with Mongoose, JWT-based authentication, Tailwind CSS with a shadcn/ui component library, and Cloudinary for image uploads. The Campaign model, permissions, navigation entry, campaign list page, API routes (CRUD, analytics, tracking), and page scaffolding already exist. The remaining work is: completing the campaign creation and edit forms, implementing the campaign detail/view page, building the frontend renderer component, and wiring analytics display into the admin UI.

---

## Glossary

- **Campaign**: A time-bound marketing message configured by an administrator to display on the public storefront.
- **Campaign_Form**: The multi-section admin UI for creating or editing a campaign.
- **Campaign_List**: The paginated admin page that lists all campaigns with filters and actions.
- **Campaign_Renderer**: The client-side component on the public storefront that fetches active campaigns and renders them according to their display settings.
- **Campaign_Scheduler**: The server-side logic that derives and updates campaign status based on schedule dates.
- **Campaign_Tracker**: The public API endpoint and client utility that records view, click, and dismiss analytics events.
- **Campaign_Detail**: The admin page showing a campaign's full configuration and aggregated analytics.
- **Admin**: A user with `admin` or `super_admin` role, authenticated via JWT stored in an `auth-token` cookie.
- **Visitor**: Any user of the public storefront, authenticated or unauthenticated.
- **Display_Mode**: The visual format used to render a campaign (popup, banner, card, etc.).
- **Display_Frequency**: How often a campaign is shown to the same visitor, enforced client-side via localStorage.
- **Audience_Target**: The visitor segment a campaign is intended for.
- **Visibility_Page**: The set of page types on which a campaign is eligible to appear.
- **Analytics_Bucket**: A day-level record in the `CampaignAnalytics` collection aggregating views, clicks, dismissals, and unique visitors for one campaign.
- **CTR**: Click-through rate, calculated as `(totalClicks / totalViews) * 100`.

---

## Requirements

### Requirement 1: Campaign Creation Form — Basic Information

**User Story:** As an Admin, I want to fill in the core details of a campaign so that I can define its identity and type before configuring display and scheduling.

#### Acceptance Criteria

1. THE Campaign_Form SHALL provide a required text field for the campaign title (maximum 120 characters).
2. THE Campaign_Form SHALL provide an optional text field for the campaign subtitle (maximum 200 characters).
3. THE Campaign_Form SHALL provide an optional textarea for the campaign description.
4. THE Campaign_Form SHALL provide a required dropdown to select the campaign type from the following values: Discount, Promotion, New Product, New Arrival, Event, Announcement, Holiday, Clearance, Limited Time, Other.
5. WHEN the campaign type is changed, THE Campaign_Form SHALL retain all other field values without resetting the form.

---

### Requirement 2: Campaign Creation Form — Media

**User Story:** As an Admin, I want to upload images for a campaign so that the campaign has visual content appropriate for the target display mode.

#### Acceptance Criteria

1. THE Campaign_Form SHALL provide an upload slot for a desktop image using the existing `ImageUpload` component.
2. THE Campaign_Form SHALL provide an upload slot for a mobile image using the existing `ImageUpload` component.
3. THE Campaign_Form SHALL provide the ability to add one or more carousel images using the existing `ImageUpload` component.
4. WHEN an image is uploaded, THE Campaign_Form SHALL display a preview of the uploaded image.
5. WHEN a remove action is triggered on an uploaded image, THE Campaign_Form SHALL remove that image from the campaign's image list.
6. THE Campaign_Form SHALL allow replacing an uploaded image by uploading a new file to the same slot, using the existing `ImageUpload` component's replace functionality.

---

### Requirement 3: Campaign Creation Form — Badge

**User Story:** As an Admin, I want to attach a badge to a campaign so that visitors see a highlight label on the campaign display.

#### Acceptance Criteria

1. THE Campaign_Form SHALL provide an optional badge section with a dropdown to select the badge type from: Sale, New, Hot, Exclusive, Popular, Clearance, Limited, Custom.
2. WHERE the badge type is set to Custom, THE Campaign_Form SHALL provide a text input for custom badge text (maximum 30 characters).
3. WHERE the campaign type is Discount, THE Campaign_Form SHALL provide a dropdown to select the discount type (Percentage or Fixed) and a numeric input for the discount value.
4. WHEN no badge type is selected, THE Campaign_Form SHALL omit the badge from the saved campaign payload.

---

### Requirement 4: Campaign Creation Form — Call to Action

**User Story:** As an Admin, I want to configure an optional call-to-action button so that visitors can be directed to a relevant page or URL from the campaign.

#### Acceptance Criteria

1. THE Campaign_Form SHALL provide a toggle to enable or disable the CTA button.
2. WHILE the CTA toggle is enabled, THE Campaign_Form SHALL provide a text input for the button label.
3. WHILE the CTA toggle is enabled, THE Campaign_Form SHALL provide a URL input for the button destination.
4. WHILE the CTA toggle is enabled, THE Campaign_Form SHALL provide a toggle to mark the URL as external (opens in a new tab).
5. THE Campaign_Form SHALL offer preset label suggestions: Shop Now, View Products, Book Now, Learn More, Contact Us, WhatsApp.
6. WHEN the CTA toggle is disabled, THE Campaign_Form SHALL omit the CTA from the saved campaign payload.

---

### Requirement 5: Campaign Creation Form — Schedule

**User Story:** As an Admin, I want to set a start and optional end date/time for a campaign so that the campaign activates and expires automatically without manual intervention.

#### Acceptance Criteria

1. THE Campaign_Form SHALL provide a required datetime-local input for the campaign start date and time.
2. THE Campaign_Form SHALL provide an optional datetime-local input for the campaign end date.
3. IF the end date is set and the end date is earlier than the start date, THEN THE Campaign_Form SHALL display a validation error and prevent saving.
4. WHEN the campaign is saved with a start date in the future and status is not `draft` or `disabled`, THE Campaign_Scheduler SHALL set the status to `scheduled`.
5. WHEN the campaign is saved with a start date in the past and no end date (or an end date in the future), THE Campaign_Scheduler SHALL set the status to `active`.
6. WHEN the campaign is saved with an end date in the past, THE Campaign_Scheduler SHALL set the status to `expired`.
7. WHEN the Campaign_List page loads, THE Campaign_Scheduler SHALL recompute and persist the status of any campaign whose schedule no longer matches its stored status.

---

### Requirement 6: Campaign Creation Form — Display Settings

**User Story:** As an Admin, I want to configure how and where a campaign appears visually so that the display matches the campaign's purpose and design intent.

#### Acceptance Criteria

1. THE Campaign_Form SHALL provide a required dropdown for Display Mode with values: Popup Modal, Floating Card, Announcement Bar, Slide-in Panel, Hero Banner, Full Screen Overlay, Inline Section.
2. THE Campaign_Form SHALL provide a dropdown for Position with values: Center, Top, Bottom Left, Bottom Right.
3. THE Campaign_Form SHALL provide a dropdown for Animation with values: Fade, Zoom, Slide Up, Slide Down, Bounce, None.
4. THE Campaign_Form SHALL provide a dropdown for Background Type with values: Color, Gradient, Image.
5. WHERE the background type is Color, THE Campaign_Form SHALL provide a color picker input for the background color.
6. WHERE the background type is Gradient, THE Campaign_Form SHALL provide color picker inputs for the gradient start and end colors and a direction input.
7. WHERE the background type is Image, THE Campaign_Form SHALL provide an image upload slot for the background image using the existing `ImageUpload` component.
8. THE Campaign_Form SHALL provide a dropdown for Overlay with values: None, Dark, Blur.
9. THE Campaign_Form SHALL provide a numeric input for display delay in seconds (minimum 0, maximum 60).
10. THE Campaign_Form SHALL provide a toggle for Show Close Button.
11. THE Campaign_Form SHALL provide a color picker input for text color.

---

### Requirement 7: Campaign Creation Form — Visibility Rules

**User Story:** As an Admin, I want to control which pages a campaign appears on and how often it is shown to the same visitor so that campaigns are not intrusive.

#### Acceptance Criteria

1. THE Campaign_Form SHALL provide a multi-select or checkbox group for Visibility Pages with values: Entire Website, Homepage Only, Product Pages, Category Pages, Checkout.
2. THE Campaign_Form SHALL provide a dropdown for Display Frequency with values: Every Visit, Once Per Session, Once Per Day, Once Every 3 Days, Once Every 7 Days, Only Once Ever.
3. WHEN a campaign is saved with no visibility pages selected, THE Campaign_Form SHALL apply the default value `entire_website`.

---

### Requirement 8: Campaign Creation Form — Audience

**User Story:** As an Admin, I want to target a campaign at a specific visitor segment so that campaigns are relevant to the intended audience.

#### Acceptance Criteria

1. THE Campaign_Form SHALL provide a multi-select or checkbox group for Audience Targets with values: Everyone, First-time Visitors, Returning Visitors, Logged-in Users, Guests.
2. WHEN a campaign is saved with no audience target selected, THE Campaign_Form SHALL apply the default value `everyone`.

---

### Requirement 9: Campaign Creation Form — Countdown Timer

**User Story:** As an Admin, I want to add a countdown timer to a campaign so that visitors see a visual urgency indicator counting down to the campaign end.

#### Acceptance Criteria

1. THE Campaign_Form SHALL provide a toggle to enable the countdown timer.
2. WHILE the countdown toggle is enabled, THE Campaign_Form SHALL allow setting a custom countdown end datetime, defaulting to the campaign end date if one is set.
3. WHEN a campaign with an enabled countdown is rendered on the storefront and the countdown reaches zero, THE Campaign_Renderer SHALL hide the countdown display without removing the campaign.

---

### Requirement 10: Campaign Creation Form — Coupon Code

**User Story:** As an Admin, I want to include a coupon code in a campaign so that visitors can easily copy and use the promotional code.

#### Acceptance Criteria

1. THE Campaign_Form SHALL provide a toggle to enable the coupon code section.
2. WHILE the coupon toggle is enabled, THE Campaign_Form SHALL provide a text input for the coupon code.
3. WHILE the coupon toggle is enabled, THE Campaign_Form SHALL provide a text input for the copy confirmation message, defaulting to "Code copied!".
4. WHEN a visitor clicks the copy button on the rendered coupon code, THE Campaign_Renderer SHALL copy the coupon code to the clipboard and display the confirmation message for 2 seconds.

---

### Requirement 11: Campaign Creation Form — Priority

**User Story:** As an Admin, I want to assign a numeric priority to a campaign so that when multiple campaigns are eligible, higher-priority campaigns are displayed first.

#### Acceptance Criteria

1. THE Campaign_Form SHALL provide a numeric input for priority (minimum 0, maximum 100, default 0).
2. WHEN multiple active campaigns are eligible for display, THE Campaign_Renderer SHALL display them in descending priority order.

---

### Requirement 12: Campaign Form Save and Validation

**User Story:** As an Admin, I want the campaign form to validate required fields and save the campaign via the existing API so that only valid data is persisted.

#### Acceptance Criteria

1. WHEN the save action is triggered, THE Campaign_Form SHALL validate that the title field is not empty and display an inline error if it is.
2. WHEN the save action is triggered, THE Campaign_Form SHALL validate that the start date is set and display an inline error if it is not.
3. WHEN all required fields pass validation, THE Campaign_Form SHALL submit the campaign data to `POST /api/admin/campaigns` for new campaigns and `PATCH /api/admin/campaigns/[id]` for edits.
4. WHEN the API returns a success response, THE Campaign_Form SHALL display a success toast notification using the existing `useToast` hook and redirect to the campaign list page.
5. WHEN the API returns an error response, THE Campaign_Form SHALL display an error toast notification without navigating away.
6. THE Campaign_Form SHALL disable the save button and show a loading indicator while a submission is in progress.

---

### Requirement 13: Campaign Edit Form

**User Story:** As an Admin, I want to edit an existing campaign using the same form structure as creation so that I can update all campaign fields without learning a different UI.

#### Acceptance Criteria

1. WHEN the edit page loads, THE Campaign_Form SHALL fetch the campaign data from `GET /api/admin/campaigns/[id]` and pre-populate all form fields.
2. WHILE campaign data is loading, THE Campaign_Form SHALL display a loading skeleton.
3. IF the campaign ID is invalid or the campaign is not found, THEN THE Campaign_Form SHALL display an error state with a link back to the campaign list.
4. WHEN the save action is triggered on the edit form, THE Campaign_Form SHALL submit a PATCH request to `PATCH /api/admin/campaigns/[id]`.

---

### Requirement 14: Campaign Detail / View Page

**User Story:** As an Admin, I want to view a campaign's full configuration and analytics summary from a dedicated detail page so that I can review performance without editing.

#### Acceptance Criteria

1. THE Campaign_Detail SHALL display the campaign title, subtitle, type, status badge, priority, and schedule dates.
2. THE Campaign_Detail SHALL display aggregated analytics: Total Views, Total Clicks, CTR (%), Total Dismissals, and Unique Visitors Reached, fetched from `GET /api/admin/campaigns/[id]`.
3. THE Campaign_Detail SHALL display a daily breakdown chart of views and clicks for the last 30 days, fetched from `GET /api/admin/campaigns/[id]/analytics`.
4. THE Campaign_Detail SHALL provide an Edit button linking to the campaign edit page.
5. THE Campaign_Detail SHALL display all display settings, visibility rules, audience targets, and schedule information in read-only sections.

---

### Requirement 15: Campaign List Actions

**User Story:** As an Admin, I want to perform quick actions on campaigns from the list page so that I can manage campaign lifecycle without navigating away.

#### Acceptance Criteria

1. THE Campaign_List SHALL provide a View action linking to the campaign detail page for each campaign.
2. THE Campaign_List SHALL provide an Edit action linking to the campaign edit page for each campaign.
3. THE Campaign_List SHALL provide a Duplicate action that creates a copy of the campaign with status `draft` and title suffixed with "(Copy)" via `POST /api/admin/campaigns`, then navigates to the edit page for the new campaign.
4. THE Campaign_List SHALL provide an Activate action for campaigns with status `draft`, `scheduled`, or `expired` that submits `PATCH /api/admin/campaigns/[id]` with `{ status: 'active' }`.
5. THE Campaign_List SHALL provide a Disable/Enable toggle action that switches status between `disabled` and `draft` via `PATCH /api/admin/campaigns/[id]`.
6. THE Campaign_List SHALL provide a Delete action that opens a confirmation dialog before submitting `DELETE /api/admin/campaigns/[id]`.
7. WHEN any action succeeds, THE Campaign_List SHALL display a success toast and refresh the campaign list.
8. WHEN any action fails, THE Campaign_List SHALL display an error toast without refreshing.
9. THE Campaign_List SHALL be wrapped in `PermissionGuard` requiring `CAMPAIGNS_VIEW` permission.

---

### Requirement 16: Frontend Campaign Renderer

**User Story:** As a Visitor, I want eligible campaigns to appear automatically on the storefront so that I can see promotions that are relevant to my current page and session state.

#### Acceptance Criteria

1. WHEN the storefront page loads, THE Campaign_Renderer SHALL fetch active campaigns from `GET /api/campaigns/active`.
2. THE Campaign_Renderer SHALL filter fetched campaigns to only those where the current page matches the campaign's configured visibility pages.
3. THE Campaign_Renderer SHALL filter campaigns by audience target: campaigns targeting `logged_in_users` SHALL only display to authenticated visitors; campaigns targeting `guests` SHALL only display to unauthenticated visitors; campaigns targeting `first_time_visitors` SHALL only display to visitors with no prior visit recorded in localStorage; campaigns targeting `returning_visitors` SHALL only display to visitors with a prior visit recorded in localStorage; campaigns targeting `everyone` SHALL display to all visitors.
4. THE Campaign_Renderer SHALL enforce display frequency using localStorage keys namespaced by campaign ID: campaigns configured as `once_per_session` SHALL not be shown again within the same browser session; campaigns configured as `once_per_day` SHALL not be shown again within 24 hours; campaigns configured as `once_per_3_days` SHALL not be shown again within 72 hours; campaigns configured as `once_per_7_days` SHALL not be shown again within 168 hours; campaigns configured as `only_once` SHALL not be shown after the first display; campaigns configured as `every_visit` SHALL always be shown.
5. THE Campaign_Renderer SHALL render campaigns according to their configured Display Mode: `popup_modal` as a centered modal with backdrop, `floating_card` as a fixed-position card, `announcement_bar` as a full-width bar at the top of the viewport, `slide_in_panel` as a panel that slides in from the configured position, `hero_banner` as a full-width banner within the page flow, `full_screen_overlay` as a viewport-filling overlay, `inline_section` as a section inserted into the page content.
6. THE Campaign_Renderer SHALL apply the configured entrance animation (fade, zoom, slide_up, slide_down, bounce, or none) when a campaign appears.
7. WHEN a campaign is configured with `showCloseButton: true`, THE Campaign_Renderer SHALL render a dismiss button; WHEN the dismiss button is clicked, THE Campaign_Renderer SHALL hide the campaign, update localStorage to record the dismissal, and record a `dismiss` analytics event via `POST /api/campaigns/track`.
8. WHEN a campaign is displayed, THE Campaign_Renderer SHALL record a `view` analytics event via `POST /api/campaigns/track` with a stable visitor ID generated and stored in localStorage.
9. WHEN a visitor clicks the CTA button, THE Campaign_Renderer SHALL record a `click` analytics event via `POST /api/campaigns/track`.
10. THE Campaign_Renderer SHALL display the countdown timer for campaigns where `countdown.enabled` is true and the countdown has not yet expired.
11. THE Campaign_Renderer SHALL display the configured delay before showing the campaign, waiting the number of seconds specified in `display.delaySeconds`.
12. THE Campaign_Renderer SHALL display campaign images using Next.js `<Image>` with appropriate sizes and lazy loading.
13. IF `GET /api/campaigns/active` fails or returns an empty list, THEN THE Campaign_Renderer SHALL render nothing and log no user-visible error.

---

### Requirement 17: Analytics Tracking API

**User Story:** As the system, I want a public API endpoint to record campaign interaction events so that the admin can review campaign performance.

#### Acceptance Criteria

1. THE Campaign_Tracker SHALL accept `POST /api/campaigns/track` requests with `campaignId`, `event` (view, click, or dismiss), and optional `visitorId` fields.
2. IF the `campaignId` is missing, invalid, or not found in the database, THEN THE Campaign_Tracker SHALL return a 400 or 404 response respectively.
3. IF the `event` field is not one of `view`, `click`, or `dismiss`, THEN THE Campaign_Tracker SHALL return a 400 response.
4. WHEN a valid tracking event is received, THE Campaign_Tracker SHALL upsert the Analytics_Bucket document for the campaign and current UTC day, incrementing the corresponding counter field.
5. WHEN a `view` event is received with a `visitorId`, THE Campaign_Tracker SHALL increment the `uniqueVisitors` counter on the Analytics_Bucket.
6. IF the database write fails, THEN THE Campaign_Tracker SHALL return `{ success: false }` with HTTP 200 to prevent client-side errors from propagating.

---

### Requirement 18: Analytics Display in Admin

**User Story:** As an Admin, I want to see campaign performance metrics in the admin dashboard so that I can evaluate the effectiveness of each campaign.

#### Acceptance Criteria

1. THE Campaign_Detail SHALL display the following metrics: Total Views, Total Clicks, CTR (%), Total Dismissals, Unique Visitors Reached.
2. THE Campaign_Detail SHALL display a daily time-series chart covering the last 30 days with at least views and clicks series.
3. WHEN the analytics data is loading, THE Campaign_Detail SHALL display loading placeholders.
4. IF no analytics data exists for the campaign, THE Campaign_Detail SHALL display zero values for all metrics and an empty chart with an appropriate message.

---

### Requirement 19: Campaign Preview

**User Story:** As an Admin, I want to preview how a campaign will look on desktop, tablet, and mobile viewports directly within the campaign form so that I can verify the design before publishing.

#### Acceptance Criteria

1. THE Campaign_Form SHALL provide a Preview section with tabs for Desktop, Tablet, and Mobile viewports.
2. WHEN the preview tab is active, THE Campaign_Form SHALL render a live representation of the campaign using the currently entered form values, styled according to the selected Display Mode and background settings.
3. THE Campaign_Form preview SHALL be read-only and SHALL NOT trigger analytics events.

---

### Requirement 20: Access Control

**User Story:** As a super admin, I want campaign management features to be accessible only to authorized administrators so that campaign data is protected.

#### Acceptance Criteria

1. THE Campaign_List, Campaign_Form, and Campaign_Detail pages SHALL each be wrapped in `PermissionGuard` requiring at minimum `CAMPAIGNS_VIEW` permission.
2. THE Campaign_Form save action for creating a new campaign SHALL require the `CAMPAIGNS_CREATE` permission, enforced at the API route level via `requireAdmin`.
3. THE Campaign_Form save action for editing a campaign SHALL require the `CAMPAIGNS_EDIT` permission, enforced at the API route level via `requireAdmin`.
4. THE Campaign_List delete action SHALL require the `CAMPAIGNS_DELETE` permission, enforced at the API route level via `requireAdmin`.
5. ALL admin campaign API routes SHALL reject unauthenticated requests with HTTP 401 and non-admin requests with HTTP 403.
6. THE public campaign API routes (`GET /api/campaigns/active`, `POST /api/campaigns/track`) SHALL NOT require authentication.
