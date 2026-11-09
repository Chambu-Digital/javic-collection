const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function query() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('\n=== VENDORS ===');
  const vendors = await mongoose.connection.db.collection('vendors').find({}).toArray();
  vendors.forEach(v => {
    console.log(`${v.name} (Code: ${v.vendorCode}, isHouseStock: ${v.isHouseStock})`);
  });
  
  console.log('\n=== BRANCH STOCKS (sample 10) ===');
  const stocks = await mongoose.connection.db.collection('branchstocks').find({}).limit(10).toArray();
  for (const s of stocks) {
    const vendor = await mongoose.connection.db.collection('vendors').findOne({ _id: s.vendorId });
    console.log(`Stock: ${s.stockIdentifier} | Qty: ${s.quantity} | Vendor: ${vendor?.name || 'Unknown'}`);
  }
  
  console.log('\n=== STOCK BY VENDOR ===');
  const byVendor = await mongoose.connection.db.collection('branchstocks').aggregate([
    { $group: { _id: '$vendorId', totalQty: { $sum: '$quantity' }, count: { $sum: 1 } } },
    { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } }
  ]).toArray();
  byVendor.forEach(v => {
    console.log(`${v.vendor[0]?.name || 'Unknown'}: ${v.count} stock records, ${v.totalQty} total units`);
  });
  
  await mongoose.disconnect();
}

query().catch(console.error);
