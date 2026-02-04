// Read environment variables manually from .env.local
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join('=');
        }
      }
    }
  } catch (error) {
    console.log('Could not load .env.local file');
  }
}

loadEnvLocal();

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// Define the schema (same as in the model)
const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  content: { type: String, required: true },
  excerpt: { type: String, required: true, trim: true },
  featuredImage: { type: String, trim: true },
  images: [{ type: String, trim: true }],
  author: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  categories: [{ type: String, trim: true }],
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  published: { type: Boolean, default: false },
  publishedAt: { type: Date },
  metaDescription: { type: String, trim: true },
  metaKeywords: { type: String, trim: true }
}, {
  timestamps: true
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

const sampleBlogPosts = [
  {
    title: "The Power of Natural Oils for Daily Wellness",
    subtitle: "Discover how essential oils can transform your health routine",
    slug: "power-of-natural-oils-daily-wellness",
    content: `Natural oils have been used for centuries to promote health and wellness. From lavender's calming properties to tea tree's antimicrobial benefits, these concentrated plant extracts offer powerful therapeutic effects.

Essential oils work through multiple pathways in the body. When inhaled, their aromatic compounds interact with the limbic system, influencing emotions and stress responses. When applied topically (properly diluted), they can provide localized benefits for skin health and muscle tension.

Some of the most versatile oils for daily use include:

**Lavender Oil**: Known for its calming and sleep-promoting properties. Add a few drops to your pillow or diffuse in the evening for better rest.

**Peppermint Oil**: Excellent for mental clarity and digestive support. A drop on the temples (diluted) can help with headaches.

**Tea Tree Oil**: A powerful antimicrobial that's perfect for skin blemishes and minor cuts when properly diluted.

**Eucalyptus Oil**: Great for respiratory support and can help clear congestion when used in steam inhalation.

Remember to always dilute essential oils with a carrier oil like coconut or jojoba oil before topical application, and choose high-quality, pure oils for the best therapeutic benefits.`,
    excerpt: "Explore the therapeutic benefits of essential oils and learn how to incorporate them safely into your daily wellness routine for better health and vitality.",
    featuredImage: "/natural-oils-benefits-wellness.jpg",
    author: "Dr. Sarah Mitchell",
    tags: ["essential oils", "wellness", "natural health", "aromatherapy"],
    categories: ["Natural Remedies", "Wellness"],
    published: true,
    publishedAt: new Date('2024-11-15'),
    metaDescription: "Learn about the therapeutic benefits of natural essential oils and how to use them safely for daily wellness and health improvement.",
    metaKeywords: "essential oils, natural wellness, aromatherapy, lavender oil, tea tree oil, natural health"
  },
  {
    title: "Building Your Natural Skincare Routine",
    subtitle: "A step-by-step guide to healthy, glowing skin using natural ingredients",
    slug: "building-natural-skincare-routine",
    content: `Creating an effective natural skincare routine doesn't have to be complicated. By understanding your skin type and choosing the right natural ingredients, you can achieve healthy, radiant skin without harsh chemicals.

**Step 1: Gentle Cleansing**
Start with a gentle, natural cleanser that won't strip your skin's natural oils. Look for ingredients like:
- Honey: Natural antibacterial and moisturizing properties
- Oatmeal: Gentle exfoliation and soothing for sensitive skin
- Coconut oil: Effective makeup remover and moisturizer

**Step 2: Toning and Balancing**
Natural toners help restore your skin's pH balance:
- Rose water: Hydrating and anti-inflammatory
- Witch hazel: Astringent properties for oily skin
- Apple cider vinegar: Balances pH (always dilute!)

**Step 3: Targeted Treatments**
Address specific concerns with natural ingredients:
- Aloe vera: Soothes irritation and provides hydration
- Green tea: Antioxidant protection and anti-aging benefits
- Jojoba oil: Mimics skin's natural sebum, suitable for all skin types

**Step 4: Moisturizing**
Lock in hydration with natural moisturizers:
- Shea butter: Rich in vitamins and deeply moisturizing
- Argan oil: Lightweight and packed with vitamin E
- Hyaluronic acid: Holds up to 1000 times its weight in water

**Step 5: Sun Protection**
Never skip SPF! Look for mineral sunscreens with zinc oxide or titanium dioxide for natural protection.

Remember, consistency is key. Give your new routine at least 4-6 weeks to show results, and always patch test new ingredients.`,
    excerpt: "Learn how to create an effective natural skincare routine using gentle, plant-based ingredients that nourish and protect your skin without harsh chemicals.",
    featuredImage: "/skincare-routine-steps.jpg",
    author: "Emma Rodriguez",
    tags: ["skincare", "natural beauty", "skin health", "natural ingredients"],
    categories: ["Skincare", "Natural Beauty"],
    published: true,
    publishedAt: new Date('2024-11-12'),
    metaDescription: "Complete guide to building a natural skincare routine with plant-based ingredients for healthy, glowing skin.",
    metaKeywords: "natural skincare, organic beauty, skin care routine, natural ingredients, healthy skin"
  },
  {
    title: "Herbal Remedies for Common Digestive Issues",
    subtitle: "Time-tested herbs that support digestive health naturally",
    slug: "herbal-remedies-digestive-health",
    content: `Digestive discomfort is one of the most common health complaints, but nature provides many gentle, effective solutions. These time-tested herbal remedies can help support your digestive system naturally.

**Ginger: The Universal Digestive Aid**
Ginger is perhaps the most well-known digestive herb, and for good reason. It:
- Reduces nausea and motion sickness
- Stimulates digestive enzymes
- Reduces inflammation in the digestive tract
- Helps with bloating and gas

Try ginger tea after meals or add fresh ginger to your cooking.

**Peppermint: Cooling Digestive Relief**
Peppermint's menthol content provides:
- Antispasmodic effects that relax digestive muscles
- Relief from IBS symptoms
- Reduction in bloating and gas
- Fresh breath as a bonus!

Peppermint tea is most effective when consumed between meals.

**Chamomile: Gentle Digestive Soother**
This gentle herb offers:
- Anti-inflammatory properties
- Muscle relaxation in the digestive tract
- Stress reduction (which improves digestion)
- Better sleep quality

Chamomile tea before bed can improve both digestion and sleep.

**Fennel: Traditional Digestive Support**
Fennel seeds have been used for centuries to:
- Reduce bloating and gas
- Stimulate appetite
- Ease stomach cramps
- Support healthy digestion

Chew fennel seeds after meals or brew them into tea.

**Turmeric: Anti-Inflammatory Powerhouse**
This golden spice provides:
- Powerful anti-inflammatory effects
- Support for liver function
- Improved bile production
- Protection against digestive inflammation

Add turmeric to warm milk or cooking, always with black pepper to enhance absorption.

**Important Note**: While these herbs are generally safe, consult with a healthcare provider if you have chronic digestive issues or are taking medications.`,
    excerpt: "Discover powerful herbal remedies that have been used for centuries to support digestive health, reduce bloating, and promote overall gut wellness naturally.",
    featuredImage: "/herbal-digestive-remedies.jpg",
    author: "Dr. Michael Chen",
    tags: ["herbal medicine", "digestive health", "natural remedies", "gut health"],
    categories: ["Herbal Medicine", "Digestive Health"],
    published: true,
    publishedAt: new Date('2024-11-10'),
    metaDescription: "Learn about effective herbal remedies for digestive issues including ginger, peppermint, and chamomile for natural gut health support.",
    metaKeywords: "herbal remedies, digestive health, gut health, ginger, peppermint, chamomile, natural medicine"
  }
];

async function seedBlogPosts() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Clear existing blog posts
    await BlogPost.deleteMany({});
    console.log('Cleared existing blog posts');
    
    // Insert sample blog posts
    const posts = await BlogPost.insertMany(sampleBlogPosts);
    
    console.log(`Inserted ${posts.length} blog posts`);
    
    // List inserted posts
    console.log('\nInserted blog posts:');
    posts.forEach(post => {
      console.log(`- ${post.title} (${post.slug}) - ID: ${post._id}`);
    });
    
  } catch (error) {
    console.error('Error seeding blog posts:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedBlogPosts();