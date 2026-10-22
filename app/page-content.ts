/**
 * Jiji Freight Services - MVP Content
 * All page content, messaging, and data
 */

export const heroContent = {
  title: "Jiji East Africa Limited",
  subtitle: "Professional Freight & Logistics Services",
  description: "Fast, reliable, and affordable shipping across East Africa. From express delivery to bulk freight, we've got your logistics covered.",
  cta: {
    primary: "Get a Quote",
    secondary: "Explore Services",
  },
  backgroundImage: "/images/hero-freight.jpg",
}

export const servicesContent = [
  {
    id: "express",
    name: "Express Delivery",
    shortDesc: "Next-day delivery within metro areas",
    description: "Need it fast? Our express delivery service guarantees next-day delivery for shipments within Nairobi, Mombasa, Kampala, and other major cities.",
    icon: "⚡",
    features: [
      "Next-day delivery guaranteed",
      "Real-time GPS tracking",
      "Priority handling",
      "Signature on delivery",
      "Insurance included",
    ],
    pricing: "Starting from KES 500",
    estimatedDelivery: "24 hours",
    bestFor: "Urgent documents, emergency supplies, time-sensitive cargo",
  },
  {
    id: "standard",
    name: "Standard Shipping",
    shortDesc: "Reliable delivery across East Africa",
    description: "Our standard shipping service provides cost-effective, reliable delivery throughout Kenya, Uganda, Tanzania, Rwanda, and Burundi.",
    icon: "📦",
    features: [
      "Scheduled deliveries",
      "Competitive rates",
      "Full tracking capability",
      "Professional handling",
      "Flexible pick-up options",
    ],
    pricing: "Competitive rates based on weight/distance",
    estimatedDelivery: "2-5 business days",
    bestFor: "Regular shipments, wholesale orders, bulk deliveries",
  },
  {
    id: "fragile",
    name: "Fragile Cargo Handling",
    shortDesc: "Specialized care for delicate items",
    description: "Protect your valuable and delicate cargo with our specialized fragile handling service. Expert packing and careful transportation.",
    icon: "🔒",
    features: [
      "Protective packaging materials",
      "Climate monitoring available",
      "Insurance options",
      "Expert handlers",
      "Damage-free guarantee",
    ],
    pricing: "Starting from KES 1,000",
    estimatedDelivery: "2-7 business days",
    bestFor: "Electronics, glassware, artwork, machinery, sensitive equipment",
  },
  {
    id: "temperature",
    name: "Temperature-Controlled",
    shortDesc: "Climate-managed transport for sensitive goods",
    description: "Maintain perfect conditions for temperature-sensitive shipments with our refrigerated vehicles and climate-controlled facilities.",
    icon: "❄️",
    features: [
      "Refrigerated vehicles (-5°C to 25°C)",
      "Constant temperature monitoring",
      "Pharmaceutical-grade handling",
      "Food-safe transport",
      "Real-time temperature tracking",
    ],
    pricing: "Starting from KES 2,000",
    estimatedDelivery: "2-5 business days",
    bestFor: "Pharmaceuticals, food items, vaccines, perishables, chemicals",
  },
  {
    id: "bulk",
    name: "Bulk Freight",
    shortDesc: "Large volume cargo solutions",
    description: "Move large quantities efficiently with our bulk freight service. Dedicated vehicles and competitive rates for high-volume shipments.",
    icon: "🚛",
    features: [
      "Large capacity vehicles (up to 10 tons)",
      "Competitive bulk rates",
      "Scheduled services",
      "Custom solutions available",
      "Dedicated account managers",
    ],
    pricing: "Custom quotes for bulk orders",
    estimatedDelivery: "Flexible scheduling",
    bestFor: "Wholesale distribution, retail restocking, manufacturing supplies",
  },
  {
    id: "port",
    name: "Port & Sea Freight",
    shortDesc: "International and sea freight services",
    description: "Connect with the world through our sea freight and port services. Full container load (FCL) and less than container load (LCL) options.",
    icon: "⛴️",
    features: [
      "FCL and LCL options",
      "Customs clearance assistance",
      "Documentation support",
      "Port handling services",
      "International shipping",
    ],
    pricing: "Custom quotes",
    estimatedDelivery: "7-30 days (depending on route)",
    bestFor: "International trade, import/export, large shipments",
  },
]

