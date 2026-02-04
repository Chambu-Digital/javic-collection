const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Import models
const Review = require('../models/Review').default
const Product = require('../models/Product').default
const Order = require('../models/Order').default
const User = require('../models/User').default

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local')
  process.exit(1)
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    process.exit(1)
  }
}

const sampleReviews = [
  {
    rating: 5,
    title: "Amazing product!",
    comment: "This product exceeded my expectations. The quality is outstanding and it works exactly as described. Highly recommended!",
    status: 'approved'
  },
  {
    rating: 4,
    title: "Very good quality",
    comment: "Great product overall. The packaging was excellent and delivery was fast. Only minor issue is the scent could be stronger.",
    status: 'approved'
  },
  {
    rating: 5,
    title: "Love it!",
    comment: "Perfect for my skin type. I've been using it for a month now and can see visible improvements. Will definitely order again.",
    status: 'approved'
  },
  {
    rating: 3,
    title: "Decent product",
    comment: "It's okay, does what it says but nothing extraordinary. The price is fair for what you get.",
    status: 'pending'
  },
  {
    rating: 5,
    title: "Excellent natural ingredients",
    comment: "I love that this is made with natural ingredients. No harsh chemicals and it's gentle on my sensitive skin. Great value for money!",
    status: 'approved'
  }
]

async function seedReviews() {
  try {
    await connectDB()

    // Clear existing reviews
    await Review.deleteMany({})
    console.log('Cleared existing reviews')

    // Get some products, orders, and users
    const products = await Product.find({ isActive: true }).limit(3)
    const orders = await Order.find({ status: 'delivered' }).populate('userId').limit(2)
    const users = await User.find({ role: 'customer' }).limit(3)

    if (products.length === 0 || orders.length === 0 || users.length === 0) {
      console.log('Need products, delivered orders, and users to seed reviews')
      console.log(`Found: ${products.length} products, ${orders.length} orders, ${users.length} users`)
      return
    }

    const reviews = []

    // Create reviews for each product
    for (let i = 0; i < Math.min(products.length, sampleReviews.length); i++) {
      const product = products[i]
      const order = orders[i % orders.length]
      const user = users[i % users.length]
      const reviewData = sampleReviews[i]

      // Find or create an order item for this product
      let orderItem = order.items.find(item => item.productId.toString() === product._id.toString())
      
      if (!orderItem) {
        // Add the product to the order if it's not there
        orderItem = {
          _id: new mongoose.Types.ObjectId(),
          productId: product._id,
          productName: product.name,
          productImage: product.images[0] || '/placeholder.jpg',
          quantity: 1,
          price: product.price || 1000,
          totalPrice: product.price || 1000
        }
        order.items.push(orderItem)
        await order.save()
      }

      const review = new Review({
        productId: product._id,
        userId: user._id,
        orderId: order._id,
        orderItemId: orderItem._id,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        isVerifiedPurchase: true,
        status: reviewData.status,
        helpfulVotes: Math.floor(Math.random() * 10),
        totalVotes: Math.floor(Math.random() * 15) + 5
      })

      reviews.push(review)
    }

    // Add a few more reviews for the first product
    if (products.length > 0 && users.length > 1) {
      const product = products[0]
      const order = orders[0]
      
      for (let i = 0; i < 2; i++) {
        const user = users[(i + 1) % users.length]
        const reviewData = sampleReviews[(i + 3) % sampleReviews.length]

        let orderItem = order.items[0]

        const review = new Review({
          productId: product._id,
          userId: user._id,
          orderId: order._id,
          orderItemId: orderItem._id,
          rating: reviewData.rating,
          title: reviewData.title,
          comment: reviewData.comment,
          customerName: `${user.firstName} ${user.lastName}`,
          customerEmail: user.email,
          isVerifiedPurchase: true,
          status: reviewData.status,
          helpfulVotes: Math.floor(Math.random() * 8),
          totalVotes: Math.floor(Math.random() * 12) + 3
        })

        reviews.push(review)
      }
    }

    // Save all reviews
    await Review.insertMany(reviews)
    console.log(`Created ${reviews.length} sample reviews`)

    // Update product ratings
    for (const product of products) {
      const productReviews = await Review.find({ 
        productId: product._id, 
        status: 'approved' 
      })

      if (productReviews.length > 0) {
        const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0)
        const averageRating = totalRating / productReviews.length

        await Product.findByIdAndUpdate(product._id, {
          rating: Math.round(averageRating * 10) / 10,
          reviews: productReviews.length
        })

        console.log(`Updated ${product.name}: ${averageRating.toFixed(1)} stars (${productReviews.length} reviews)`)
      }
    }

    console.log('Reviews seeded successfully!')
    
  } catch (error) {
    console.error('Error seeding reviews:', error)
  } finally {
    await mongoose.connection.close()
  }
}

seedReviews()