const fs = require('fs');
const { MongoClient } = require('mongodb');

const envContent = fs.readFileSync('.env.local', 'utf8');
const mongoUri = envContent.match(/MONGODB_URI=(.*)/)?.[1];

async function viewProducts() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db();

    // List all collections first
    const collections = await db.listCollections().toArray();
    console.log('Collections in DB:');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  ${col.name}: ${count} documents`);
    }
    console.log('');

    const total = await db.collection('products').countDocuments();
    console.log(`Total products in DB: ${total}\n`);

    if (total === 0) {
      console.log('No products found.');
      return;
    }

    // Search for products with price around 2000 or 20000
    const products = await db.collection('products').find({
      $or: [
        { price: { $gte: 1900, $lte: 2100 } },
        { price: { $gte: 19000, $lte: 21000 } }
      ]
    }).toArray();

    console.log(`Products with price around 2000 or 20000: ${products.length}\n`);

    products.forEach((product, i) => {
      console.log(`--- Product ${i + 1} ---`);
      console.log(`  _id:            ${product._id}`);
      console.log(`  name:           ${product.name}`);
      console.log(`  price:          ${product.price}`);
      console.log(`  wholesalePrice: ${product.wholesalePrice || 'none'}`);
      console.log(`  category:       ${product.category}`);
      console.log(`  inStock:        ${product.inStock}`);
      console.log(`  stockQuantity:  ${product.stockQuantity}`);
      console.log('');
    });

    // Also get all products to check names
    console.log('\n=== ALL PRODUCTS (first 20) ===');
    const allProducts = await db.collection('products').find({}).limit(20).toArray();
    allProducts.forEach((product, i) => {
      console.log(`${i + 1}. ${product.name} - KSH ${product.price}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

viewProducts();
