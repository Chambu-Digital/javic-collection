const { MongoClient } = require('mongodb');
const fs = require('fs');

// Read MongoDB URI from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const mongoUri = envContent.match(/MONGODB_URI=(.*)/)?.[1];

async function fixPriceIssue() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db();
    
    // Look for all products to understand the issue better
    const allProducts = await db.collection('products').find({}).toArray();
    
    console.log(`Total products: ${allProducts.length}\n`);
    
    // Find products with "vneck" or "v-neck" in the name
    const vneckProducts = allProducts.filter(p => 
      p.name && (p.name.toLowerCase().includes('vneck') || p.name.toLowerCase().includes('v-neck'))
    );
    
    console.log(`Found ${vneckProducts.length} products with vneck in name:\n`);
    
    for (const product of vneckProducts) {
      console.log(`Product: ${product.name}`);
      console.log(`  Price: ${product.price} (type: ${typeof product.price})`);
      console.log(`  Old Price: ${product.oldPrice || 'none'}`);
      console.log(`  Wholesale Price: ${product.wholesalePrice || 'none'}`);
      console.log(`  ID: ${product._id}`);
      console.log('');
    }

    console.log('\n📝 To actually fix the prices, uncomment the update lines in the script.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

fixPriceIssue();