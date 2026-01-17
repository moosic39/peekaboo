#!/usr/bin/env node

/**
 * Quick verification script for Phase 1 setup
 * This demonstrates that the project structure and configurations are correct
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Phase 1 Setup...\n');

const checks = [
  {
    name: 'TypeScript path aliases configured',
    check: () => {
      const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
      return tsconfig.compilerOptions?.baseUrl === '.' &&
             tsconfig.compilerOptions?.paths?.['@/*']?.[0] === 'src/*';
    }
  },
  {
    name: 'Babel module resolver configured',
    check: () => {
      const content = fs.readFileSync('babel.config.js', 'utf8');
      return content.includes('module-resolver') && content.includes('@');
    }
  },
  {
    name: 'src/types/index.ts exists with types',
    check: () => {
      const content = fs.readFileSync('src/types/index.ts', 'utf8');
      return content.includes('ActivityType') &&
             content.includes('Activity') &&
             content.includes('FeedDetails');
    }
  },
  {
    name: 'src/constants/colors.ts exists with activity colors',
    check: () => {
      const content = fs.readFileSync('src/constants/colors.ts', 'utf8');
      return content.includes('activityColors') &&
             content.includes('feed:') &&
             content.includes('#4A90D9');
    }
  },
  {
    name: 'All src directories created',
    check: () => {
      const dirs = ['components', 'screens', 'hooks', 'stores', 'types', 'lib', 'constants'];
      return dirs.every(dir => fs.existsSync(path.join('src', dir)));
    }
  }
];

let passed = 0;
let failed = 0;

checks.forEach(({ name, check }) => {
  try {
    if (check()) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name} - ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed}/${checks.length} checks passed\n`);

if (failed === 0) {
  console.log('🎉 Phase 1 setup complete! Ready to move to Phase 2.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please review the setup.\n');
  process.exit(1);
}
