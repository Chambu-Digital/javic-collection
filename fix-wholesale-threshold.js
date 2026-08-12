const fs = require('fs');
const { MongoClient } = require('mongodb');

const envContent = fs.readFileSync('.env.local', 'utf8');
const mongoUri = envContent.match(/MONGODB_URI=(.*)/)?.[1];

async function fixWholesaleThreshold() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db();

    // Find products with wholesale pricing enabled but invalid threshold
    console.log('Finding products with invalid wholesale threshold...');
    const problematicProducts = await db.collection('products').find({
      $and: [
        { wholesalePrice: { $gt: 0 } }, // Has wholesale pricing
        { 
          $or: [
            { wholesaleThreshold: { $lt: 1 } }, // Less than 1
            { wholesaleThreshold: { $exists: false } }, // Doesn't exist
            { wholesaleThreshold: null } // Is null
          ]
        }
      ]
    }).toArray();

    console.log(`Found ${problematicProducts.length} products with invalid wholesale threshold:\n`);

    if (problematicProducts.length === 0) {
      console.log('No products need fixing!');
      return;
    }

    // Display the problems
    problematicProducts.forEach((product, i) => {
      console.log(`${i + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku || 'No SKU'}`);
      console.log(`   Wholesale Price: KSH ${product.wholesalePrice}`);
      console.log(`   Wholesale Threshold: ${product.wholesaleThreshold} (INVALID)`);
      console.log(`   Product ID: ${product._id}`);
      console.log('');
    });

    // Ask to proceed with fix
    console.log('Fixing these products by setting wholesaleThreshold to 1...\n');

    // Fix the products
    const result = await db.collection('products').updateMany(
      {
        $and: [
          { wholesalePrice: { $gt: 0 } }, // Has wholesale pricing
          { 
            $or: [
              { wholesaleThreshold: { $lt: 1 } }, // Less than 1
              { wholesaleThreshold: { $exists: false } }, // Doesn't exist
              { wholesaleThreshold: null } // Is null
            ]
          }
        ]
      },
      {
        $set: { wholesaleThreshold: 1 }
      }
    );

    console.log(`✓ Fixed ${result.modifiedCount} products`);
    console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}\n`);

    // Verify the fix
    console.log('Verifying fix...');
    const stillProblematic = await db.collection('products').find({
      $and: [
        { wholesalePrice: { $gt: 0 } },
        { 
          $or: [
            { wholesaleThreshold: { $lt: 1 } },
            { wholesaleThreshold: { $exists: false } },
            { wholesaleThreshold: null }
          ]
        }
      ]
    }).toArray();

    if (stillProblematic.length === 0) {
      console.log('✓ All products now have valid wholesale thresholds!');
    } else {
      console.log(`⚠️ ${stillProblematic.length} products still have issues`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

fixWholesaleThreshold();