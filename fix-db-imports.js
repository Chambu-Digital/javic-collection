const fs = require('fs');
const path = require('path');

const files = [
  'app/api/reviews/[id]/route.ts',
  'app/api/reviews/[id]/helpful/route.ts',
  'app/api/locations/counties/[id]/areas/route.ts',
  'app/api/categories/[id]/route.ts',
  'app/api/blog/[id]/route.ts',
  'app/api/blog/slug/[slug]/route.ts',
  'app/api/admin/customers/[id]/route.ts',
  'app/api/admin/customers/[id]/details/route.ts',
  'app/api/admin/requests/[id]/route.ts',
  'app/api/admin/orders/[id]/route.ts',
  'app/api/admin/counties/[id]/route.ts',
  'app/api/admin/banners/[id]/route.ts',
  'app/api/admin/areas/[id]/route.ts',
  'app/api/admin/admins/[id]/route.ts'
];

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/ensureDBConnection/g, 'connectDB');
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
});

console.log('All files fixed!');