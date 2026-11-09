const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function query() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('\n=== BRANCHES ===');
  const branches = await mongoose.connection.db.collection('branches').find({}).toArray();
  branches.forEach(b => {
    console.log(`Branch: ${b.name} (Code: ${b.branchCode})`);
    console.log(`  Active: ${b.isActive}`);
    console.log(`  Main: ${b.isMainBranch}`);
    console.log(`  ID: ${b._id}`);
  });
  
  console.log('\n=== BRANCH-VENDOR ASSIGNMENTS ===');
  const branchVendors = await mongoose.connection.db.collection('branchvendors').find({}).toArray();
  console.log(`Total assignments: ${branchVendors.length}`);
  for (const bv of branchVendors) {
    const branch = await mongoose.connection.db.collection('branches').findOne({ _id: bv.branchId });
    const vendor = await mongoose.connection.db.collection('vendors').findOne({ _id: bv.vendorId });
    console.log(`  ${branch?.name || 'Unknown Branch'} <-> ${vendor?.name || 'Unknown Vendor'} (Active: ${bv.isActive})`);
  }
  
  console.log('\n=== STOCK BY BRANCH ===');
  const stockByBranch = await mongoose.connection.db.collection('branchstocks').aggregate([
    { $group: { _id: '$branchId', totalQty: { $sum: '$quantity' }, count: { $sum: 1 } } },
    { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branch' } }
  ]).toArray();
  stockByBranch.forEach(s => {
    console.log(`${s.branch[0]?.name || 'Unknown'}: ${s.count} stock records, ${s.totalQty} total units`);
  });
  
  await mongoose.disconnect();
}

query().catch(console.error);
