#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * Tests the connection to Supabase and verifies database access
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// ANSI color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

console.log(`\n${colors.blue}🔍 Testing Supabase Connection...${colors.reset}\n`);

// Check environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(`${colors.red}❌ Error: Missing environment variables${colors.reset}`);
  console.log('   Please check your .env file contains:');
  console.log('   - EXPO_PUBLIC_SUPABASE_URL');
  console.log('   - EXPO_PUBLIC_SUPABASE_ANON_KEY\n');
  process.exit(1);
}

console.log(`${colors.green}✓${colors.reset} Environment variables loaded`);
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);
console.log(`${colors.green}✓${colors.reset} Supabase client initialized\n`);

// Test connection by querying tables
async function testConnection() {
  console.log(`${colors.blue}📡 Testing database access...${colors.reset}\n`);

  // Test 1: Check families table
  console.log('1. Testing families table...');
  try {
    const { data, error } = await supabase
      .from('families')
      .select('id, name')
      .limit(1);

    if (error) throw error;
    console.log(`   ${colors.green}✓${colors.reset} Families table accessible (${data.length} rows returned)`);
  } catch (error) {
    console.log(`   ${colors.red}✗${colors.reset} Failed: ${error.message}`);
  }

  // Test 2: Check babies table
  console.log('2. Testing babies table...');
  try {
    const { data, error } = await supabase
      .from('babies')
      .select('id, name')
      .limit(1);

    if (error) throw error;
    console.log(`   ${colors.green}✓${colors.reset} Babies table accessible (${data.length} rows returned)`);
  } catch (error) {
    console.log(`   ${colors.red}✗${colors.reset} Failed: ${error.message}`);
  }

  // Test 3: Check activities table
  console.log('3. Testing activities table...');
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('id, type, timestamp')
      .limit(1);

    if (error) throw error;
    console.log(`   ${colors.green}✓${colors.reset} Activities table accessible (${data.length} rows returned)`);
  } catch (error) {
    console.log(`   ${colors.red}✗${colors.reset} Failed: ${error.message}`);
  }

  // Test 4: Check family_members table
  console.log('4. Testing family_members table...');
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('id, role')
      .limit(1);

    if (error) throw error;
    console.log(`   ${colors.green}✓${colors.reset} Family_members table accessible (${data.length} rows returned)`);
  } catch (error) {
    console.log(`   ${colors.red}✗${colors.reset} Failed: ${error.message}`);
  }

  console.log(`\n${colors.green}✅ Connection test complete!${colors.reset}`);
  console.log(`\n${colors.blue}💡 Next steps:${colors.reset}`);
  console.log('   If you see errors above, run the database reset script:');
  console.log(`   ${colors.yellow}specs/database-reset.sql${colors.reset}`);
  console.log('   in your Supabase dashboard (SQL Editor)\n');
}

// Run the test
testConnection().catch((error) => {
  console.error(`\n${colors.red}❌ Connection test failed:${colors.reset}`);
  console.error(`   ${error.message}\n`);
  process.exit(1);
});
