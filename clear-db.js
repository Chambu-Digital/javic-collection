const fs = require('fs');
const { MongoClient } = require('mongodb');

const envContent = fs.readFileSync('.env.local', 'utf8');
const mongoUri = envContent.match(/MONGODB_URI=(.*)/)?.[1];

const COLLECTIONS_TO_CLEAR = [
  'products',
  'categories',
  'orders',
  'campaigns',
  'reviews',
  'mpesatransactions',
  'blogposts',
  'banners',
  'adminrequests',
  'campaignanalytics',
  'productviews',
];

async function clearDatabase() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db();

    // Show before counts
    const allCollections = await db.listCollections().toArray();
    console.log('Collections before clearing:');
    for (const col of allCollections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  ${col.name}: ${count} documents`);
    }
    console.log('');

    // Clear each collection
    console.log('Clearing collections...');
    for (const name of COLLECTIONS_TO_CLEAR) {
      const col = db.collection(name);
      const result = await col.deleteMany({});
      console.log(`  ✓ ${name}: deleted ${result.deletedCount} documents`);
    }

    // Delete customer accounts only — preserve admin & super_admin
    const usersResult = await db.collection('users').deleteMany({ role: 'customer' });
    console.log(`  ✓ users (customers only): deleted ${usersResult.deletedCount} documents`);

    console.log('\n✅ Database cleared successfully. Admin accounts preserved.');

    // Show after counts
    console.log('\nCollections after clearing:');
    for (const col of allCollections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  ${col.name}: ${count} documents`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

clearDatabase();