export const whyChooseUs = [
  {
    title: "Fast & Reliable",
    description: "On-time delivery guaranteed. Track your shipment in real-time from pickup to delivery.",
    icon: "✓",
  },
  {
    title: "Professional Team",
    description: "Experienced handlers and professional drivers across all locations. Your cargo is in safe hands.",
    icon: "👥",
  },
  {
    title: "Wide Coverage",
    description: "Serving Kenya, Uganda, Tanzania, Rwanda, and Burundi. We reach where others don't.",
    icon: "🗺️",
  },
  {
    title: "Affordable Rates",
    description: "Competitive pricing without compromising quality. Get the best value for your money.",
    icon: "💰",
  },
  {
    title: "24/7 Support",
    description: "Round-the-clock customer service. We're always here when you need us.",
    icon: "📞",
  },
  {
    title: "Fully Insured",
    description: "All shipments covered with comprehensive insurance. Ship with confidence.",
    icon: "🛡️",
  },
]

export const coverage = {
  countries: [
    { name: "Kenya", flag: "🇰🇪", cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru"] },
    { name: "Uganda", flag: "🇺🇬", cities: ["Kampala", "Jinja", "Mbale"] },
    { name: "Tanzania", flag: "🇹🇿", cities: ["Dar es Salaam", "Arusha"] },
    // { name: "Rwanda", flag: "🇷🇼", cities: ["Kigali"] },
    // { name: "Burundi", flag: "🇧🇮", cities: ["Bujumbura"] },
  ],
  hubs: [
    { name: "Nairobi Hub", city: "Nairobi", country: "Kenya", type: "Main", capacity: "24/7" },
    { name: "Mombasa Port", city: "Mombasa", country: "Kenya", type: "Port", capacity: "24/7" },
    { name: "Kampala Hub", city: "Kampala", country: "Uganda", type: "Regional", capacity: "Business Hours" },
    // { name: "Dar Hub", city: "Dar es Salaam", country: "Tanzania", type: "Regional", capacity: "Business Hours" },
  ],
}

export const testimonials = [
  {
    name: "David Kipchoge",
    company: "Tech Solutions Ltd",
    role: "Logistics Manager",
    feedback: "Jiji Freight has been reliable for all our shipments. Excellent service and competitive rates. Highly recommended!",
    rating: 5,
    image: "👨‍💼",
  },
  {
    name: "Sarah Mwangi",
    company: "Fashion Boutique",
    role: "Owner",
    feedback: "Fast delivery and professional handling. They delivered our shipment 2 days early. Very impressed!",
    rating: 5,
    image: "👩‍💼",
  },
  {
    name: "James Omondi",
    company: "Manufacturing Co.",
    role: "Supply Chain Director",
    feedback: "Great service across multiple countries. Professional team and responsive customer support.",
    rating: 5,
    image: "👨‍💼",
  },
  {
    name: "Grace Njoroge",
    company: "E-commerce Store",
    role: "Operations Manager",
    feedback: "Best freight service I've used. Real-time tracking is amazing. Worth every shilling!",
    rating: 5,
    image: "👩‍💼",
  },
]

export const blogContent = [
  {
    id: 1,
    title: "Tips for Packing Fragile Items for Shipping",
    excerpt: "Learn the best practices for packing delicate items to ensure safe delivery.",
    category: "Shipping Tips",
    date: "2026-10-15",
    author: "Jiji Team",
    image: "/images/blog-packing.jpg",
    content: `
When shipping fragile items, proper packing is crucial to ensure your cargo arrives safely. Here are our expert tips:

## Use Quality Packing Materials
- Double box method: Pack items in one box, then place that box in a larger box with cushioning
- Use bubble wrap, packing peanuts, or foam for protection
- Wrap each item individually before placing in the box

## Secure Everything
- Use packing tape on all seams and edges
- Label the box as "FRAGILE" on multiple sides
- Include "This Side Up" arrows if applicable

## Choose Right Shipping Service
- Consider our Fragile Cargo Handling service for valuable items
- Use temperature control if needed
- Opt for express delivery for expensive items

## Document and Insure
- Take photos of items before shipping
- Keep receipts and documentation
- Consider insurance coverage for valuable items

## Provide Clear Instructions
- Include handling instructions on the package
- Provide contact information
- Include any special requirements

With Jiji Freight's Fragile Cargo Handling service, your delicate items are protected every step of the way.
    `,
  },
  {
    id: 2,
    title: "How to Track Your Shipment in Real-Time",
    excerpt: "Master the art of shipment tracking with our comprehensive guide.",
    category: "How-To",
    date: "2026-10-10",
    author: "Jiji Team",
    image: "/images/blog-tracking.jpg",
    content: `
Real-time tracking is one of our most powerful features. Here's how to use it:

## Getting Your Tracking Number
Every shipment with Jiji Freight comes with a unique tracking number. You'll receive it via:
- Email confirmation
- SMS notification
- Your account dashboard

## Accessing Tracking Information
1. Visit our website and enter your tracking number
2. Check email/SMS updates automatically
3. Access via mobile app for on-the-go tracking

## What You Can See
- Current location of your shipment
- Estimated delivery time
- Handling history
- Driver information
- Real-time GPS updates

## Setting Up Alerts
- Receive notifications at key stages
- Get alerts for delays
- Receive delivery confirmation

## Tips for Best Results
- Keep your tracking number safe
- Update phone number for SMS alerts
- Check tracking regularly
- Contact support if no updates in 24 hours

Stay informed and in control with Jiji Freight's real-time tracking!
    `,
  },
  {
    id: 3,
    title: "East Africa Freight Market Trends 2026",
    excerpt: "An overview of logistics trends shaping East Africa's freight industry.",
    category: "Industry News",
    date: "2026-10-05",
    author: "Jiji Team",
    image: "/images/blog-trends.jpg",
    content: `
The East African freight industry is evolving rapidly. Here are the key trends we're seeing:

## Technology Integration
- GPS tracking becoming standard
- Mobile apps for booking
- Real-time updates
- Digital documentation

## Sustainability Focus
- Electric vehicles in fleet
- Eco-friendly packaging
- Carbon tracking
- Green logistics practices

## E-commerce Growth
- Increased online shopping
- Same-day delivery demand
- Smaller shipment sizes
- More frequent deliveries

## Regional Expansion
- Cross-border efficiency improving
- New regional hubs
- Better customs processes
- Integrated services

## Customer Expectations
- Transparency and tracking
- Speed and reliability
- Competitive pricing
- Professional service

At Jiji Freight, we're leading these trends by:
- Investing in technology
- Expanding coverage
- Improving efficiency
- Maintaining affordability

Stay ahead of the curve with Jiji Freight!
    `,
  },
  {
    id: 4,
    title: "Express vs. Standard Shipping: Which Should You Choose?",
    excerpt: "Understanding the differences and when to use each service.",
    category: "Shipping Tips",
    date: "2026-09-28",
    author: "Jiji Team",
    image: "/images/blog-express-vs-standard.jpg",
    content: `
Choosing between express and standard shipping depends on your needs and budget. Let's break it down:

## Express Delivery
### Best For:
- Time-sensitive shipments
- Emergency orders
- High-value items
- Urgent documents

### Advantages:
- Next-day delivery guaranteed
- Priority handling
- Real-time tracking
- Signature required
- Insurance included

### Cost:
- Premium pricing (KES 500-2000)
- Worth the cost for urgent needs

## Standard Shipping
### Best For:
- Regular orders
- Non-urgent shipments
- Budget-conscious customers
- Bulk orders

### Advantages:
- Affordable rates
- Reliable delivery (2-5 days)
- Full tracking available
- Professional handling
- Flexible scheduling

### Cost:
- Competitive rates
- Best for regular use

## Decision Matrix
- Urgent? → Express
- Budget-conscious? → Standard
- Valuable item? → Express
- Regular shipment? → Standard
- Need it tomorrow? → Express
- Can wait a week? → Standard

## Pro Tips
- Combine services for optimal results
- Use standard for planned shipments
- Keep express for emergencies
- Consider your customer base
- Plan ahead when possible

Jiji Freight makes it easy to choose and switch between services based on your needs!
    `,
  },
]

export const faq = [
  {
    question: "How long does shipping take?",
    answer: "Delivery times depend on the service: Express (24 hours), Standard (2-5 days), and others vary by distance. Check specific service details for exact timeframes.",
  },
  {
    question: "What areas do you cover?",
    answer: "We serve Kenya, Uganda, Tanzania, Rwanda, and Burundi with major hubs in Nairobi, Mombasa, Kampala, and Dar es Salaam.",
  },
  {
    question: "How do I track my shipment?",
    answer: "Each shipment gets a unique tracking number. Track it on our website, mobile app, or via email/SMS notifications for real-time updates.",
  },
  {
    question: "Is my shipment insured?",
    answer: "Yes, all shipments come with basic insurance. We offer enhanced insurance options for high-value items.",
  },
  {
    question: "Can I modify my order after booking?",
    answer: "For pending shipments, modifications can be made. Contact our support team immediately. For shipments in transit, contact our customer service for options.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept M-Pesa, bank transfers, credit cards, cash on delivery, and corporate accounts for bulk customers.",
  },
  {
    question: "What happens if my shipment is delayed?",
    answer: "We guarantee on-time delivery. If delayed, we offer a refund or credit for future shipments. We also notify customers immediately of any delays.",
  },
  {
    question: "Do you handle international shipping?",
    answer: "Yes, through our Port & Sea Freight service. We offer FCL and LCL options for international shipments.",
  },
]

export const statsContent = [
  { label: "Successful Deliveries", value: "50,000+", icon: "📦" },
  { label: "Active Customers", value: "10,000+", icon: "👥" },
  { label: "Coverage Areas", value: "5 Countries", icon: "🗺️" },
  { label: "On-Time Rate", value: "99.2%", icon: "⏱️" },
]

export const ctaContent = {
  title: "Ready to Ship?",
  subtitle: "Get started with Jiji Freight today",
  description: "Quick quote, reliable service, guaranteed delivery. Your logistics partner for East Africa.",
  primaryCta: "Get a Quote Now",
  secondaryCta: "Contact Us",
}

export const contactInfo = {
  mainOffice: {
    name: "Jiji East Africa Limited",
    address: "Armana Shopping Complex, 3rd Floor, Room T2",
    street: "Captain Mungai St, Eastleigh",
    city: "Nairobi, Kenya",
    poBox: "P.O. Box 787-00610, Nairobi",
    phone: {
      darow: "+254 726-497674",
      abdinoor: "+254 722-682976",
      dekow: "+254 726-803000"
    },
    email: "info@jijieastafrica.co.ke"
  }
}

export const navigationContent = {
  mainMenu: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Tracking", href: "/tracking" },
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  serviceMenu: [
    { label: "Express", href: "/services/express" },
    { label: "Standard", href: "/services/standard" },
    { label: "Fragile", href: "/services/fragile" },
    { label: "Temperature Control", href: "/services/temperature" },
    { label: "Bulk", href: "/services/bulk" },
    { label: "Port Services", href: "/services/port" },
  ],
}
