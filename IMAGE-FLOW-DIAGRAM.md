# Image Display Flow - Architecture Diagram

## 🔄 Complete Flow Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY                            │
└─────────────────────────────────────────────────────────────────┘

1️⃣ WHATSAPP ORDER
┌────────────────────────────────────────────────┐
│ WhatsApp Message:                              │
│                                                │
│ "1. Scarlet Allure... [Design #3]             │
│    📸 https://javic.co.ke/i/abc123-2"         │
│                                                │
│ User clicks link ──────────────────────────┐  │
└────────────────────────────────────────────┼──┘
                                             │
                                             ▼
2️⃣ SHORT URL ENTRY POINT
┌────────────────────────────────────────────────┐
│ Route: /i/[code]                               │
│ File: app/i/[code]/route.ts                    │
│                                                │
│ Actions:                                       │
│ 1. Parse code: "abc123-2"                      │
│    → productId: "abc123"                       │
│    → imageIndex: 2                             │
│                                                │
│ 2. Validate format                             │
│    ✅ Format valid?                            │
│    ❌ Invalid → 400 Bad Request                │
│                                                │
│ 3. Quick DB check                              │
│    ✅ Product exists?                          │
│    ❌ Not found → 404 Not Found                │
│                                                │
│ 4. Build display page URL                      │
│    → javic.co.ke/image/abc123-2                │
│                                                │
│ 5. 302 Redirect ────────────────────────┐     │
└────────────────────────────────────────┼───────┘
                                         │
                                         ▼
3️⃣ IMAGE DISPLAY PAGE
┌────────────────────────────────────────────────┐
│ Route: /image/[code]                           │
│ File: app/image/[code]/page.tsx                │
│                                                │
│ Component Lifecycle:                           │
│                                                │
│ 1. Page loads                                  │
│    → Shows loading spinner                     │
│                                                │
│ 2. Fetch data ──────────────────────────┐     │
│    GET /api/image-data/abc123-2         │     │
└────────────────────────────────────────┼───────┘
                                         │
                                         ▼
4️⃣ DATA API
┌────────────────────────────────────────────────┐
│ Route: /api/image-data/[code]                  │
│ File: app/api/image-data/[code]/route.ts       │
│                                                │
│ Process:                                       │
│ 1. Parse code: "abc123-2"                      │
│ 2. Query MongoDB:                              │
│    Product.findById("abc123")                  │
│                                                │
│ 3. Extract image data:                         │
│    product.images[2]                           │
│                                                │
│ 4. Return JSON: ────────────────────────┐     │
│    {                                    │     │
│      productId: "abc123",               │     │
│      productName: "Scarlet Allure...",  │     │
│      imageUrl: "https://fecy.co...",    │     │
│      imageIndex: 2,                     │     │
│      totalImages: 5                     │     │
│    }                                    │     │
└────────────────────────────────────────┼───────┘
                                         │
                                         ▼
5️⃣ RENDER DISPLAY PAGE
┌────────────────────────────────────────────────┐
│ Page State: Success                            │
│                                                │
│ ┌────────────────────────────────────────┐    │
│ │ 📦 Product Card                        │    │
│ │                                        │    │
│ │ Scarlet Allure 3-Piece Nightdress     │    │
│ │ Design #3 of 5    [View Product →]    │    │
│ └────────────────────────────────────────┘    │
│                                                │
│ ┌────────────────────────────────────────┐    │
│ │ 🖼️  Image Display                      │    │
│ │                                        │    │
│ │         [Product Image]                │    │
│ │      (Next.js optimized)               │    │
│ │                                        │    │
│ └────────────────────────────────────────┘    │
│                                                │
│      [⬇️ Download] [🔗 View Details]          │
│                                                │
│ User Actions:                                  │
│ • Click "View Product" → /product/abc123       │
│ • Click "Download" → Opens image URL           │
│ • Click "View Details" → /product/abc123       │
└────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │         Display Page Component                │      │
│  │         (React Client Component)              │      │
│  │                                               │      │
│  │  State:                                       │      │
│  │  • loading: boolean                           │      │
│  │  • data: ProductData | null                   │      │
│  │  • error: string | null                       │      │
│  │                                               │      │
│  │  Effects:                                     │      │
│  │  • useEffect → fetch data on mount            │      │
│  └──────────────────────────────────────────────┘      │
│                        │                                 │
│                        │ HTTP GET                        │
│                        ▼                                 │
└─────────────────────────────────────────────────────────┘
                         │
                         │
