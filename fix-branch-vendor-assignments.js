const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('=== FIXING BRANCH-VENDOR ASSIGNMENTS ===\n');
  
  // Get all unique branch-vendor combinations from stock
  const combinations = await mongoose.connection.db.collection('branchstocks').aggregate([
    {
      $group: {
        _id: { branchId: '$branchId', vendorId: '$vendorId' },
        stockCount: { $sum: 1 }
      }
    }
  ]).toArray();
  
  console.log(`Found ${combinations.length} unique branch-vendor combinations in stock`);
  
  // Create BranchVendor assignments
  for (const combo of combinations) {
    const { branchId, vendorId } = combo._id;
    
    const branch = await mongoose.connection.db.collection('branches').findOne({ _id: branchId });
    const vendor = await mongoose.connection.db.collection('vendors').findOne({ _id: vendorId });
    
    if (!branch || !vendor) {
      console.log(`⚠️  Skipping: Branch or Vendor not found`);
      continue;
    }
    
    // Check if assignment already exists
    const exists = await mongoose.connection.db.collection('branchvendors').findOne({
      branchId: branchId,
      vendorId: vendorId
    });
    
    if (exists) {
      console.log(`✓ Already exists: ${branch.name} <-> ${vendor.name}`);
      continue;
    }
    
    // Create assignment
    await mongoose.connection.db.collection('branchvendors').insertOne({
      branchId: branchId,
      vendorId: vendorId,
      isActive: true,
      assignedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ Created: ${branch.name} <-> ${vendor.name} (${combo.stockCount} stock items)`);
  }
  
  console.log('\n=== VERIFICATION ===');
  const total = await mongoose.connection.db.collection('branchvendors').countDocuments();
  console.log(`Total branch-vendor assignments: ${total}`);
  
  const assignments = await mongoose.connection.db.collection('branchvendors').find({}).toArray();
  for (const a of assignments) {
    const branch = await mongoose.connection.db.collection('branches').findOne({ _id: a.branchId });
    const vendor = await mongoose.connection.db.collection('vendors').findOne({ _id: a.vendorId });
    console.log(`  ${branch?.name} <-> ${vendor?.name} (Active: ${a.isActive})`);
  }
  
  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

fix().catch(console.error);
