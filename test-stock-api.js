const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const branchId = '6a815b220b3ddb83cf6759ca'; // Main Branch ID
  
  console.log('=== TESTING STOCK QUERY ===\n');
  
  // Test 1: Raw count
  const totalStock = await mongoose.connection.db.collection('branchstocks').countDocuments({ 
    branchId: new mongoose.Types.ObjectId(branchId) 
  });
  console.log(`Total stock records for branch: ${totalStock}`);
  
  // Test 2: Sample records
  const samples = await mongoose.connection.db.collection('branchstocks')
    .find({ branchId: new mongoose.Types.ObjectId(branchId) })
    .limit(3)
    .toArray();
  
  console.log('\nSample records:');
  for (const s of samples) {
    const product = await mongoose.connection.db.collection('products').findOne({ _id: s.productId });
    const vendor = await mongoose.connection.db.collection('vendors').findOne({ _id: s.vendorId });
    console.log(`  ${s.stockIdentifier}: ${s.quantity} units`);
    console.log(`    Product: ${product?.name || 'NOT FOUND'}`);
    console.log(`    Vendor: ${vendor?.name || 'NOT FOUND'}`);
  }
  
  // Test 3: Check for null/undefined refs
  const nullProducts = await mongoose.connection.db.collection('branchstocks')
    .countDocuments({ 
      branchId: new mongoose.Types.ObjectId(branchId),
      productId: null
    });
  console.log(`\nStock records with null productId: ${nullProducts}`);
  
  const nullVendors = await mongoose.connection.db.collection('branchstocks')
    .countDocuments({ 
      branchId: new mongoose.Types.ObjectId(branchId),
      vendorId: null
    });
  console.log(`Stock records with null vendorId: ${nullVendors}`);
  
  await mongoose.disconnect();
}

test().catch(console.error);
