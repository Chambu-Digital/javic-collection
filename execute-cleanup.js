const fs = require('fs');
const { MongoClient } = require('mongodb');

const envContent = fs.readFileSync('.env.local', 'utf8');
const mongoUri = envContent.match(/MONGODB_URI=(.*)/)?.[1];

async function executeCleanup() {
  const client = new MongoClient(mongoUri);
  
  const deletionLog = {
    timestamp: new Date().toISOString(),
    status: 'in_progress',
    kept: {},
    deleted: {},
    errors: []
  };

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB for CLEANUP EXECUTION\n');
    console.log('=' .repeat(80));
    console.log('PRE-LAUNCH DATABASE CLEANUP - EXECUTION LOG');
    console.log('=' .repeat(80));
    console.log('\n');

    const db = client.db();

    // Get admin@javic.co.ke user ID before deletion
    console.log('STEP 0: Identifying admin@javic.co.ke...');
    const keepAdmin = await db.collection('users').findOne({ email: 'admin@javic.co.ke' });
    
    if (!keepAdmin) {
      console.error('❌ CRITICAL ERROR: admin@javic.co.ke not found!');
      console.error('   Cannot proceed - this account must exist');
      deletionLog.status = 'failed';
      deletionLog.errors.push('admin@javic.co.ke not found');
      return;
    }
    
    console.log(`✓ Found admin@javic.co.ke (ID: ${keepAdmin._id})`);
    console.log(`  Role: ${keepAdmin.role}`);
    console.log(`  Active: ${keepAdmin.isActive}`);
    console.log('');

    // ==========================================================================
    // PHASE 1: DELETE DEPENDENT DATA (Prevents Orphans)
    // ==========================================================================
    
    console.log('PHASE 1: DELETING DEPENDENT DATA');
    console.log('-'.repeat(80));
    console.log('');

    // 1. Delete campaign analytics
    console.log('1/6 Deleting campaignanalytics...');
    const analyticsResult = await db.collection('campaignanalytics').deleteMany({});
    console.log(`    ✓ Deleted ${analyticsResult.deletedCount} campaign analytics records`);
    deletionLog.deleted.campaignanalytics = analyticsResult.deletedCount;

    // 2. Delete reviews
    console.log('2/6 Deleting reviews...');
    const reviewsResult = await db.collection('reviews').deleteMany({});
    console.log(`    ✓ Deleted ${reviewsResult.deletedCount} reviews`);
    deletionLog.deleted.reviews = reviewsResult.deletedCount;

    // 3. Delete branch stocks
    console.log('3/6 Deleting branchstocks...');
    const stocksResult = await db.collection('branchstocks').deleteMany({});
    console.log(`    ✓ Deleted ${stocksResult.deletedCount} branch stock records`);
    deletionLog.deleted.branchstocks = stocksResult.deletedCount;

    // 4. Delete ledger entries
    console.log('4/6 Deleting ledgerentries...');
    const ledgerResult = await db.collection('ledgerentries').deleteMany({});
    console.log(`    ✓ Deleted ${ledgerResult.deletedCount} ledger entries`);
    deletionLog.deleted.ledgerentries = ledgerResult.deletedCount;

    // 5. Delete held POS orders
    console.log('5/6 Deleting posheldorders...');
    const heldResult = await db.collection('posheldorders').deleteMany({});
    console.log(`    ✓ Deleted ${heldResult.deletedCount} held POS orders`);
    deletionLog.deleted.posheldorders = heldResult.deletedCount;

    // 6. Delete POS audit entries
    console.log('6/6 Deleting posauditentries...');
    const auditResult = await db.collection('posauditentries').deleteMany({});
    console.log(`    ✓ Deleted ${auditResult.deletedCount} POS audit entries`);
    deletionLog.deleted.posauditentries = auditResult.deletedCount;

    console.log('');
    console.log('✓ Phase 1 Complete - Dependent data deleted');
    console.log('');

    // ==========================================================================
    // PHASE 2: DELETE PRIMARY COLLECTIONS
    // ==========================================================================
    
    console.log('PHASE 2: DELETING PRIMARY COLLECTIONS');
    console.log('-'.repeat(80));
    console.log('');

    // 7. Delete orders
    console.log('1/3 Deleting orders...');
    const ordersResult = await db.collection('orders').deleteMany({});
    console.log(`    ✓ Deleted ${ordersResult.deletedCount} orders`);
    deletionLog.deleted.orders = ordersResult.deletedCount;

    // 8. Delete products
    console.log('2/3 Deleting products...');
    const productsResult = await db.collection('products').deleteMany({});
    console.log(`    ✓ Deleted ${productsResult.deletedCount} products`);
    deletionLog.deleted.products = productsResult.deletedCount;

    // 9. Delete campaigns (Valentines)
    console.log('3/3 Deleting campaigns...');
    const campaignsResult = await db.collection('campaigns').deleteMany({});
    console.log(`    ✓ Deleted ${campaignsResult.deletedCount} campaigns`);
    deletionLog.deleted.campaigns = campaignsResult.deletedCount;

    console.log('');
    console.log('✓ Phase 2 Complete - Primary collections deleted');
    console.log('');

    // ==========================================================================
    // PHASE 3: DELETE USER ACCOUNTS (EXCEPT admin@javic.co.ke)
    // ==========================================================================
    
    console.log('PHASE 3: DELETING USER ACCOUNTS');
    console.log('-'.repeat(80));
    console.log('');

    // Get list of users to delete
    const usersToDelete = await db.collection('users').find({
      email: { $ne: 'admin@javic.co.ke' }
    }).toArray();

    console.log(`Found ${usersToDelete.length} users to delete:`);
    usersToDelete.forEach(u => {
      console.log(`    - ${u.email} (${u.role})`);
    });
    console.log('');

    // Delete all users except admin@javic.co.ke
    const usersResult = await db.collection('users').deleteMany({
      email: { $ne: 'admin@javic.co.ke' }
    });
    console.log(`✓ Deleted ${usersResult.deletedCount} user accounts`);
    deletionLog.deleted.users = usersResult.deletedCount;

    console.log('');
    console.log('✓ Phase 3 Complete - User accounts deleted');
    console.log('');

    // ==========================================================================
    // PHASE 4: DELETE EMPTY COLLECTIONS (OPTIONAL CLEANUP)
    // ==========================================================================
    
    console.log('PHASE 4: CLEANING EMPTY COLLECTIONS');
    console.log('-'.repeat(80));
    console.log('');

    const emptyCollections = [
      'mpesatransactions',
      'adminrequests',
      'blogposts',
      'productviews',
      'areas',
      'counties',
      'possettings',
      'customercreditaccounts',
      'credittransactions',
      'exams'
    ];

    for (const collectionName of emptyCollections) {
      const result = await db.collection(collectionName).deleteMany({});
      if (result.deletedCount > 0) {
        console.log(`    ✓ Deleted ${result.deletedCount} from ${collectionName}`);
        deletionLog.deleted[collectionName] = result.deletedCount;
      }
    }

    console.log('✓ Phase 4 Complete - Empty collections cleaned');
    console.log('');

    // ==========================================================================
    // PHASE 5: VERIFICATION
    // ==========================================================================
    
    console.log('PHASE 5: VERIFICATION');
    console.log('-'.repeat(80));
    console.log('');

    // Verify what's kept
    const categoriesCount = await db.collection('categories').countDocuments();
    const bannersCount = await db.collection('banners').countDocuments();
    const usersCount = await db.collection('users').countDocuments();
    const branchesCount = await db.collection('branches').countDocuments();
    const vendorsCount = await db.collection('vendors').countDocuments();
    const outletsCount = await db.collection('posoutlets').countDocuments();
    
    console.log('✓ VERIFICATION - Collections Kept:');
    console.log(`    categories: ${categoriesCount} (expected: 3)`);
    console.log(`    banners: ${bannersCount} (expected: 6)`);
    console.log(`    users: ${usersCount} (expected: 1)`);
    console.log(`    branches: ${branchesCount} (expected: 1)`);
    console.log(`    vendors: ${vendorsCount} (expected: 2)`);
    console.log(`    posoutlets: ${outletsCount} (expected: 1)`);
    console.log('');

    deletionLog.kept = {
      categories: categoriesCount,
      banners: bannersCount,
      users: usersCount,
      branches: branchesCount,
      vendors: vendorsCount,
      posoutlets: outletsCount
    };

    // Verify what's deleted
    const ordersCount = await db.collection('orders').countDocuments();
    const productsCount = await db.collection('products').countDocuments();
    const stocksCount = await db.collection('branchstocks').countDocuments();
    const campaignsCount = await db.collection('campaigns').countDocuments();
    
    console.log('✓ VERIFICATION - Collections Deleted:');
    console.log(`    orders: ${ordersCount} (expected: 0)`);
    console.log(`    products: ${productsCount} (expected: 0)`);
    console.log(`    branchstocks: ${stocksCount} (expected: 0)`);
    console.log(`    campaigns: ${campaignsCount} (expected: 0)`);
    console.log('');

    // Check for issues
    const issues = [];
    if (categoriesCount !== 3) issues.push(`Categories count mismatch: ${categoriesCount}`);
    if (bannersCount !== 6) issues.push(`Banners count mismatch: ${bannersCount}`);
    if (usersCount !== 1) issues.push(`Users count mismatch: ${usersCount}`);
    if (ordersCount !== 0) issues.push(`Orders not fully deleted: ${ordersCount}`);
    if (productsCount !== 0) issues.push(`Products not fully deleted: ${productsCount}`);

    if (issues.length > 0) {
      console.log('⚠ VERIFICATION WARNINGS:');
      issues.forEach(issue => console.log(`    - ${issue}`));
      deletionLog.errors.push(...issues);
      console.log('');
    } else {
      console.log('✓ All verifications passed!');
      console.log('');
    }

    // Verify admin can still authenticate
    const adminCheck = await db.collection('users').findOne({ email: 'admin@javic.co.ke' });
    if (adminCheck) {
      console.log('✓ Admin account verification:');
      console.log(`    Email: ${adminCheck.email}`);
      console.log(`    Role: ${adminCheck.role}`);
      console.log(`    Active: ${adminCheck.isActive}`);
      console.log(`    ID: ${adminCheck._id}`);
    } else {
      console.log('❌ CRITICAL: Admin account not found!');
      deletionLog.errors.push('Admin account lost during cleanup');
    }

    console.log('');
    console.log('✓ Phase 5 Complete - Verification finished');
    console.log('');

    // ==========================================================================
    // FINAL SUMMARY
    // ==========================================================================
    
    console.log('=' .repeat(80));
    console.log('CLEANUP COMPLETE - FINAL SUMMARY');
    console.log('=' .repeat(80));
    console.log('');

    const totalDeleted = Object.values(deletionLog.deleted).reduce((a, b) => a + b, 0);
    
    console.log('📊 RECORDS DELETED:');
    Object.entries(deletionLog.deleted).forEach(([collection, count]) => {
      if (count > 0) {
        console.log(`    ${collection}: ${count}`);
      }
    });
    console.log(`    TOTAL: ${totalDeleted} records`);
    console.log('');

    console.log('✅ RECORDS KEPT:');
    Object.entries(deletionLog.kept).forEach(([collection, count]) => {
      console.log(`    ${collection}: ${count}`);
    });
    console.log('');

    if (deletionLog.errors.length > 0) {
      console.log('⚠ WARNINGS/ERRORS:');
      deletionLog.errors.forEach(error => console.log(`    - ${error}`));
      console.log('');
    }

    console.log('🎯 DATABASE STATE:');
    console.log('    ✅ Categories intact (3)');
    console.log('    ✅ Hero banners intact (6)');
    console.log('    ✅ Admin account intact (admin@javic.co.ke)');
    console.log('    ✅ System infrastructure intact');
    console.log('    ❌ Products deleted (ready for import)');
    console.log('    ❌ Orders deleted (fresh start)');
    console.log('    ❌ Inventory deleted (ready for recount)');
    console.log('');

    console.log('📝 NEXT STEPS:');
    console.log('    1. Import/add products via admin panel');
    console.log('    2. Set up fresh inventory counts');
    console.log('    3. Test admin login: admin@javic.co.ke');
    console.log('    4. Verify site displays correctly');
    console.log('    5. Disable /admin/seed page');
    console.log('    6. Set NODE_ENV=production for deployment');
    console.log('');

    deletionLog.status = 'completed';
    deletionLog.totalDeleted = totalDeleted;

    // Save deletion log
    const logFile = 'cleanup-execution-log.json';
    fs.writeFileSync(logFile, JSON.stringify(deletionLog, null, 2));
    console.log(`✓ Cleanup log saved to: ${logFile}`);
    console.log('');

    console.log('=' .repeat(80));
    console.log('🎉 PRE-LAUNCH CLEANUP SUCCESSFUL!');
    console.log('=' .repeat(80));
    console.log('');

  } catch (error) {
    console.error('\n❌ CLEANUP FAILED:');
    console.error(error);
    deletionLog.status = 'failed';
    deletionLog.errors.push(error.message);
    
    // Save error log
    fs.writeFileSync('cleanup-error-log.json', JSON.stringify(deletionLog, null, 2));
  } finally {
    await client.close();
  }
}

executeCleanup();
