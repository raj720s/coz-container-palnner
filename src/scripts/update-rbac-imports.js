#!/usr/bin/env node

/**
 * Script to update all RBAC imports to use the new simplified RBAC system
 * This script will replace old RBAC imports with the new simplified ones
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define the replacement mappings
const replacements = [
  // Old withAuth imports
  {
    from: 'import { withUserAuth } from "@/components/auth/withAuth";',
    to: 'import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";'
  },
  {
    from: 'import { withAdminAuth } from "@/components/auth/withAuth";',
    to: 'import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";'
  },
  {
    from: 'import { withRouteAuth } from "@/components/auth/withAuth";',
    to: 'import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";'
  },
  
  // Old withRBACAuth imports
  {
    from: 'import { withAnyPrivilegeRBAC } from "@/components/auth/withRBACAuth";',
    to: 'import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";'
  },
  {
    from: 'import { withPrivilegeRBAC } from "@/components/auth/withRBACAuth";',
    to: 'import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";'
  },
  {
    from: 'import { withRouteRBAC } from "@/components/auth/withRBACAuth";',
    to: 'import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";'
  },
  {
    from: 'import { withAdminRBAC } from "@/components/auth/withRBACAuth";',
    to: 'import { withAdminRBAC } from "@/components/auth/withSimpleRBAC";'
  },
  
  // Export replacements
  {
    from: 'export default withUserAuth(',
    to: 'export default withSimpleRBAC('
  },
  {
    from: 'export default withAdminAuth(',
    to: 'export default withSimpleRBAC('
  },
  {
    from: 'export default withRouteAuth(',
    to: 'export default withSimpleRBAC('
  },
  {
    from: 'export default withAnyPrivilegeRBAC(',
    to: 'export default withSimpleRBAC('
  },
  {
    from: 'export default withPrivilegeRBAC(',
    to: 'export default withSimpleRBAC('
  },
  {
    from: 'export default withRouteRBAC(',
    to: 'export default withSimpleRBAC('
  }
];

// Function to update a single file
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    replacements.forEach(replacement => {
      if (content.includes(replacement.from)) {
        content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
        updated = true;
        console.log(`✅ Updated ${filePath}: ${replacement.from} → ${replacement.to}`);
      }
    });
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    
    return updated;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Function to find and update all files
function updateAllFiles() {
  const patterns = [
    'src/app/**/*.tsx',
    'src/app/**/*.ts',
    'src/components/**/*.tsx',
    'src/components/**/*.ts'
  ];
  
  let totalFiles = 0;
  let updatedFiles = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    
    files.forEach(file => {
      totalFiles++;
      if (updateFile(file)) {
        updatedFiles++;
      }
    });
  });
  
  console.log(`\n🎉 Update complete!`);
  console.log(`📁 Total files processed: ${totalFiles}`);
  console.log(`✅ Files updated: ${updatedFiles}`);
  console.log(`📝 Files unchanged: ${totalFiles - updatedFiles}`);
}

// Run the update
if (require.main === module) {
  console.log('🚀 Starting RBAC import updates...\n');
  updateAllFiles();
}

module.exports = { updateFile, updateAllFiles };
