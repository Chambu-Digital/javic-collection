import connectDB from './mongodb'
import Category from '../models/Category'
import Product from '../models/Product'

const categories = [
  {
    name: 'Skincare & Beauty',
    slug: 'skincare-beauty',
    description: 'Discover our premium collection of natural skincare products designed to nourish and revitalize your skin.',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
    icon: 'Flower2',
    isActive: true
  },
  {
    name: 'Herbal Remedies',
    slug: 'herbal-remedies',
    description: 'Traditional herbal solutions for modern wellness needs, crafted with time-tested natural ingredients.',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',
    icon: 'Leaf',
    isActive: true
  },
  {
    name: 'Essential Oils',
    slug: 'essential-oils',
    description: 'Pure, therapeutic-grade essential oils for aromatherapy, wellness, and natural healing.',
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800',
    icon: 'Droplet',
    isActive: true
  },
  {
    name: 'Haircare',
    slug: 'haircare',
    description: 'Natural hair care products that nourish and strengthen your hair from root to tip.',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    icon: 'Wind',
    isActive: true
  },
  {
    name: 'Soaps & Body Care',
    slug: 'soaps-body-care',
    description: 'Luxurious natural soaps and body care products for healthy, glowing skin.',
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800',
    icon: 'Soap',
    isActive: true
  },
  {
    name: 'Health & Wellness',
    slug: 'health-wellness',
    description: 'Holistic wellness products to support your overall health and well-being.',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
    icon: 'Heart',
    isActive: true
  },
  {
    name: 'Organic Ingredients',
    slug: 'organic-ingredients',
    description: 'Pure, organic ingredients for DIY natural products and recipes.',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800',
    icon: 'LeafIcon',
    isActive: true
  },
  {
    name: 'Bundles & Gift Sets',
    slug: 'bundles-gift-sets',
    description: 'Curated gift sets and product bundles perfect for yourself or loved ones.',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',
    icon: 'Gift',
    isActive: true
  }
]

