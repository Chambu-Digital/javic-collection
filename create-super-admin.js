const fs = require('fs');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const mongoUri = envContent.match(/MONGODB_URI=(.*)/)?.[1];

async function createSuperAdmin() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db();
    const users = db.collection('users');

    const email = 'admin@javic.co.ke';
    const password = 'admin123';

    // Check if already exists
    const existing = await users.findOne({ email });
    if (existing) {
      // Update to super_admin if exists
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      await users.updateOne(
        { email },
        {
          $set: {
            role: 'super_admin',
            password: hashedPassword,
            isActive: true,
            isApproved: true,
            isEmailVerified: true,
          }
        }
      );
      console.log(`✓ Existing user updated to super_admin: ${email}`);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await users.insertOne({
      firstName: 'Super',
      lastName: 'Admin',
      email,
      password: hashedPassword,
      phone: '',
      role: 'super_admin',
      permissions: [],
      isEmailVerified: true,
      isApproved: true,
      isActive: true,
      provider: 'local',
      addresses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Super admin created successfully!`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role:     super_admin`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

createSuperAdmin();
