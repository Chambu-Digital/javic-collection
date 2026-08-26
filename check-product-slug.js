const fs = require('fs');
const { MongoClient } = require('mongodb');

const envContent = fs.readFileSync('.env.local', 'utf8');
const mongoUri = envContent.match(/MONGODB_URI=(.*)/)?.[1];

async function checkProduct() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db();

    // Check for the specific product mentioned in the issue
    const slug = 'ribbed-cami-heart-print-3-piece-pajama-set';
    
    console.log(`Searching for product with slug: "${slug}"\n`);
    
    const product = await db.collection('products').findOne({ slug });
    
    if (product) {
      console.log('✓ Product FOUND in database:');
      console.log(`  _id:            ${product._id}`);
      console.log(`  name:           ${product.name}`);
      console.log(`  slug:           ${product.slug}`);
      console.log(`  price:          ${product.price}`);
      console.log(`  category:       ${product.category}`);
      console.log(`  inStock:        ${product.inStock}`);
      console.log(`  stockQuantity:  ${product.stockQuantity}`);
      console.log(`  isActive:       ${product.isActive}`);
      console.log(`  images:         ${product.images?.length || 0} images`);
      console.log('');
    } else {
      console.log('✗ Product NOT FOUND in database');
      console.log('');
      
      // Try lowercase
      const lowerProduct = await db.collection('products').findOne({ slug: slug.toLowerCase() });
      if (lowerProduct) {
        console.log('✓ Found with lowercase slug:');
        console.log(`  slug: ${lowerProduct.slug}`);
      }
      
      // Try searching by name
      const byName = await db.collection('products').findOne({ 
        name: { $regex: 'pajama', $options: 'i' }
      });
      if (byName) {
        console.log('✓ Found similar product by name:');
        console.log(`  _id:  ${byName._id}`);
        console.log(`  name: ${byName.name}`);
        console.log(`  slug: ${byName.slug}`);
      }
    }
    
    // Check if ANY products exist without slugs
    console.log('\n--- Checking for products without slugs ---');
    const noSlug = await db.collection('products').find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    }).limit(5).toArray();
    
    if (noSlug.length > 0) {
      console.log(`⚠ Found ${noSlug.length} products without slugs:`);
      noSlug.forEach(p => console.log(`  - ${p.name} (id: ${p._id})`));
    } else {
      console.log('✓ All products have slugs');
    }
    
    // Check for duplicate slugs
    console.log('\n--- Checking for duplicate slugs ---');
    const duplicates = await db.collection('products').aggregate([
      { $group: { _id: '$slug', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (duplicates.length > 0) {
      console.log(`⚠ Found ${duplicates.length} duplicate slugs:`);
      duplicates.forEach(d => console.log(`  - "${d._id}" appears ${d.count} times`));
    } else {
      console.log('✓ No duplicate slugs found');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

checkProduct();
