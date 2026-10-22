/**
 * Landing Page Content
 * Jiji East Africa Limited - Freight & Logistics Services
 */

export const landingPageContent = {
  hero: {
    title: 'Jiji East Africa Limited',
    subtitle: 'Your Trusted Freight & Logistics Partner',
    description:
      'Fast, reliable, and professional freight services across East Africa. Moving your cargo with excellence.',
    cta: 'Get a Quote',
    ctaSecondary: 'Learn More',
  },

  services: {
    title: 'Our Services',
    subtitle: 'Comprehensive freight and logistics solutions',
    items: [
      {
        title: 'Express Delivery',
        description: 'Next-day delivery within metro areas. Perfect for urgent shipments.',
        icon: '⚡',
      },
      {
        title: 'Standard Shipping',
        description: 'Reliable shipping across East Africa with scheduled deliveries.',
        icon: '📦',
      },
      {
        title: 'Fragile Cargo',
        description: 'Specialized handling for delicate and valuable items.',
        icon: '🔒',
      },
      {
        title: 'Temperature Control',
        description: 'Climate-controlled transport for sensitive cargo.',
        icon: '❄️',
      },
      {
        title: 'Bulk Freight',
        description: 'Large volume cargo solutions with competitive rates.',
        icon: '🚛',
      },
      {
        title: 'Port Services',
        description: 'Sea freight, customs clearance, and port handling.',
        icon: '⛴️',
      },
    ],
  },

  whyChoose: {
    title: 'Why Choose Jiji Freight?',
    subtitle: 'We deliver more than cargo - we deliver peace of mind',
    points: [
      {
        title: 'Fast & Reliable',
        description: 'On-time delivery guaranteed with real-time tracking',
      },
      {
        title: 'Professional Team',
        description: 'Experienced handlers and drivers across all locations',
      },
      {
        title: 'Wide Coverage',
        description: 'Serving Kenya, Uganda, Tanzania, Rwanda, and Burundi',
      },
      {
        title: 'Competitive Rates',
        description: 'Best prices in the market with no hidden charges',
      },
      {
        title: '24/7 Support',
        description: 'Round-the-clock customer service and support',
      },
      {
        title: 'Fully Insured',
        description: 'All shipments covered with comprehensive insurance',
      },
    ],
  },

  coverage: {
    title: 'Our Coverage',
    subtitle: 'Connected across East Africa',
    description: 'With hubs in major cities, we ensure efficient service delivery',
    countries: ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi'],
    majorCities: [
      { name: 'Nairobi', country: 'Kenya', type: 'Hub' },
      { name: 'Mombasa', country: 'Kenya', type: 'Port' },
      { name: 'Kampala', country: 'Uganda', type: 'Hub' },
      { name: 'Dar es Salaam', country: 'Tanzania', type: 'Hub' },
      { name: 'Kigali', country: 'Rwanda', type: 'Hub' },
      { name: 'Bujumbura', country: 'Burundi', type: 'Hub' },
    ],
  },

  testimonials: {
    title: 'What Our Customers Say',
    subtitle: 'Real feedback from satisfied clients',
    items: [
      {
        name: 'David Kipchoge',
        company: 'Tech Solutions Ltd',
        testimonial:
          'Jiji Freight has been reliable for our shipments. Excellent service and competitive rates.',
        rating: 5,
      },
      {
        name: 'Sarah Mwangi',
        company: 'Fashion Boutique',
        testimonial:
          'Fast delivery and professional handling. Highly recommended for urgent shipments.',
        rating: 5,
      },
      {
        name: 'James Omondi',
        company: 'Manufacturing Co.',
        testimonial:
          'Great service across multiple countries. Their team is professional and responsive.',
        rating: 5,
      },
    ],
  },

  pricing: {
    title: 'Simple, Transparent Pricing',
    subtitle: 'No hidden charges, just honest rates',
    description:
      'Our pricing is based on weight, distance, and service type. Get instant quotes online.',
    cta: 'Calculate Your Rate',
    note: 'Rates vary based on cargo type, weight, distance, and special handling requirements.',
  },

  cta: {
    title: 'Ready to Ship?',
    description: 'Get a free quote in seconds. No credit card required.',
    button: 'Get a Quote Now',
  },

  footer: {
    description:
      'Jiji East Africa Limited - Your trusted freight and logistics partner across East Africa.',
    quickLinks: [
      { label: 'Home', href: '/' },
      { label: 'Services', href: '/services' },
      { label: 'Track Shipment', href: '/tracking' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'About Us', href: '/about' },
    ],
    services: [
      { label: 'Express Delivery', href: '/services/express' },
      { label: 'Standard Shipping', href: '/services/standard' },
      { label: 'Bulk Freight', href: '/services/bulk' },
      { label: 'Port Services', href: '/services/port' },
    ],
    company: [
      { label: 'About Jiji Freight', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Shipping Policy', href: '/shipping-policy' },
    ],
  },
}

export const pageMetadata = {
  home: {
    title: 'Jiji East Africa Limited | Freight & Logistics Services',
    description:
      'Fast, reliable freight services across East Africa. Express delivery, bulk shipping, and specialized cargo handling.',
    keywords: [
      'freight services',
      'logistics',
      'shipping',
      'East Africa',
      'cargo delivery',
      'express delivery',
    ],
  },
  services: {
    title: 'Our Services | Jiji Freight',
    description: 'Comprehensive freight and logistics solutions for every need',
  },
  contact: {
    title: 'Contact Us | Jiji Freight',
    description: 'Get in touch with our team for quotes and inquiries',
  },
  about: {
    title: 'About Jiji Freight',
    description:
      'Learn about Jiji East Africa Limited and our commitment to excellence',
  },
}
