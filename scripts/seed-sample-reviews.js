const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Define Review schema directly since we can't import ES modules
const ReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderItemId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  comment: { type: String, required: true, trim: true, maxlength: 1000 },
  images: [{ type: String }],
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, lowercase: true },
  isVerifiedPurchase: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: Date,
  moderationNotes: { type: String, maxlength: 500 },
  helpfulVotes: { type: Number, default: 0, min: 0 },
  totalVotes: { type: Number, default: 0, min: 0 }
}, { timestamps: true })

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

// Create models
const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema)
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

const sampleReviews = [
  {
    rating: 5,
    title: "Excellent quality and fast delivery!",
    comment: "I'm very impressed with this product. The quality is outstanding and it arrived much faster than expected. Highly recommend JAVIC COLLECTION for inner wear shopping!",
    customerName: "Sarah M."
  },
  {
    rating: 4,
    title: "Great value for money",
    comment: "Good product overall. Works as expected and the price is very competitive. Customer service was helpful when I had questions.",
    customerName: "John K."
  },
  {
    rating: 5,
    title: "Perfect for my needs",
    comment: "Exactly what I was looking for. The product description was accurate and it performs excellently. Will definitely shop here again.",
    customerName: "Mary W."
  },
  {
    rating: 4,
    title: "Solid purchase",
    comment: "Good build quality and reliable performance. Shipping was quick and packaging was secure. Minor issue with setup but customer support helped resolve it.",
    customerName: "David L."
  },
  {
    rating: 5,
    title: "Outstanding service!",
    comment: "Not only is the product great, but the customer service is exceptional. They answered all my questions promptly and the delivery was super fast.",
    customerName: "Grace N."
  },
  {
    rating: 3,
    title: "Decent product",
    comment: "It's okay for the price. Does what it's supposed to do but nothing extraordinary. Delivery was on time and packaging was good.",
    customerName: "Peter R."
  },
  {
    rating: 5,
    title: "Highly recommended!",
    comment: "Amazing product quality and excellent customer service. JAVIC COLLECTION has become my go-to store for inner wear and sleepwear. Fast shipping and great prices!",
    customerName: "Linda T."
  },
  {
    rating: 4,
    title: "Good experience overall",
    comment: "Product works well and arrived in perfect condition. The website is easy to navigate and checkout was smooth. Will consider buying again.",
    customerName: "Michael B."
  }
]

async function seedSampleReviews() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Get all active products
    const products = await Product.find({ isActive: true }).limit(20)
    console.log(`Found ${products.length} active products`)

    if (products.length === 0) {
      console.log('No active products found. Please seed products first.')
      return
    }

    let totalReviewsCreated = 0

    for (const product of products) {
      // Create 2-4 random reviews per product
      const numReviews = Math.floor(Math.random() * 3) + 2 // 2-4 reviews
      
      for (let i = 0; i < numReviews; i++) {
        const randomReview = sampleReviews[Math.floor(Math.random() * sampleReviews.length)]
        
        // Create demo IDs
        const demoUserId = new mongoose.Types.ObjectId()
        const demoOrderId = new mongoose.Types.ObjectId()
        const demoOrderItemId = new mongoose.Types.ObjectId().toString()

        // Check if similar review already exists
        const existingReview = await Review.findOne({
          productId: product._id,
          title: randomReview.title,
          customerName: randomReview.customerName
        })

        if (!existingReview) {
          const review = new Review({
            productId: product._id,
            userId: demoUserId,
            orderId: demoOrderId,
            orderItemId: demoOrderItemId,
            rating: randomReview.rating,
            title: randomReview.title,
            comment: randomReview.comment,
            images: [],
            customerName: randomReview.customerName,
            customerEmail: 'demo@electromatt.co.ke',
            isVerifiedPurchase: Math.random() > 0.3, // 70% verified purchases
            status: 'approved',
            helpfulVotes: Math.floor(Math.random() * 10),
            totalVotes: Math.floor(Math.random() * 15) + 5,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
          })

          await review.save()
          totalReviewsCreated++
        }
      }

      // Update product rating and review count
      await updateProductRating(product._id)
      console.log(`Updated ratings for ${product.name}`)
    }

    console.log(`✅ Successfully created ${totalReviewsCreated} sample reviews`)
    console.log('✅ Updated product ratings and review counts')
    
  } catch (error) {
    console.error('❌ Error seeding sample reviews:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          productId: productId,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ])

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal place
        reviews: stats[0].totalReviews
      })
    }
  } catch (error) {
    console.error('Error updating product rating:', error)
  }
}

// Run the seeding
seedSampleReviews()