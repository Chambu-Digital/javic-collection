const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('=== SYSTEM VERIFICATION ===\n');
  
  // 1. Branches
  const branches = await mongoose.connection.db.collection('branches').countDocuments({ isActive: true });
  console.log(`✓ Active branches: ${branches}`);
  
  // 2. Vendors
  const vendors = await mongoose.connection.db.collection('vendors').countDocuments({ isActive: true });
  console.log(`✓ Active vendors: ${vendors}`);
  
  // 3. Branch-Vendor assignments
  const assignments = await mongoose.connection.db.collection('branchvendors').countDocuments({ isActive: true });
  console.log(`✓ Branch-Vendor assignments: ${assignments}`);
  
  // 4. Stock records
  const stockTotal = await mongoose.connection.db.collection('branchstocks').countDocuments();
  const stockWithVendor = await mongoose.connection.db.collection('branchstocks').countDocuments({ vendorId: { $exists: true } });
  console.log(`✓ Stock records: ${stockTotal} (all have vendorId: ${stockTotal === stockWithVendor})`);
  
  // 5. Orphaned stock check
  const orphanedStock = await mongoose.connection.db.collection('branchstocks').aggregate([
    {
      $lookup: {
        from: 'vendors',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendor'
      }
    },
    { $match: { vendor: { $size: 0 } } },
    { $count: 'orphaned' }
  ]).toArray();
  console.log(`✓ Orphaned stock (missing vendor): ${orphanedStock[0]?.orphaned || 0}`);
  
  // 6. Products
  const products = await mongoose.connection.db.collection('products').countDocuments();
  console.log(`✓ Products: ${products}`);
  
  // 7. Sample product with stock
  const sampleStock = await mongoose.connection.db.collection('branchstocks').findOne({});
  if (sampleStock) {
    const product = await mongoose.connection.db.collection('products').findOne({ _id: sampleStock.productId });
    const branch = await mongoose.connection.db.collection('branches').findOne({ _id: sampleStock.branchId });
    const vendor = await mongoose.connection.db.collection('vendors').findOne({ _id: sampleStock.vendorId });
    console.log(`\n✓ Sample stock record validated:`);
    console.log(`  Product: ${product?.name || 'Unknown'}`);
    console.log(`  Branch: ${branch?.name || 'Unknown'}`);
    console.log(`  Vendor: ${vendor?.name || 'Unknown'}`);
    console.log(`  Quantity: ${sampleStock.quantity}`);
  }
  
  // 8. Check for House Stock usage
  const houseStock = await mongoose.connection.db.collection('vendors').findOne({ isHouseStock: true });
  if (houseStock) {
    const houseStockUsage = await mongoose.connection.db.collection('branchstocks').countDocuments({ vendorId: houseStock._id });
    console.log(`\n✓ House Stock vendor: ${houseStock.name} (used in ${houseStockUsage} records)`);
  }
  
  console.log('\n=== SUMMARY ===');
  const allGood = 
    branches > 0 &&
    vendors >= 2 &&
    assignments >= 2 &&
    stockTotal > 0 &&
    stockTotal === stockWithVendor &&
    (orphanedStock[0]?.orphaned || 0) === 0;
  
  if (allGood) {
    console.log('✅ System is GOOD - all checks passed!');
  } else {
    console.log('⚠️  System has issues - review checks above');
  }
  
  await mongoose.disconnect();
}

verify().catch(console.error);
