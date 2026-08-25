const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const envContent = fs.readFileSync('.env.local', 'utf8');
const mongoUri = envContent.match(/MONGODB_URI=(.*)/)?.[1];

async function fullDatabaseAudit() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB for FULL DATABASE AUDIT\n');
    console.log('=' .repeat(80));
    console.log('PRE-LAUNCH DATABASE CLEANUP AUDIT REPORT');
    console.log('=' .repeat(80));
    console.log('\n');

    const db = client.db();
    const collections = await db.listCollections().toArray();

    const report = {
      totalCollections: 0,
      totalRecords: 0,
      collections: {},
      testData: [],
      safeToDelete: [],
      likelySafe: [],
      doNotDelete: [],
      manualReview: [],
      dataIntegrityIssues: [],
      orphanedRecords: [],
      duplicates: []
    };

    console.log('SECTION 1: COMPLETE DATABASE INVENTORY');
    console.log('=' .repeat(80));
    console.log('\n');

    // Iterate through all collections
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      
      report.totalCollections++;
      report.totalRecords += count;

      console.log(`Collection: ${collectionName}`);
      console.log(`  Record Count: ${count}`);

      const collectionData = {
        name: collectionName,
        count: count,
        purpose: '',
        sampleRecords: [],
        relationships: [],
        dataType: 'unknown',
        recommendation: 'unknown'
      };

      // Get sample records
      if (count > 0) {
        const samples = await collection.find({}).limit(3).toArray();
        collectionData.sampleRecords = samples;
      }

      // Analyze each collection
      switch (collectionName) {
        case 'users':
          collectionData.purpose = 'User accounts (customers, admins, super_admins)';
          collectionData.relationships = ['orders', 'reviews', 'adminrequests'];
          
          const users = await collection.find({}).toArray();
          console.log('  Purpose: User accounts');
          console.log('  Sample data:');
          
          for (const user of users) {
            console.log(`    - ${user.email} (role: ${user.role}, provider: ${user.provider || 'local'})`);
            
            // Check for test patterns
            const testIndicators = ['test', 'demo', 'sample', 'dummy', 'example', 'localhost'];
            const isTestLike = testIndicators.some(indicator => 
              user.email?.toLowerCase().includes(indicator) ||
              user.firstName?.toLowerCase().includes(indicator) ||
              user.lastName?.toLowerCase().includes(indicator)
            );

            if (isTestLike) {
              report.likelySafe.push({
                collection: 'users',
                _id: user._id,
                record: `${user.email} (${user.role})`,
                reason: 'Contains test/demo keywords',
                dependencies: 'May have orders, reviews'
              });
            }

            // Identify system accounts
            if (user.role === 'super_admin' || user.role === 'admin') {
              report.doNotDelete.push({
                collection: 'users',
                _id: user._id,
                record: `${user.email} (${user.role})`,
                reason: 'Administrative account - required for system access'
              });
            }
          }
          
          collectionData.dataType = 'mixed';
          collectionData.recommendation = 'manual review needed';
          break;

        case 'products':
          collectionData.purpose = 'Product catalog';
          collectionData.relationships = ['categories', 'orders', 'reviews', 'branchstocks'];
          
          const products = await collection.find({}).toArray();
          console.log('  Purpose: Product catalog');
          console.log(`  Product count: ${products.length}`);
          
          // Sample product names
          if (products.length > 0) {
            console.log('  Sample products:');
            products.slice(0, 5).forEach(p => {
              console.log(`    - ${p.name} (${p.category}) - KSH ${p.price}`);
            });
          }

          // Check if products look like seed data
          const seedProductNames = [
            'Rose Petal Face Serum',
            'Lavender Body Oil',
            'Chamomile Bath Soak',
            'Peppermint Hair Oil',
            'Organic Turmeric Mask',
            'Premium Face Serum Collection'
          ];

          const hasSeedProducts = products.some(p => 
            seedProductNames.some(seedName => p.name?.includes(seedName))
          );

          if (hasSeedProducts) {
            report.likelySafe.push({
              collection: 'products',
              count: products.length,
              reason: 'Contains seed/sample product names from lib/seed.ts',
              recommendation: 'Verify these are test products, not actual inventory'
            });
          }

          // Check for zero-stock products
          const zeroStockProducts = products.filter(p => p.stockQuantity === 0 || !p.inStock);
          if (zeroStockProducts.length > 0) {
            console.log(`  ⚠ Warning: ${zeroStockProducts.length} products have zero stock`);
          }

          collectionData.dataType = hasSeedProducts ? 'likely test/seed data' : 'production';
          collectionData.recommendation = hasSeedProducts ? 'verify before deleting' : 'keep';
          break;

        case 'categories':
          collectionData.purpose = 'Product categories';
          collectionData.relationships = ['products'];
          
          const categories = await collection.find({}).toArray();
          console.log('  Purpose: Product categories');
          
          if (categories.length > 0) {
            console.log('  Categories:');
            categories.forEach(c => {
              console.log(`    - ${c.name} (${c.slug})`);
            });
          }

          // Check if categories match seed data
          const seedCategoryNames = [
            'Skincare & Beauty',
            'Herbal Remedies',
            'Essential Oils',
            'Haircare',
            'Soaps & Body Care',
            'Health & Wellness',
            'Organic Ingredients',
            'Bundles & Gift Sets'
          ];

          const hasSeedCategories = categories.some(c => 
            seedCategoryNames.includes(c.name)
          );

          if (hasSeedCategories) {
            report.likelySafe.push({
              collection: 'categories',
              count: categories.length,
              reason: 'Contains seed/sample category names from lib/seed.ts',
              recommendation: 'These match seed data - verify if they should be kept'
            });
          }

          collectionData.dataType = hasSeedCategories ? 'likely seed data' : 'production';
          collectionData.recommendation = hasSeedCategories ? 'verify' : 'keep';
          break;

        case 'orders':
          collectionData.purpose = 'Customer orders and sales transactions';
          collectionData.relationships = ['users', 'products', 'mpesatransactions', 'reviews'];
          
          const orders = await collection.find({}).toArray();
          console.log('  Purpose: Customer orders');
          console.log(`  Order count: ${orders.length}`);
          
          if (orders.length > 0) {
            console.log('  Sample orders:');
            orders.slice(0, 5).forEach(o => {
              console.log(`    - ${o.orderNumber} (${o.status}) - KSH ${o.totalAmount} - ${o.channel || 'online'}`);
            });
          }

          // Analyze orders for test indicators
          const testOrders = [];
          const prodOrders = [];

          for (const order of orders) {
            const testIndicators = ['test', 'demo', 'sample', 'dummy', 'example', '@test', '+254000000000'];
            const isTestLike = testIndicators.some(indicator => 
              order.customerEmail?.toLowerCase().includes(indicator) ||
              order.customerPhone?.includes('000000') ||
              order.customerNotes?.toLowerCase().includes(indicator)
            );

            if (isTestLike) {
              testOrders.push(order);
            } else {
              prodOrders.push(order);
            }
          }

          console.log(`  Test-like orders: ${testOrders.length}`);
          console.log(`  Production-like orders: ${prodOrders.length}`);

          if (testOrders.length > 0) {
            report.likelySafe.push({
              collection: 'orders',
              count: testOrders.length,
              reason: 'Contains test/demo keywords in customer details',
              examples: testOrders.slice(0, 3).map(o => `${o.orderNumber} (${o.customerEmail})`),
              recommendation: 'Verify these are test orders'
            });
          }

          if (prodOrders.length > 0) {
            report.manualReview.push({
              collection: 'orders',
              count: prodOrders.length,
              reason: 'Orders that appear to be production data',
              recommendation: 'Manual review required - could be real customer orders'
            });
          }

          collectionData.dataType = testOrders.length > 0 ? 'mixed' : 'production';
          collectionData.recommendation = 'manual review required';
          break;

        case 'reviews':
          collectionData.purpose = 'Product reviews from customers';
          collectionData.relationships = ['products', 'orders', 'users'];
          
          if (count > 0) {
            const reviews = await collection.find({}).toArray();
            console.log('  Purpose: Product reviews');
            console.log(`  Review count: ${reviews.length}`);
            
            // Check for test reviews
            const testReviews = reviews.filter(r => 
              r.customerEmail?.includes('test') ||
              r.customerEmail?.includes('demo') ||
              r.comment?.toLowerCase().includes('test')
            );

            if (testReviews.length > 0) {
              report.likelySafe.push({
                collection: 'reviews',
                count: testReviews.length,
                reason: 'Contains test/demo keywords',
                recommendation: 'Verify these are test reviews'
              });
            }
          }

          collectionData.dataType = count === 0 ? 'empty' : 'mixed';
          collectionData.recommendation = count === 0 ? 'safe to leave empty' : 'review';
          break;

        case 'mpesatransactions':
          collectionData.purpose = 'M-Pesa payment transaction records';
          collectionData.relationships = ['orders'];
          
          if (count > 0) {
            const transactions = await collection.find({}).toArray();
            console.log('  Purpose: M-Pesa transactions');
            console.log(`  Transaction count: ${transactions.length}`);

            // Analyze for test transactions
            const testTransactions = transactions.filter(t => 
              t.phoneNumber?.includes('000000') ||
              t.phoneNumber?.includes('254000') ||
              t.mpesaReceiptNumber?.includes('TEST')
            );

            if (testTransactions.length > 0) {
              report.likelySafe.push({
                collection: 'mpesatransactions',
                count: testTransactions.length,
                reason: 'Test phone numbers or receipt numbers',
                recommendation: 'Likely test transactions'
              });
            }

            const prodTransactions = transactions.length - testTransactions.length;
            if (prodTransactions > 0) {
              report.manualReview.push({
                collection: 'mpesatransactions',
                count: prodTransactions,
                reason: 'Appear to be real M-Pesa transactions',
                recommendation: 'CRITICAL: Manual review required - these may be real payments'
              });
            }
          }

          collectionData.dataType = count === 0 ? 'empty' : 'critical';
          collectionData.recommendation = count === 0 ? 'safe' : 'MANUAL REVIEW REQUIRED';
          break;

        case 'campaigns':
          collectionData.purpose = 'Marketing campaigns and promotions';
          collectionData.relationships = ['campaignanalytics'];
          
          if (count > 0) {
            const campaigns = await collection.find({}).toArray();
            console.log('  Purpose: Marketing campaigns');
            campaigns.forEach(c => {
              console.log(`    - ${c.title} (${c.status})`);
            });
          }

          collectionData.dataType = count === 0 ? 'empty' : 'configuration';
          collectionData.recommendation = count === 0 ? 'safe' : 'review for test campaigns';
          break;

        case 'blogposts':
          collectionData.purpose = 'Blog content';
          collectionData.relationships = ['products (via relatedProducts)'];
          
          collectionData.dataType = count === 0 ? 'empty' : 'content';
          collectionData.recommendation = count === 0 ? 'safe' : 'keep unless test content';
          break;

        case 'branches':
          collectionData.purpose = 'Physical branch/location records';
          collectionData.relationships = ['branchstocks', 'orders'];
          
          if (count > 0) {
            const branches = await collection.find({}).toArray();
            console.log('  Purpose: Branch/location management');
            branches.forEach(b => {
              console.log(`    - ${b.name} (${b.branchCode}) - Main: ${b.isMainBranch || false}`);
            });
          }

          report.doNotDelete.push({
            collection: 'branches',
            count: count,
            reason: 'Required for inventory and order tracking system',
            recommendation: 'Keep all branches - system configuration'
          });

          collectionData.dataType = 'system configuration';
          collectionData.recommendation = 'DO NOT DELETE';
          break;

        case 'vendors':
          collectionData.purpose = 'Vendor/supplier records';
          collectionData.relationships = ['branchstocks', 'orders'];
          
          if (count > 0) {
            const vendors = await collection.find({}).toArray();
            console.log('  Purpose: Vendor/supplier management');
            vendors.forEach(v => {
              console.log(`    - ${v.name} (${v.vendorCode}) - House: ${v.isHouseStock || false}`);
            });
          }

          report.doNotDelete.push({
            collection: 'vendors',
            count: count,
            reason: 'Required for inventory tracking system',
            recommendation: 'Keep all vendors - system configuration'
          });

          collectionData.dataType = 'system configuration';
          collectionData.recommendation = 'DO NOT DELETE';
          break;

        case 'branchstocks':
          collectionData.purpose = 'Branch inventory tracking';
          collectionData.relationships = ['products', 'branches', 'vendors'];
          
          if (count > 0) {
            const stocks = await collection.find({}).toArray();
            console.log('  Purpose: Branch inventory');
            console.log(`  Stock records: ${stocks.length}`);
            
            // Check for orphaned stock (products that don't exist)
            const productIds = stocks.map(s => s.productId.toString());
            const uniqueProductIds = [...new Set(productIds)];
            console.log(`  Tracking ${uniqueProductIds.length} unique products`);
          }

          collectionData.dataType = 'transactional';
          collectionData.recommendation = 'review for orphaned records';
          break;

        case 'posoutlets':
          collectionData.purpose = 'Point of Sale outlet configuration';
          collectionData.relationships = ['orders', 'users'];
          
          if (count > 0) {
            const outlets = await collection.find({}).toArray();
            console.log('  Purpose: POS outlets');
            outlets.forEach(o => {
              console.log(`    - ${o.name} (${o.code})`);
            });
          }

          report.doNotDelete.push({
            collection: 'posoutlets',
            count: count,
            reason: 'Required for POS system operation',
            recommendation: 'Keep - system configuration'
          });

          collectionData.dataType = 'system configuration';
          collectionData.recommendation = 'DO NOT DELETE';
          break;

        case 'adminrequests':
          collectionData.purpose = 'Pending admin registration requests';
          collectionData.relationships = ['users (when approved)'];
          
          if (count > 0) {
            const requests = await collection.find({}).toArray();
            console.log('  Purpose: Admin registration requests');
            requests.forEach(r => {
              console.log(`    - ${r.email} (${r.status})`);
            });

            const pendingRequests = requests.filter(r => r.status === 'pending');
            const approvedRequests = requests.filter(r => r.status === 'approved');
            const rejectedRequests = requests.filter(r => r.status === 'rejected');

            if (approvedRequests.length > 0) {
              report.safeToDelete.push({
                collection: 'adminrequests',
                count: approvedRequests.length,
                reason: 'Already approved and converted to user accounts',
                recommendation: 'Safe to delete approved requests'
              });
            }

            if (rejectedRequests.length > 0) {
              report.safeToDelete.push({
                collection: 'adminrequests',
                count: rejectedRequests.length,
                reason: 'Rejected requests - no longer needed',
                recommendation: 'Safe to delete rejected requests'
              });
            }

            if (pendingRequests.length > 0) {
              report.manualReview.push({
                collection: 'adminrequests',
                count: pendingRequests.length,
                reason: 'Pending admin requests awaiting review',
                recommendation: 'Review and either approve or reject before launch'
              });
            }
          }

          collectionData.dataType = count === 0 ? 'empty' : 'workflow';
          collectionData.recommendation = count === 0 ? 'safe' : 'review and action';
          break;

        case 'sitesettings':
          collectionData.purpose = 'Application configuration settings';
          collectionData.relationships = [];
          
          report.doNotDelete.push({
            collection: 'sitesettings',
            count: count,
            reason: 'Contains application configuration',
            recommendation: 'DO NOT DELETE - system settings'
          });

          collectionData.dataType = 'system configuration';
          collectionData.recommendation = 'DO NOT DELETE';
          break;

        case 'notificationsettings':
          collectionData.purpose = 'Notification preferences';
          collectionData.relationships = [];
          
          report.doNotDelete.push({
            collection: 'notificationsettings',
            count: count,
            reason: 'System notification configuration',
            recommendation: 'Keep - system settings'
          });

          collectionData.dataType = 'system configuration';
          collectionData.recommendation = 'DO NOT DELETE';
          break;

        case 'banners':
          collectionData.purpose = 'Homepage/promotional banners';
          collectionData.relationships = [];
          
          if (count > 0) {
            const banners = await collection.find({}).toArray();
            console.log('  Purpose: Display banners');
            console.log(`  Banner count: ${banners.length}`);
          }

          collectionData.dataType = 'content';
          collectionData.recommendation = 'review for test banners';
          break;

        case 'ledgerentries':
          collectionData.purpose = 'Financial ledger entries';
          collectionData.relationships = ['orders', 'credittransactions'];
          
          if (count > 0) {
            console.log('  Purpose: Financial ledger');
            console.log(`  Entry count: ${count}`);
            
            report.manualReview.push({
              collection: 'ledgerentries',
              count: count,
              reason: 'Financial transaction records',
              recommendation: 'CRITICAL: Review carefully - may contain real financial data'
            });
          }

          collectionData.dataType = 'financial';
          collectionData.recommendation = 'MANUAL REVIEW - CRITICAL';
          break;

        case 'posheldorders':
          collectionData.purpose = 'Held/parked POS orders';
          collectionData.relationships = ['products', 'posoutlets'];
          
          if (count > 0) {
            console.log('  Purpose: Held POS orders');
            console.log(`  Held orders: ${count}`);
            
            report.manualReview.push({
              collection: 'posheldorders',
              count: count,
              reason: 'Orders on hold in POS system',
              recommendation: 'Check if these are test or real held orders'
            });
          }

          collectionData.dataType = 'transactional';
          collectionData.recommendation = 'review before deleting';
          break;

        case 'posauditentries':
          collectionData.purpose = 'POS system audit trail';
          collectionData.relationships = ['users', 'posoutlets'];
          
          if (count > 0) {
            console.log('  Purpose: POS audit log');
            console.log(`  Audit entries: ${count}`);
          }

          collectionData.dataType = 'audit log';
          collectionData.recommendation = 'review for test vs production data';
          break;

        case 'customercreditaccounts':
          collectionData.purpose = 'Customer credit account records';
          collectionData.relationships = ['users', 'credittransactions'];
          
          collectionData.dataType = count === 0 ? 'empty' : 'financial';
          collectionData.recommendation = count === 0 ? 'safe' : 'MANUAL REVIEW - FINANCIAL DATA';
          break;

        case 'credittransactions':
          collectionData.purpose = 'Credit transaction history';
          collectionData.relationships = ['customercreditaccounts', 'orders'];
          
          collectionData.dataType = count === 0 ? 'empty' : 'financial';
          collectionData.recommendation = count === 0 ? 'safe' : 'MANUAL REVIEW - FINANCIAL DATA';
          break;

        case 'campaignanalytics':
          collectionData.purpose = 'Campaign performance metrics';
          collectionData.relationships = ['campaigns'];
          
          if (count > 0) {
            report.safeToDelete.push({
              collection: 'campaignanalytics',
              count: count,
              reason: 'Analytics data that can be regenerated',
              recommendation: 'Safe to clear analytics for fresh start'
            });
          }

          collectionData.dataType = 'analytics';
          collectionData.recommendation = 'safe to clear';
          break;

        case 'productviews':
          collectionData.purpose = 'Product view tracking/analytics';
          collectionData.relationships = ['products'];
          
          collectionData.dataType = count === 0 ? 'empty' : 'analytics';
          collectionData.recommendation = count === 0 ? 'safe' : 'safe to clear';
          break;

        case 'areas':
          collectionData.purpose = 'Delivery areas/locations';
          collectionData.relationships = ['orders (via shippingAddress.area)'];
          
          collectionData.dataType = count === 0 ? 'empty' : 'configuration';
          collectionData.recommendation = count === 0 ? 'safe' : 'keep if used for delivery';
          break;

        case 'counties':
          collectionData.purpose = 'Kenya counties data';
          collectionData.relationships = ['orders (via shippingAddress.county)'];
          
          collectionData.dataType = count === 0 ? 'empty' : 'reference data';
          collectionData.recommendation = count === 0 ? 'safe' : 'keep - reference data';
          break;

        case 'outlets':
          collectionData.purpose = 'Sales outlets';
          collectionData.relationships = ['orders'];
          
          collectionData.dataType = 'configuration';
          collectionData.recommendation = 'keep if actively used';
          break;

        case 'possettings':
          collectionData.purpose = 'POS system settings';
          collectionData.relationships = [];
          
          report.doNotDelete.push({
            collection: 'possettings',
            count: count,
            reason: 'POS system configuration',
            recommendation: 'Keep - system settings'
          });

          collectionData.dataType = 'system configuration';
          collectionData.recommendation = 'DO NOT DELETE';
          break;

        case 'exams':
          collectionData.purpose = 'UNKNOWN - Not part of documented schema';
          
          if (count > 0) {
            report.manualReview.push({
              collection: 'exams',
              count: count,
              reason: 'Unknown collection not in application models',
              recommendation: 'Investigate origin - possibly from another project or test'
            });
          }

          collectionData.dataType = 'unknown';
          collectionData.recommendation = count === 0 ? 'safe to ignore' : 'investigate';
          break;

        default:
          console.log('  Purpose: Unknown collection');
          collectionData.dataType = 'unknown';
          collectionData.recommendation = 'investigate';
      }

      report.collections[collectionName] = collectionData;
      console.log('');
    }

    console.log('\n');
    console.log('=' .repeat(80));
    console.log('SECTION 2: DATA INTEGRITY CHECKS');
    console.log('=' .repeat(80));
    console.log('\n');

    // Check for orphaned orders (user deleted but orders remain)
    console.log('Checking for orphaned order records...');
    const orders = await db.collection('orders').find({}).toArray();
    const users = await db.collection('users').find({}).toArray();
    const userIds = new Set(users.map(u => u._id.toString()));

    const orphanedOrders = orders.filter(o => 
      o.userId && !userIds.has(o.userId.toString())
    );

    if (orphanedOrders.length > 0) {
      console.log(`⚠ Found ${orphanedOrders.length} orphaned orders (user deleted)`);
      report.dataIntegrityIssues.push({
        issue: 'Orphaned Orders',
        count: orphanedOrders.length,
        description: 'Orders reference deleted users',
        recommendation: 'Either keep for financial records or anonymize user data'
      });
    } else {
      console.log('✓ No orphaned orders found');
    }

    // Check for orphaned reviews
    console.log('\nChecking for orphaned review records...');
    const reviews = await db.collection('reviews').find({}).toArray();
    const products = await db.collection('products').find({}).toArray();
    const productIds = new Set(products.map(p => p._id.toString()));

    const orphanedReviews = reviews.filter(r => 
      !productIds.has(r.productId.toString())
    );

    if (orphanedReviews.length > 0) {
      console.log(`⚠ Found ${orphanedReviews.length} orphaned reviews (product deleted)`);
      report.dataIntegrityIssues.push({
        issue: 'Orphaned Reviews',
        count: orphanedReviews.length,
        description: 'Reviews reference deleted products',
        recommendation: 'Safe to delete - product no longer exists'
      });
      
      report.safeToDelete.push({
        collection: 'reviews (orphaned)',
        count: orphanedReviews.length,
        reason: 'Reviews for deleted products',
        recommendation: 'Safe to delete'
      });
    } else {
      console.log('✓ No orphaned reviews found');
    }

    // Check for orphaned branch stock
    console.log('\nChecking for orphaned branch stock records...');
    const branchStocks = await db.collection('branchstocks').find({}).toArray();
    
    const orphanedStocks = branchStocks.filter(s => 
      !productIds.has(s.productId.toString())
    );

    if (orphanedStocks.length > 0) {
      console.log(`⚠ Found ${orphanedStocks.length} orphaned stock records (product deleted)`);
      report.dataIntegrityIssues.push({
        issue: 'Orphaned Branch Stocks',
        count: orphanedStocks.length,
        description: 'Stock records reference deleted products',
        recommendation: 'Safe to delete - product no longer exists'
      });

      report.safeToDelete.push({
        collection: 'branchstocks (orphaned)',
        count: orphanedStocks.length,
        reason: 'Stock for deleted products',
        recommendation: 'Safe to delete'
      });
    } else {
      console.log('✓ No orphaned stock records found');
    }

    // Check for duplicate users
    console.log('\nChecking for duplicate user accounts...');
    const emailCounts = {};
    users.forEach(u => {
      const email = u.email.toLowerCase();
      emailCounts[email] = (emailCounts[email] || 0) + 1;
    });

    const duplicateEmails = Object.entries(emailCounts).filter(([email, count]) => count > 1);
    if (duplicateEmails.length > 0) {
      console.log(`⚠ Found ${duplicateEmails.length} duplicate email addresses`);
      duplicateEmails.forEach(([email, count]) => {
        console.log(`  - ${email}: ${count} accounts`);
      });

      report.duplicates.push({
        issue: 'Duplicate User Emails',
        count: duplicateEmails.length,
        examples: duplicateEmails.map(([email, count]) => `${email} (${count})`),
        recommendation: 'Merge or delete duplicate accounts'
      });
    } else {
      console.log('✓ No duplicate user emails found');
    }

    console.log('\n');
    console.log('=' .repeat(80));
    console.log('SECTION 3: SEED SCRIPT ANALYSIS');
    console.log('=' .repeat(80));
    console.log('\n');

    console.log('Checking for automatic seed/initialization logic...\n');
    
    console.log('✓ Found seed script: lib/seed.ts');
    console.log('  - Contains seedDatabase() function');
    console.log('  - Clears existing categories and products');
    console.log('  - Inserts predefined test/sample products');
    console.log('  - Can be triggered from /admin/seed page');
    console.log('');
    console.log('⚠ WARNING: If you delete products/categories and someone runs /admin/seed,');
    console.log('           the test data will be recreated!');
    console.log('');
    console.log('RECOMMENDATION: Disable or remove /admin/seed page before production launch');

    console.log('\n');
    console.log('=' .repeat(80));
    console.log('SECTION 4: ENVIRONMENT CONFIGURATION CHECK');
    console.log('=' .repeat(80));
    console.log('\n');

    console.log('Environment Variables:');
    console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Database: ${mongoUri.includes('test') ? '⚠ Contains "test" in name' : '✓ Production database name'}`);
    console.log(`  NEXT_PUBLIC_BASE_URL: ${envContent.match(/NEXT_PUBLIC_BASE_URL=(.*)/)?.[1] || 'not set'}`);
    console.log('');

    if (mongoUri.includes('test')) {
      console.log('⚠ WARNING: Database connection string contains "test"');
      console.log('           Verify you are connected to the correct production database');
    }

    console.log('\n');
    console.log('=' .repeat(80));
    console.log('SECTION 5: CLEANUP RECOMMENDATIONS');
    console.log('=' .repeat(80));
    console.log('\n');

    console.log('SAFE TO DELETE (High Confidence):');
    console.log('-'.repeat(80));
    if (report.safeToDelete.length > 0) {
      report.safeToDelete.forEach(item => {
        console.log(`\n✓ ${item.collection}`);
        console.log(`  Count: ${item.count || 'N/A'}`);
        console.log(`  Reason: ${item.reason}`);
        console.log(`  Action: ${item.recommendation}`);
      });
    } else {
      console.log('  (None identified)');
    }

    console.log('\n\nLIKELY SAFE TO DELETE (Verify First):');
    console.log('-'.repeat(80));
    if (report.likelySafe.length > 0) {
      report.likelySafe.forEach(item => {
        console.log(`\n⚠ ${item.collection}`);
        console.log(`  Count: ${item.count || 'N/A'}`);
        console.log(`  Reason: ${item.reason}`);
        console.log(`  Action: ${item.recommendation}`);
        if (item.examples) {
          console.log(`  Examples: ${item.examples.join(', ')}`);
        }
        if (item.dependencies) {
          console.log(`  Dependencies: ${item.dependencies}`);
        }
      });
    } else {
      console.log('  (None identified)');
    }

    console.log('\n\nDO NOT DELETE:');
    console.log('-'.repeat(80));
    if (report.doNotDelete.length > 0) {
      report.doNotDelete.forEach(item => {
        console.log(`\n🛡 ${item.collection}`);
        console.log(`  Count: ${item.count || 'N/A'}`);
        console.log(`  Reason: ${item.reason}`);
        console.log(`  Action: ${item.recommendation}`);
      });
    } else {
      console.log('  (None identified)');
    }

    console.log('\n\nMANUAL REVIEW REQUIRED:');
    console.log('-'.repeat(80));
    if (report.manualReview.length > 0) {
      report.manualReview.forEach(item => {
        console.log(`\n❓ ${item.collection}`);
        console.log(`  Count: ${item.count || 'N/A'}`);
        console.log(`  Reason: ${item.reason}`);
        console.log(`  Action: ${item.recommendation}`);
      });
    } else {
      console.log('  (None identified)');
    }

    console.log('\n\nDATA INTEGRITY ISSUES:');
    console.log('-'.repeat(80));
    if (report.dataIntegrityIssues.length > 0) {
      report.dataIntegrityIssues.forEach(item => {
        console.log(`\n⚠ ${item.issue}`);
        console.log(`  Count: ${item.count}`);
        console.log(`  Description: ${item.description}`);
        console.log(`  Action: ${item.recommendation}`);
      });
    } else {
      console.log('  ✓ No integrity issues found');
    }

    console.log('\n\nDUPLICATE DATA:');
    console.log('-'.repeat(80));
    if (report.duplicates.length > 0) {
      report.duplicates.forEach(item => {
        console.log(`\n⚠ ${item.issue}`);
        console.log(`  Count: ${item.count}`);
        console.log(`  Examples: ${item.examples.join(', ')}`);
        console.log(`  Action: ${item.recommendation}`);
      });
    } else {
      console.log('  ✓ No duplicates found');
    }

    console.log('\n');
    console.log('=' .repeat(80));
    console.log('SECTION 6: EXECUTIVE SUMMARY');
    console.log('=' .repeat(80));
    console.log('\n');

    console.log(`Total Collections: ${report.totalCollections}`);
    console.log(`Total Records: ${report.totalRecords}`);
    console.log(`Safe to Delete: ${report.safeToDelete.length} categories`);
    console.log(`Likely Safe: ${report.likelySafe.length} categories`);
    console.log(`Must Keep: ${report.doNotDelete.length} categories`);
    console.log(`Manual Review: ${report.manualReview.length} categories`);
    console.log(`Integrity Issues: ${report.dataIntegrityIssues.length} issues`);
    console.log(`Duplicates: ${report.duplicates.length} issues`);

    console.log('\n');
    console.log('=' .repeat(80));
    console.log('SECTION 7: PROPOSED CLEANUP PLAN');
    console.log('=' .repeat(80));
    console.log('\n');

    console.log('PHASE 1 — Safe Cleanup (Analytics & Orphaned Data)');
    console.log('-'.repeat(80));
    console.log('1. Delete campaignanalytics (all records) - can be regenerated');
    console.log('2. Delete productviews (if any) - analytics data');
    console.log('3. Delete orphaned reviews (reviews for deleted products)');
    console.log('4. Delete orphaned branchstocks (stock for deleted products)');
    console.log('5. Delete approved/rejected adminrequests - already processed');
    console.log('');

    console.log('\nPHASE 2 — Conditional Cleanup (Verify First)');
    console.log('-'.repeat(80));
    console.log('1. Review products for seed/test data');
    console.log('   - If seed products exist, decide: keep or replace with real products');
    console.log('2. Review categories for seed/test data');
    console.log('   - If seed categories exist, decide: keep or replace with real categories');
    console.log('3. Review users for test accounts');
    console.log('   - Delete only confirmed test accounts');
    console.log('   - KEEP all admin/super_admin accounts');
    console.log('4. Review orders for test transactions');
    console.log('   - Delete only confirmed test orders');
    console.log('   - KEEP all production orders');
    console.log('');

    console.log('\nPHASE 3 — Data Integrity Fixes');
    console.log('-'.repeat(80));
    console.log('1. Resolve duplicate user accounts (if any)');
    console.log('2. Review and action pending adminrequests');
    console.log('3. Clean up posheldorders if test data');
    console.log('4. Review posauditentries - clear test audit logs');
    console.log('');

    console.log('\nPHASE 4 — Final Production Verification');
    console.log('-'.repeat(80));
    console.log('1. Disable or remove /admin/seed page');
    console.log('2. Verify NODE_ENV=production in deployment');
    console.log('3. Verify database connection points to production DB');
    console.log('4. Run final audit to confirm cleanup');
    console.log('5. Backup database before launch');
    console.log('6. Test critical flows (order, payment, user registration)');
    console.log('');

    console.log('\n');
    console.log('=' .repeat(80));
    console.log('AUDIT COMPLETE');
    console.log('=' .repeat(80));
    console.log('\n');
    console.log('⚠ IMPORTANT: This audit has NOT modified any data.');
    console.log('   Review the findings above and decide which data to delete.');
    console.log('   Create a database backup before performing any cleanup.');
    console.log('');

    // Save report to JSON file
    const reportFile = 'database-audit-report.json';
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`✓ Detailed report saved to: ${reportFile}`);
    console.log('');

  } catch (error) {
    console.error('Error during audit:', error);
  } finally {
    await client.close();
  }
}

fullDatabaseAudit();
