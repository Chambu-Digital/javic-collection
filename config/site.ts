/**
 * Site Configuration
 * Jiji East Africa Limited Branding & Settings
 */

export const siteConfig = {
  name: 'Jiji Freight',
  fullName: 'Jiji East Africa Limited',
  description: 'Fast, reliable freight and logistics services across East Africa',
  url: 'https://www.jijifreight.com',
  ogImage: 'https://www.jijifreight.com/og-image.jpg',
  mailingList: 'https://eepurl.com/jiji-freight',

  // Navigation
  mainNav: [
    {
      title: 'Home',
      href: '/',
    },
    {
      title: 'Services',
      href: '/services',
      submenu: [
        { title: 'Express Delivery', href: '/services/express' },
        { title: 'Standard Shipping', href: '/services/standard' },
        { title: 'Fragile Cargo', href: '/services/fragile' },
        { title: 'Bulk Freight', href: '/services/bulk' },
        { title: 'Port Services', href: '/services/port' },
      ],
    },
    {
      title: 'Tracking',
      href: '/tracking',
    },
    {
      title: 'About',
      href: '/about',
    },
    {
      title: 'Contact',
      href: '/contact',
    },
  ],

  // Company Details
  company: {
    name: 'Jiji East Africa Limited',
    tagline: 'Moving Your Cargo, Delivering Excellence',
    email: 'support@jijifreight.com',
    phone: '+254 (0)20 XXXX XXXX', // Update with actual number
    whatsapp: '+254712345678', // Update with actual number
    address: 'Nairobi, Kenya',
  },

  // Brand Colors
  colors: {
    primary: '#1E90FF', // Bright Blue
    primaryDark: '#003D7A', // Dark Blue
    secondary: '#FFD700', // Gold/Yellow
    tertiary: '#1A7FDD', // Darker Blue
    success: '#27AE60',
    warning: '#F39C12',
    danger: '#E74C3C',
    muted: '#6B7280',
  },

  // Features
  features: {
    realTimeTracking: true,
    onlineQuoting: true,
    insurance: true,
    multiCountry: true,
    expressDelivery: true,
    temperatureControl: true,
    portServices: true,
  },

  // Service Areas
  serviceAreas: {
    countries: ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi'],
    majorCities: [
      'Nairobi',
      'Mombasa',
      'Kampala',
      'Dar es Salaam',
      'Kigali',
      'Bujumbura',
    ],
    estimatedCoverage: '95% of East Africa',
  },

  // Social Links
  social: {
    facebook: 'https://facebook.com/jijifreight',
    twitter: 'https://twitter.com/jijifreight',
    instagram: 'https://instagram.com/jijifreight',
    linkedin: 'https://linkedin.com/company/jijifreight',
    youtube: 'https://youtube.com/@jijifreight',
  },

  // Support
  support: {
    email: 'support@jijifreight.com',
    phone: '+254 (0)20 XXXX XXXX',
    whatsapp: '+254712345678',
    hours: '24/7',
    responseTime: 'Within 2 hours',
  },

  // Legal
  legal: {
    companyRegistration: 'CPR/REG/XXXXX', // Update with actual
    taxPin: 'P000XXXXXX', // Update with actual
    licenseNumber: 'FREIGHT-LICENSE-XXX', // Update with actual
    privacyPolicy: '/privacy-policy',
    termsOfService: '/terms-of-service',
    shippingPolicy: '/shipping-policy',
  },
}

// Page titles and descriptions for SEO
export const pages = {
  home: {
    title: 'Jiji East Africa Limited | Fast & Reliable Freight Services',
    description:
      'Professional freight and logistics services across East Africa. Express delivery, bulk shipping, and specialized cargo handling.',
  },
  services: {
    title: 'Freight Services | Jiji East Africa Limited',
    description:
      'Explore our comprehensive freight solutions including express delivery, standard shipping, and specialized cargo handling.',
  },
  tracking: {
    title: 'Track Your Shipment | Jiji Freight',
    description: 'Track your shipment in real-time using your tracking number.',
  },
  quote: {
    title: 'Get a Quote | Jiji Freight',
    description:
      'Calculate your shipping cost instantly. No credit card required.',
  },
  about: {
    title: 'About Jiji East Africa Limited',
    description:
      'Learn about our company, mission, and commitment to excellence in freight services.',
  },
  contact: {
    title: 'Contact Us | Jiji Freight',
    description:
      'Get in touch with our team for quotes, inquiries, and support.',
  },
  admin: {
    title: 'Admin Dashboard | Jiji Freight',
    description: 'Manage shipments, services, rates, and campaigns.',
  },
}

// Email configurations
export const emailConfig = {
  fromName: 'Jiji Freight',
  fromEmail: 'noreply@jijifreight.com',
  supportEmail: 'support@jijifreight.com',
  templates: {
    welcome: 'Welcome to Jiji Freight',
    shipmentCreated: 'Your Shipment Has Been Created',
    shipmentInTransit: 'Your Shipment Is In Transit',
    shipmentDelivered: 'Your Shipment Has Been Delivered',
    tracking: 'Track Your Shipment',
    quote: 'Your Shipping Quote',
    support: 'We Are Here to Help',
  },
}

// SMS configurations
export const smsConfig = {
  senderName: 'JIJI',
  templates: {
    shipmentCreated: 'Your shipment SHP{number} has been created. Track: {url}',
    inTransit: 'Your shipment is on the way! Latest update: {status}',
    delivered: 'Your shipment has been delivered! Thank you for using Jiji Freight.',
    quote: 'Your shipping quote for {weight}kg is KES {price}. Valid for 24hrs.',
  },
}
