/**
 * Migration script to update all API routes from old connectDB() to new ensureDBConnection()
 * Run this script to automatically update your API routes
 */

const fs = require('fs')
const path = require('path')

const API_DIR = path.join(__dirname, '..', 'app', 'api')

// Patterns to find and replace
const PATTERNS = [
  {
    find: /import connectDB from ['"]@\/lib\/mongodb['"]/g,
    replace: "import { ensureDBConnection } from '@/lib/db-utils'"
  },
  {
    find: /await connectDB\(\)/g,
    replace: "await ensureDBConnection()"
  }
]

/**
 * Recursively find all TypeScript files in API directory
 */
function findTSFiles(dir) {
  const files = []
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        traverse(fullPath)
      } else if (item.endsWith('.ts') && item !== 'route.ts.bak') {
        files.push(fullPath)
      }
    }
  }
  
  traverse(dir)
  return files
}

/**
 * Update a single file
 */
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    // Apply each pattern
    for (const pattern of PATTERNS) {
      if (pattern.find.test(content)) {
        content = content.replace(pattern.find, pattern.replace)
        modified = true
      }
    }
    
    if (modified) {
      // Create backup
      fs.writeFileSync(filePath + '.bak', fs.readFileSync(filePath))
      
      // Write updated content
      fs.writeFileSync(filePath, content)
      console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message)
    return false
  }
}

/**
 * Main migration function
 */
function migrateConnections() {
  console.log('🔄 Starting MongoDB connection migration...')
  console.log(`📁 Scanning directory: ${API_DIR}`)
  
  if (!fs.existsSync(API_DIR)) {
    console.error('❌ API directory not found:', API_DIR)
    process.exit(1)
  }
  
  const tsFiles = findTSFiles(API_DIR)
  console.log(`📄 Found ${tsFiles.length} TypeScript files`)
  
  let updatedCount = 0
  
  for (const file of tsFiles) {
    if (updateFile(file)) {
      updatedCount++
    }
  }
  
  console.log(`\n📊 Migration Summary:`)
  console.log(`   Total files scanned: ${tsFiles.length}`)
  console.log(`   Files updated: ${updatedCount}`)
  console.log(`   Files unchanged: ${tsFiles.length - updatedCount}`)
  
  if (updatedCount > 0) {
    console.log(`\n💾 Backup files created with .bak extension`)
    console.log(`🧪 Please test your API routes before deploying`)
    console.log(`🗑️  Remove .bak files after confirming everything works`)
  }
  
  console.log('\n✅ Migration completed!')
}

// Run migration if script is executed directly
if (require.main === module) {
  migrateConnections()
}

module.exports = { migrateConnections }