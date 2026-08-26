const fs = require('fs');
const mongoose = require('mongoose');

const envContent = fs.readFileSync('.env.local', 'utf8');
const mongoUri = envContent.match(/MONGODB_URI=(.*)/)?.[1];

// Import the Product model
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: Array,
  category: String,
  inStock: Boolean,
  stockQuantity: Number,
  isActive: Boolean,
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function testFetch() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB via Mongoose\n');

    const slug = 'ribbed-cami-heart-print-3-piece-pajama-set';
    
    console.log(`Testing Mongoose findOne with slug: "${slug}"`);
    console.log(`Testing with lowercase: "${slug.toLowerCase()}"\n`);
    
    // Test 1: Exact match
    console.log('--- Test 1: Exact slug match ---');
    const product1 = await Product.findOne({ slug });
    console.log(`Result: ${product1 ? '✓ FOUND' : '✗ NOT FOUND'}`);
    if (product1) {
      console.log(`  _id:  ${product1._id}`);
      console.log(`  name: ${product1.name}`);
      console.log(`  slug: ${product1.slug}`);
    }
    console.log('');
    
    // Test 2: Lowercase
    console.log('--- Test 2: Lowercase slug match ---');
    const product2 = await Product.findOne({ slug: slug.toLowerCase() });
    console.log(`Result: ${product2 ? '✓ FOUND' : '✗ NOT FOUND'}`);
    if (product2) {
      console.log(`  _id:  ${product2._id}`);
      console.log(`  name: ${product2.name}`);
      console.log(`  slug: ${product2.slug}`);
    }
    console.log('');
    
    // Test 3: Simulate server-side page.tsx logic
    console.log('--- Test 3: Simulating page.tsx server component ---');
    const params = { slug: 'ribbed-cami-heart-print-3-piece-pajama-set' };
    const productDoc = await Product.findOne({ slug: params.slug.toLowerCase() })
      .lean();
    
    console.log(`Result: ${productDoc ? '✓ FOUND' : '✗ NOT FOUND'}`);
    if (productDoc) {
      console.log(`  _id:  ${productDoc._id}`);
      console.log(`  name: ${productDoc.name}`);
      console.log(`  slug: ${productDoc.slug}`);
      
      // Test JSON serialization (as done in page.tsx)
      const product = JSON.parse(JSON.stringify(productDoc));
      console.log(`  Serialization: ${product ? '✓ SUCCESS' : '✗ FAILED'}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testFetch();