┌─────────────────────────────────────────────────────────┐
│                  NEXT.JS SERVER                          │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │   Redirect Handler: /i/[code]/route.ts       │      │
│  │   • Lightweight validation                    │      │
│  │   • Quick product existence check             │      │
│  │   • 302 redirect to display page              │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │   Display Page: /image/[code]/page.tsx       │      │
│  │   • Server-side rendered shell                │      │
│  │   • Client-side data fetching                 │      │
│  │   • Loading/error/success states              │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │   Data API: /api/image-data/[code]/route.ts  │      │
│  │   • Parse and validate code                   │      │
│  │   • Fetch product from MongoDB                │      │
│  │   • Return structured JSON                    │      │
│  └──────────────────────────────────────────────┘      │
│                        │                                 │
│                        │ MongoDB Query                   │
│                        ▼                                 │
└─────────────────────────────────────────────────────────┘
                         │
                         │
┌─────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │         Products Collection                   │      │
│  │                                               │      │
│  │  {                                            │      │
│  │    _id: "abc123",                             │      │
│  │    name: "Scarlet Allure...",                 │      │
│  │    images: [                                  │      │
│  │      { url: "https://..." },  // index 0     │      │
│  │      { url: "https://..." },  // index 1     │      │
│  │      { url: "https://..." },  // index 2 ✓   │      │
│  │      ...                                      │      │
│  │    ]                                          │      │
│  │  }                                            │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Error Handling Flow

```
User Request: javic.co.ke/i/INVALID-99
              │
              ▼
┌─────────────────────────────┐
│  Redirect Handler           │
│  /i/[code]/route.ts         │
└─────────────────────────────┘
              │
              ├─ Parse code
              │  └─ ❌ Invalid format?
              │     └─ Return 400 JSON
              │
              ├─ Check product exists
              │  └─ ❌ Not found?
              │     └─ Return 404 JSON
              │
              ├─ Check image exists
              │  └─ ❌ Out of bounds?
              │     └─ Return 404 JSON
              │
              └─ ✅ All valid
                 └─ Redirect to display page
                    │
                    ▼
           ┌─────────────────────────────┐
           │  Display Page               │
           │  /image/[code]/page.tsx     │
           └─────────────────────────────┘
                    │
                    ├─ Fetch API data
                    │  └─ ❌ Error response?
                    │     └─ Show error UI
                    │        • Error icon
                    │        • Error message
                    │        • "Browse Products" button
                    │
                    └─ ✅ Success
                       └─ Show image + info
```

---

## 📊 Data Flow Diagram

```
WhatsApp Message
      │
      │ Contains: javic.co.ke/i/abc123-2
      │
      ▼
┌─────────────────┐
│  Short URL      │  /i/abc123-2
│  Entry Point    │  
└─────────────────┘
      │
      │ Validates & Redirects (302)
      │
      ▼
┌─────────────────┐
│  Display Page   │  /image/abc123-2
│  (Loading)      │  
└─────────────────┘
      │
      │ useEffect triggers
      │
      ▼
┌─────────────────┐
│  API Request    │  GET /api/image-data/abc123-2
│                 │  
└─────────────────┘
      │
      │ Query database
      │
      ▼
┌─────────────────┐
│  MongoDB        │  Find product by ID
│                 │  Get image at index
└─────────────────┘
      │
      │ Returns data
      │
      ▼
┌─────────────────┐
│  API Response   │  { productId, productName, 
│                 │    imageUrl, imageIndex, totalImages }
└─────────────────┘
      │
      │ setState(data)
      │
      ▼
┌─────────────────┐
│  Display Page   │  Renders image + product info
│  (Success)      │  
└─────────────────┘
      │
      │ User interactions
      │
      ├─────────────┬─────────────┐
      │             │             │
      ▼             ▼             ▼
  View Product  Download    Full Details
  /product/id   Image URL   /product/id
```

