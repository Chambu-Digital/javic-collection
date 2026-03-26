const fs = require('fs');
const { MongoClient } = require('mongodb');

const envContent = fs.readFileSync('.env.local', 'utf8');
const mongoUri = envContent.match(/MONGODB_URI=(.*)/)?.[1];

async function viewOrders() {
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

    const total = await db.collection('orders').countDocuments();
    console.log(`Total orders in DB: ${total}\n`);

    if (total === 0) {
      console.log('No orders found.');
      return;
    }

    const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(10).toArray();

    orders.forEach((order, i) => {
      console.log(`--- Order ${i + 1} ---`);
      console.log(`  _id:          ${order._id}`);
      console.log(`  orderNumber:  ${order.orderNumber}`);
      console.log(`  status:       ${order.status}`);
      console.log(`  userId:       ${order.userId || 'none (guest)'}`);
      console.log(`  whatsapp:     ${order.whatsapp_phone || order.customerPhone || 'none'}`);
      console.log(`  email:        ${order.customerEmail}`);
      console.log(`  total:        KSH ${order.totalAmount}`);
      console.log(`  items:        ${order.items?.length || 0}`);
      console.log(`  location:     ${order.shippingAddress?.area}, ${order.shippingAddress?.county}`);
      console.log(`  createdAt:    ${order.createdAt}`);
      console.log('');
    });

    // Status breakdown
    const statusBreakdown = await db.collection('orders').aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();

    console.log('Status breakdown:');
    statusBreakdown.forEach(s => console.log(`  ${s._id}: ${s.count}`));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

viewOrders();