const products = [
  // Premium Face Serum Collection
  {
    name: 'Premium Face Serum Collection',
    slug: 'premium-face-serum-collection',
    description: 'Our premium face serum collection offers multiple sizes and scents to suit your skincare needs. Each variant is carefully crafted with organic ingredients.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-serum-15ml-rose',
        type: 'size',
        value: '15ml Rose',
        price: 25.99,
        oldPrice: 35.99,
        wholesalePrice: 20.99,
        wholesaleThreshold: 10,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
        stock: 20,
        sku: 'SER-15ML-ROSE',
        isActive: true
      },
      {
        id: 'variant-serum-30ml-rose',
        type: 'size',
        value: '30ml Rose',
        price: 45.99,
        oldPrice: 59.99,
        wholesalePrice: 38.99,
        wholesaleThreshold: 8,
        image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500',
        stock: 15,
        sku: 'SER-30ML-ROSE',
        isActive: true
      },
      {
        id: 'variant-serum-30ml-lavender',
        type: 'scent',
        value: '30ml Lavender',
        price: 48.99,
        oldPrice: 62.99,
        wholesalePrice: 41.99,
        wholesaleThreshold: 8,
        image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=500',
        stock: 12,
        sku: 'SER-30ML-LAV',
        isActive: true
      }
    ],
    category: 'Skincare & Beauty',
    inStock: true,
    stockQuantity: 47,
    rating: 4.8,
    reviews: 124,
    isBestseller: true,
    isFeatured: true,
    ingredients: 'Rose extract, Lavender oil, Jojoba oil, Vitamin E, Rosehip oil',
    usage: 'Apply 2-3 drops to clean, damp face. Gently massage upward. Use morning and night.',
    benefits: [
      'Deep hydration and moisture retention',
      'Reduces fine lines and wrinkles', 
      'Enhances skin radiance and glow',
      'Anti-inflammatory properties',
      '100% natural and organic ingredients'
    ],
    tags: ['anti-aging', 'hydrating', 'organic', 'variants'],
    isActive: true
  },
  // Rose Petal Face Serum
  {
    name: 'Rose Petal Face Serum',
    slug: 'rose-petal-face-serum',
    description: 'Our signature Rose Petal Face Serum is a luxurious blend of organic rose extract and essential oils designed to deeply nourish and revitalize your skin.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-rose-15ml',
        type: 'size',
        value: '15ml Bottle',
        price: 35.99,
        oldPrice: 45.99,
        wholesalePrice: 28.99,
        wholesaleThreshold: 12,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
        stock: 25,
        sku: 'ROSE-15ML-001',
        isActive: true
      },
      {
        id: 'variant-rose-30ml',
        type: 'size',
        value: '30ml Bottle',
        price: 45.99,
        oldPrice: 59.99,
        wholesalePrice: 38.99,
        wholesaleThreshold: 10,
        image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500',
        stock: 20,
        sku: 'ROSE-30ML-001',
        isActive: true
      },
      {
        id: 'variant-rose-50ml',
        type: 'size',
        value: '50ml Bottle',
        price: 65.99,
        oldPrice: 79.99,
        wholesalePrice: 54.99,
        wholesaleThreshold: 8,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
        stock: 15,
        sku: 'ROSE-50ML-001',
        isActive: true
      }
    ],
    category: 'Skincare & Beauty',
    inStock: true,
    stockQuantity: 60,
    rating: 4.8,
    reviews: 124,
    isBestseller: true,
    isFeatured: true,
    ingredients: 'Rose extract, Jojoba oil, Vitamin E, Rosehip oil, Essential oils of Rose and Geranium',
    usage: 'Apply 2-3 drops to clean, damp face. Gently massage upward. Use morning and night.',
    benefits: [
      'Deep hydration and moisture retention',
      'Reduces fine lines and wrinkles',
      'Enhances skin radiance and glow',
      'Anti-inflammatory properties',
      '100% natural and organic ingredients'
    ],
    tags: ['anti-aging', 'hydrating', 'organic', 'rose'],
    isActive: true
  },
  {
    name: 'Lavender Body Oil',
    slug: 'lavender-body-oil',
    description: 'Soothing lavender body oil perfect for relaxation and skin nourishment. Made with pure lavender essential oil and carrier oils.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-lavender-50ml',
        type: 'size',
        value: '50ml Bottle',
        price: 24.99,
        oldPrice: 34.99,
        wholesalePrice: 19.99,
        wholesaleThreshold: 12,
        image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=500',
        stock: 30,
        sku: 'LAV-50ML-001',
        isActive: true
      },
      {
        id: 'variant-lavender-100ml',
        type: 'size',
        value: '100ml Bottle',
        price: 39.99,
        oldPrice: 54.99,
        wholesalePrice: 32.99,
        wholesaleThreshold: 8,
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500',
        stock: 25,
        sku: 'LAV-100ML-001',
        isActive: true
      },
      {
        id: 'variant-lavender-200ml',
        type: 'size',
        value: '200ml Bottle',
        price: 69.99,
        oldPrice: 89.99,
        wholesalePrice: 59.99,
        wholesaleThreshold: 6,
        image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=500',
        stock: 20,
        sku: 'LAV-200ML-001',
        isActive: true
      }
    ],
    category: 'Essential Oils',
    inStock: true,
    stockQuantity: 75,
    rating: 4.6,
    reviews: 89,
    isFlashDeal: true,
    flashDealDiscount: 28,
    ingredients: 'Lavender essential oil, Sweet almond oil, Jojoba oil, Vitamin E',
    usage: 'Apply to damp skin after shower. Massage gently until absorbed.',
    benefits: ['Promotes relaxation', 'Moisturizes dry skin', 'Calming aromatherapy', 'Natural stress relief'],
    tags: ['lavender', 'relaxing', 'massage', 'aromatherapy']
  },
  {
    name: 'Chamomile Bath Soak',
    slug: 'chamomile-bath-soak',
    description: 'Relaxing chamomile bath soak with dried flowers and essential oils for a spa-like experience at home.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-chamomile-sachet',
        type: 'size',
        value: 'Single Use Sachet',
        price: 8.99,
        oldPrice: 12.99,
        wholesalePrice: 6.99,
        wholesaleThreshold: 20,
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
        stock: 50,
        sku: 'CHAM-SACH-001',
        isActive: true
      },
      {
        id: 'variant-chamomile-200g',
        type: 'size',
        value: '200g Jar',
        price: 22.99,
        oldPrice: 29.99,
        wholesalePrice: 18.99,
        wholesaleThreshold: 12,
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
        stock: 30,
        sku: 'CHAM-200G-001',
        isActive: true
      },
      {
        id: 'variant-chamomile-500g',
        type: 'size',
        value: '500g Jar',
        price: 45.99,
        oldPrice: 59.99,
        wholesalePrice: 38.99,
        wholesaleThreshold: 8,
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
        stock: 15,
        sku: 'CHAM-500G-001',
        isActive: true
      }
    ],
    category: 'Soaps & Body Care',
    inStock: true,
    stockQuantity: 95,
    rating: 4.6,
    reviews: 87,
    isNewProduct: true,
    ingredients: 'Dried chamomile flowers, Epsom salt, Sea salt, Chamomile essential oil',
    usage: 'Add 2-3 tablespoons to warm bath water. Soak for 15-20 minutes.',
    benefits: ['Soothes tired muscles', 'Calms the mind', 'Softens skin', 'Promotes better sleep'],
    tags: ['chamomile', 'bath', 'relaxing', 'sleep']
  },
  {
    name: 'Peppermint Hair Oil',
    slug: 'peppermint-hair-oil',
    description: 'Invigorating peppermint hair oil that stimulates scalp circulation and promotes healthy hair growth.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-peppermint-50ml',
        type: 'size',
        value: '50ml Bottle',
        price: 28.99,
        oldPrice: 38.99,
        wholesalePrice: 23.99,
        wholesaleThreshold: 15,
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
        stock: 25,
        sku: 'PEPP-50ML-001',
        isActive: true
      },
      {
        id: 'variant-peppermint-100ml',
        type: 'size',
        value: '100ml Bottle',
        price: 48.99,
        oldPrice: 64.99,
        wholesalePrice: 41.99,
        wholesaleThreshold: 10,
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
        stock: 15,
        sku: 'PEPP-100ML-001',
        isActive: true
      }
    ],
    category: 'Haircare',
    inStock: true,
    stockQuantity: 40,
    rating: 4.7,
    reviews: 102,
    isFeatured: true,
    ingredients: 'Peppermint essential oil, Coconut oil, Argan oil, Rosemary oil',
    usage: 'Massage into scalp and hair. Leave for 30 minutes before washing.',
    benefits: ['Stimulates hair growth', 'Refreshes scalp', 'Adds shine', 'Reduces dandruff'],
    tags: ['peppermint', 'hair-growth', 'scalp-care', 'refreshing']
  },
  {
    name: 'Organic Turmeric Mask',
    slug: 'organic-turmeric-mask',
    description: 'Brightening turmeric face mask with organic ingredients to even skin tone and reduce inflammation.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-turmeric-packet',
        type: 'size',
        value: 'Single Use Packet',
        price: 12.99,
        oldPrice: 16.99,
        wholesalePrice: 9.99,
        wholesaleThreshold: 25,
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500',
        stock: 40,
        sku: 'TURM-PACK-001',
        isActive: true
      },
      {
        id: 'variant-turmeric-50g',
        type: 'size',
        value: '50g Jar',
        price: 35.99,
        oldPrice: 45.99,
        wholesalePrice: 29.99,
        wholesaleThreshold: 12,
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500',
        stock: 25,
        sku: 'TURM-50G-001',
        isActive: true
      },
      {
        id: 'variant-turmeric-100g',
        type: 'size',
        value: '100g Jar',
        price: 59.99,
        oldPrice: 79.99,
        wholesalePrice: 49.99,
        wholesaleThreshold: 8,
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500',
        stock: 15,
        sku: 'TURM-100G-001',
        isActive: true
      }
    ],
    category: 'Skincare & Beauty',
    inStock: true,
    stockQuantity: 80,
    rating: 4.9,
    reviews: 156,
    isBestseller: true,
    ingredients: 'Organic turmeric powder, Bentonite clay, Honey, Coconut oil',
    usage: 'Mix with water to form paste. Apply to face, leave 15 minutes, rinse.',
    benefits: ['Brightens complexion', 'Reduces inflammation', 'Evens skin tone', 'Natural glow'],
    tags: ['turmeric', 'brightening', 'anti-inflammatory', 'organic']
  },
  {
    name: 'Eucalyptus Shower Steamers',
    slug: 'eucalyptus-shower-steamers',
    description: 'Aromatherapy shower steamers infused with eucalyptus oil for an invigorating shower experience.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-eucalyptus-4pack',
        type: 'size',
        value: '4-Pack Steamers',
        price: 18.99,
        oldPrice: 24.99,
        wholesalePrice: 15.99,
        wholesaleThreshold: 15,
        image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500',
        stock: 30,
        sku: 'EUCA-4PK-001',
        isActive: true
      },
      {
        id: 'variant-eucalyptus-8pack',
        type: 'size',
        value: '8-Pack Steamers',
        price: 32.99,
        oldPrice: 42.99,
        wholesalePrice: 27.99,
        wholesaleThreshold: 10,
        image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500',
        stock: 20,
        sku: 'EUCA-8PK-001',
        isActive: true
      },
      {
        id: 'variant-eucalyptus-12pack',
        type: 'size',
        value: '12-Pack Steamers',
        price: 45.99,
        oldPrice: 59.99,
        wholesalePrice: 38.99,
        wholesaleThreshold: 6,
        image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500',
        stock: 10,
        sku: 'EUCA-12PK-001',
        isActive: true
      }
    ],
    category: 'Health & Wellness',
    inStock: true,
    stockQuantity: 60,
    rating: 4.5,
    reviews: 73,
    isNewProduct: true,
    ingredients: 'Baking soda, Citric acid, Eucalyptus essential oil, Menthol',
    usage: 'Place one steamer on shower floor away from direct water stream.',
    benefits: ['Clears sinuses', 'Energizes mind', 'Aromatherapy benefits', 'Morning boost'],
    tags: ['eucalyptus', 'shower', 'aromatherapy', 'energizing']
  },
  {
    name: 'Aloe Vera Gel',
    slug: 'aloe-vera-gel',
    description: 'Pure aloe vera gel for soothing and healing skin irritations, burns, and dryness.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-aloe-100ml',
        type: 'size',
        value: '100ml Tube',
        price: 16.99,
        oldPrice: 22.99,
        wholesalePrice: 13.99,
        wholesaleThreshold: 15,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
        stock: 40,
        sku: 'ALOE-100ML-001',
        isActive: true
      },
      {
        id: 'variant-aloe-250ml',
        type: 'size',
        value: '250ml Bottle',
        price: 29.99,
        oldPrice: 39.99,
        wholesalePrice: 24.99,
        wholesaleThreshold: 10,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
        stock: 25,
        sku: 'ALOE-250ML-001',
        isActive: true
      },
      {
        id: 'variant-aloe-500ml',
        type: 'size',
        value: '500ml Bottle',
        price: 49.99,
        oldPrice: 64.99,
        wholesalePrice: 42.99,
        wholesaleThreshold: 6,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
        stock: 15,
        sku: 'ALOE-500ML-001',
        isActive: true
      }
    ],
    category: 'Skincare & Beauty',
    inStock: true,
    stockQuantity: 80,
    rating: 4.7,
    reviews: 195,
    isFeatured: true,
    ingredients: '99% Pure Aloe Vera gel, Vitamin E, Natural preservatives',
    usage: 'Apply generously to affected area. Reapply as needed.',
    benefits: ['Soothes burns', 'Heals cuts', 'Moisturizes skin', 'Anti-inflammatory'],
    tags: ['aloe-vera', 'healing', 'soothing', 'natural']
  },
  {
    name: 'Lavender Sleep Pillow Mist',
    slug: 'lavender-sleep-pillow-mist',
    description: 'Calming lavender pillow mist to promote restful sleep and relaxation.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-pillow-50ml',
        type: 'size',
        value: '50ml Travel Size',
        price: 18.99,
        oldPrice: 24.99,
        wholesalePrice: 15.99,
        wholesaleThreshold: 18,
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500',
        stock: 25,
        sku: 'PILL-50ML-001',
        isActive: true
      },
      {
        id: 'variant-pillow-100ml',
        type: 'size',
        value: '100ml Standard',
        price: 24.99,
        oldPrice: 32.99,
        wholesalePrice: 21.99,
        wholesaleThreshold: 12,
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500',
        stock: 20,
        sku: 'PILL-100ML-001',
        isActive: true
      }
    ],
    category: 'Health & Wellness',
    inStock: true,
    stockQuantity: 45,
    rating: 4.8,
    reviews: 142,
    ingredients: 'Lavender essential oil, Chamomile extract, Distilled water, Natural emulsifier',
    usage: 'Spray 2-3 times on pillow and bedding 10 minutes before sleep.',
    benefits: ['Promotes sleep', 'Reduces anxiety', 'Calming aroma', 'Natural relaxation'],
    tags: ['lavender', 'sleep', 'pillow-mist', 'relaxation']
  },
  {
    name: 'Shea Butter Body Lotion',
    slug: 'shea-butter-body-lotion',
    description: 'Rich shea butter body lotion that deeply moisturizes and nourishes dry skin.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-shea-200ml',
        type: 'size',
        value: '200ml Bottle',
        price: 32.99,
        oldPrice: 42.99,
        wholesalePrice: 27.99,
        wholesaleThreshold: 12,
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500',
        stock: 20,
        sku: 'SHEA-200ML-001',
        isActive: true
      },
      {
        id: 'variant-shea-400ml',
        type: 'size',
        value: '400ml Bottle',
        price: 55.99,
        oldPrice: 72.99,
        wholesalePrice: 47.99,
        wholesaleThreshold: 8,
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500',
        stock: 15,
        sku: 'SHEA-400ML-001',
        isActive: true
      }
    ],
    category: 'Soaps & Body Care',
    inStock: true,
    stockQuantity: 35,
    rating: 4.6,
    reviews: 118,
    ingredients: 'Shea butter, Coconut oil, Glycerin, Vitamin E, Natural fragrance',
    usage: 'Apply to clean, damp skin. Massage until fully absorbed.',
    benefits: ['Deep moisturization', 'Long-lasting hydration', 'Softens skin', 'Non-greasy formula'],
    tags: ['shea-butter', 'moisturizing', 'body-lotion', 'hydrating']
  },
  {
    name: 'Organic Face Cream',
    slug: 'organic-face-cream',
    description: 'Nourishing organic face cream with natural ingredients for daily skincare routine.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-face-50ml',
        type: 'size',
        value: '50ml Jar',
        price: 39.99,
        oldPrice: 59.99,
        wholesalePrice: 32.99,
        wholesaleThreshold: 10,
        image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500',
        stock: 15,
        sku: 'FACE-50ML-001',
        isActive: true
      },
      {
        id: 'variant-face-100ml',
        type: 'size',
        value: '100ml Jar',
        price: 69.99,
        oldPrice: 89.99,
        wholesalePrice: 59.99,
        wholesaleThreshold: 6,
        image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500',
        stock: 10,
        sku: 'FACE-100ML-001',
        isActive: true
      }
    ],
    category: 'Skincare & Beauty',
    inStock: true,
    stockQuantity: 25,
    rating: 4.7,
    reviews: 98,
    isFlashDeal: true,
    flashDealDiscount: 33,
    ingredients: 'Organic shea butter, Jojoba oil, Hyaluronic acid, Vitamin C, Rose water',
    usage: 'Apply to clean face morning and evening. Massage gently.',
    benefits: ['Anti-aging properties', 'Hydrates skin', 'Improves texture', 'Natural glow'],
    tags: ['organic', 'face-cream', 'anti-aging', 'daily-care']
  },
  {
    name: 'Herbal Tea Set',
    slug: 'herbal-tea-set',
    description: 'Collection of premium herbal teas for wellness and relaxation.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-tea-starter',
        type: 'custom',
        value: 'Starter Set (3 teas)',
        price: 19.99,
        oldPrice: 29.99,
        wholesalePrice: 16.99,
        wholesaleThreshold: 15,
        image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500',
        stock: 30,
        sku: 'TEA-START-001',
        isActive: true
      },
      {
        id: 'variant-tea-complete',
        type: 'custom',
        value: 'Complete Set (5 teas)',
        price: 29.99,
        oldPrice: 44.99,
        wholesalePrice: 25.99,
        wholesaleThreshold: 10,
        image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500',
        stock: 20,
        sku: 'TEA-COMP-001',
        isActive: true
      }
    ],
    category: 'Health & Wellness',
    inStock: true,
    stockQuantity: 50,
    rating: 4.5,
    reviews: 76,
    isFlashDeal: true,
    flashDealDiscount: 33,
    ingredients: 'Chamomile, Peppermint, Ginger, Lemon balm, Hibiscus',
    usage: 'Steep 1 tea bag in hot water for 5-7 minutes.',
    benefits: ['Promotes digestion', 'Calming effect', 'Antioxidant rich', 'Natural wellness'],
    tags: ['herbal-tea', 'wellness', 'relaxation', 'organic']
  },
  {
    name: 'Charcoal Soap Bar',
    slug: 'charcoal-soap-bar',
    description: 'Detoxifying charcoal soap bar that deep cleanses and purifies the skin.',
    hasVariants: true,
    price: 0,
    images: [],
    variants: [
      {
        id: 'variant-charcoal-single',
        type: 'size',
        value: 'Single Bar',
        price: 8.99,
        oldPrice: 14.99,
        wholesalePrice: 6.99,
        wholesaleThreshold: 20,
        image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500',
        stock: 50,
        sku: 'CHAR-1BAR-001',
        isActive: true
      },
      {
        id: 'variant-charcoal-3pack',
        type: 'size',
        value: '3-Pack Bars',
        price: 22.99,
        oldPrice: 34.99,
        wholesalePrice: 18.99,
        wholesaleThreshold: 10,
        image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500',
        stock: 30,
        sku: 'CHAR-3PK-001',
        isActive: true
      },
      {
        id: 'variant-charcoal-6pack',
        type: 'size',
        value: '6-Pack Bars',
        price: 39.99,
        oldPrice: 59.99,
        wholesalePrice: 32.99,
        wholesaleThreshold: 6,
        image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500',
        stock: 20,
        sku: 'CHAR-6PK-001',
        isActive: true
      }
    ],
    category: 'Soaps & Body Care',
    inStock: true,
    stockQuantity: 100,
    rating: 4.4,
    reviews: 92,
    isFlashDeal: true,
    flashDealDiscount: 40,
    ingredients: 'Activated charcoal, Coconut oil, Olive oil, Shea butter, Tea tree oil',
    usage: 'Lather with water and apply to wet skin. Rinse thoroughly.',
    benefits: ['Deep cleansing', 'Removes impurities', 'Controls oil', 'Natural detox'],
    tags: ['charcoal', 'detox', 'cleansing', 'soap']
  }
]

export async function seedDatabase() {
  try {
    await connectDB()
    
    // Clear existing data
    await Category.deleteMany({})
    await Product.deleteMany({})
    
    console.log('Cleared existing data')
    
    // Seed categories
    const createdCategories = await Category.insertMany(categories)
    console.log(`Seeded ${createdCategories.length} categories`)
    
    // Create a map of category names to IDs
    const categoryMap = new Map()
    createdCategories.forEach(cat => {
      categoryMap.set(cat.name, cat._id)
    })
    
    // Add categoryId to products and ensure isActive is true
    const productsWithCategoryId = products.map(product => ({
      ...product,
      categoryId: categoryMap.get(product.category),
      isActive: true
    }))
    
    // Seed products
    const createdProducts = await Product.insertMany(productsWithCategoryId)
    console.log(`Seeded ${createdProducts.length} products`)
    
    console.log('Database seeded successfully!')
    return { success: true, categories: createdCategories.length, products: createdProducts.length || 0 }
    
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  }
}