---

## 🔗 URL Structure

```
Entry Point (Short URL):
┌──────────────────────────────────────┐
│ https://javic.co.ke/i/abc123-2       │
│                      └┬┘ └┬┘ └┘       │
│                       │   │  └─ Image Index (0-based)
│                       │   └──── Separator
│                       └──────── Product ID (MongoDB ObjectId)
└──────────────────────────────────────┘
                │
                │ 302 Redirect
                ▼
Display Page:
┌──────────────────────────────────────┐
│ https://javic.co.ke/image/abc123-2   │
│                           └──────┘   │
│                              │        │
│                              └─ Same code format
└──────────────────────────────────────┘
                │
                │ Fetches from
                ▼
API Endpoint:
┌──────────────────────────────────────┐
│ /api/image-data/abc123-2             │
│                 └──────┘             │
│                    │                 │
│                    └─ Same code format
└──────────────────────────────────────┘
```

---

## 🎨 Component Tree

```
Display Page
├── Header (navigation, logo, menu)
│
├── Main Container
│   ├── Loading State
│   │   ├── Loader2 icon (spinning)
│   │   └── "Loading image..." text
│   │
│   ├── Error State
│   │   ├── AlertCircle icon
│   │   ├── Error title
│   │   ├── Error message
│   │   └── "Browse Products" button
│   │
│   └── Success State
│       ├── Product Info Card
│       │   ├── Product name (h1)
│       │   ├── Design number (muted)
│       │   └── "View Product" button
│       │
│       ├── Image Display Card
│       │   └── Next.js Image (optimized)
│       │       ├── priority loading
│       │       ├── aspect-square container
│       │       └── object-contain fit
│       │
│       └── Action Buttons
│           ├── "Download Image" (secondary)
│           └── "View Full Product Details" (primary)
│
└── Footer (links, copyright, contact)
```

---

## ⚡ Performance Flow

```
Time: 0ms
  │ User clicks short URL
  │
Time: ~50ms
  │ DNS resolution + TLS handshake
  │
Time: ~100ms
  │ Redirect handler executes
  │ • Parse code: ~1ms
  │ • MongoDB query: ~20-50ms
  │ • Validation: ~1ms
  │ • 302 redirect: ~1ms
  │
Time: ~150ms
  │ Browser follows redirect
  │
Time: ~200ms
  │ Display page HTML loads
  │ • Shows loading spinner immediately
  │
Time: ~250ms
  │ Client-side JavaScript executes
  │ • useEffect triggers
  │ • API fetch initiated
  │
Time: ~300ms
  │ API handler executes
  │ • Parse code: ~1ms
  │ • MongoDB query: ~20-50ms
  │ • JSON serialization: ~1ms
  │
Time: ~350ms
  │ API response received
  │ • setState updates component
  │ • Image starts loading
  │
Time: ~500-1500ms
  │ Image fully loaded
  │ • Next.js Image optimization
  │ • Progressive rendering
  │
Time: ~1500ms
  ✓ Page fully interactive
```

---

## 🔄 State Machine

```
┌─────────────┐
│   INITIAL   │ (page loads)
└─────────────┘
      │
      │ useEffect triggers
      │
      ▼
┌─────────────┐
│   LOADING   │ loading = true
│             │ data = null
│             │ error = null
└─────────────┘
      │
      ├─────────────────┐
      │                 │
  ✅ Success        ❌ Error
      │                 │
      ▼                 ▼
┌─────────────┐   ┌─────────────┐
│   SUCCESS   │   │    ERROR    │
│             │   │             │
│ loading=F   │   │ loading=F   │
│ data=Data   │   │ data=null   │
│ error=null  │   │ error=msg   │
└─────────────┘   └─────────────┘
      │                 │
      │                 │
  User clicks      User clicks
   buttons          "Browse"
      │                 │
      ▼                 ▼
   Navigate          Navigate
   to product        to home
```

---

*This diagram provides a complete visual reference for the image display system architecture.*
