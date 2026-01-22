# Supabase Setup Guide

This guide walks you through setting up Supabase for the Peekaboo baby activity tracker. By the end, you'll have a fully configured Supabase project with real-time synchronization capabilities.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Supabase Project](#create-supabase-project)
3. [Run Database Schema](#run-database-schema)
4. [Get API Credentials](#get-api-credentials)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Enable Real-Time Replication](#enable-real-time-replication)
7. [Test Your Setup](#test-your-setup)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- A Supabase account (free tier is fine for development)
- Access to your project repository
- Node.js and npm installed

## Create Supabase Project

1. **Go to Supabase Dashboard**
   - Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in or create an account

2. **Create a New Project**
   - Click "New Project"
   - Fill in the details:
     - **Name**: `peekaboo-baby-tracker` (or your preferred name)
     - **Database Password**: Generate a strong password (save this!)
     - **Region**: Choose the region closest to your users
     - **Pricing Plan**: Start with the free tier

3. **Wait for Project Creation**
   - This takes 1-2 minutes
   - You'll see a progress indicator
   - Once complete, you'll be taken to your project dashboard

## Run Database Schema

1. **Open SQL Editor**
   - In your Supabase dashboard, go to **SQL Editor** (left sidebar)
   - Click "New Query"

2. **Copy the Schema**
   - Open `specs/database-schema.sql` from your project
   - Copy the entire contents

3. **Execute the Schema**
   - Paste the SQL into the Supabase SQL Editor
   - Click "Run" or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
   - You should see "Success. No rows returned" (this is expected)

4. **Verify Tables Created**
   - Go to **Table Editor** in the left sidebar
   - You should see 4 tables:
     - `families`
     - `family_members`
     - `babies`
     - `activities`

## Get API Credentials

1. **Open Project Settings**
   - Click the gear icon (⚙️) in the bottom left
   - Select "API" from the settings menu

2. **Copy Your Credentials**
   You need two values:

   **Project URL:**
   - Found under "Project URL"
   - Looks like: `https://xyzcompany.supabase.co`
   - Copy this value

   **Anonymous (Public) Key:**
   - Found under "Project API keys"
   - Look for the `anon` / `public` key
   - It's a long JWT token starting with `eyJ...`
   - Copy this value

   ⚠️ **Important**: Do NOT use the `service_role` key in your client app. It bypasses Row Level Security and should only be used server-side.

## Configure Environment Variables

1. **Create .env File**
   ```bash
   # From your project root
   cp .env.example .env
   ```

2. **Add Your Credentials**
   Open `.env` and replace the placeholder values:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Restart Your Development Server**
   ```bash
   # Stop current server (Ctrl+C)
   # Start fresh
   npx expo start --clear
   ```

## Enable Real-Time Replication

Real-time is required for partners to see activity updates instantly.

1. **Go to Database Replication**
   - In Supabase dashboard, go to **Database** > **Replication**

2. **Enable Real-Time for Activities Table**
   - Find the `activities` table in the list
   - Toggle the switch to enable replication
   - You should see:
     - `INSERT` events: ✓ Enabled
     - `UPDATE` events: ✓ Enabled
     - `DELETE` events: ✓ Enabled

3. **Verify Real-Time is Active**
   - You should see "Realtime is enabled" badge next to the table

## Test Your Setup

### 1. Test Connection

Create a simple test file to verify your Supabase connection:

```typescript
// test-supabase.ts
import { supabase, isAuthenticated } from './src/lib/supabase';

async function testConnection() {
  console.log('Testing Supabase connection...');

  // Test 1: Can we connect?
  const { data, error } = await supabase.from('families').select('count');

  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('✓ Connection successful!');
  }

  // Test 2: Check authentication status
  const authenticated = await isAuthenticated();
  console.log('Authenticated:', authenticated);
}

testConnection();
```

Run it:
```bash
npx ts-node test-supabase.ts
```

### 2. Test Row Level Security (RLS)

1. **Sign Up a Test User**
   - Use your app's sign-up flow (once implemented)
   - Or use Supabase dashboard: **Authentication** > **Users** > **Add user**

2. **Verify RLS is Working**
   ```bash
   # In Supabase SQL Editor, run:
   SELECT * FROM families;
   ```
   - You should see no results (because you're not a member of any families yet)
   - This confirms RLS is working!

3. **Create a Test Family**
   ```sql
   -- This should work (you can create families)
   INSERT INTO families (name) VALUES ('Test Family');
   ```

4. **Verify Auto-Admin Assignment**
   ```sql
   -- Check you were automatically added as admin
   SELECT * FROM family_members WHERE user_id = auth.uid();
   ```
   - You should see one row with `role = 'admin'`

### 3. Test Real-Time Subscriptions

In your app, try the subscription example:

```typescript
import { subscribeToActivities } from '@/lib/sync';

// Subscribe to activities for a baby
const unsubscribe = subscribeToActivities(
  'baby-id-here',
  (activity) => console.log('New activity:', activity),
  (activity) => console.log('Updated activity:', activity),
  (id) => console.log('Deleted activity:', id)
);

// Later, cleanup
unsubscribe();
```

Open another device/browser with the same baby, log an activity, and verify you see the real-time update!

## Security Best Practices

### Environment Variables

✅ **DO:**
- Keep `.env` in `.gitignore` (already configured)
- Use different Supabase projects for development/production
- Rotate keys if they are ever exposed
- Use Expo Secrets for production builds

❌ **DON'T:**
- Commit `.env` to version control
- Share your `service_role` key
- Use the same project for dev and production
- Hardcode credentials in your code

### Row Level Security (RLS)

✅ **Verify RLS is enabled:**
```sql
-- Run in SQL Editor
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

✅ **Test RLS policies:**
```sql
-- Try to access another family's data (should fail)
SELECT * FROM babies WHERE family_id = 'some-other-family-id';
```

### Authentication

- Always check if user is authenticated before syncing
- Use `getCurrentUserId()` helper from `src/lib/supabase.ts`
- Handle auth errors gracefully in your UI

## Troubleshooting

### Problem: "Missing Supabase environment variables"

**Solution:**
1. Verify `.env` file exists in project root
2. Check variables are named correctly:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Restart Expo dev server with `--clear` flag

### Problem: "relation 'families' does not exist"

**Solution:**
1. Go to SQL Editor in Supabase
2. Re-run the `specs/database-schema.sql`
3. Verify tables appear in Table Editor

### Problem: Real-time updates not working

**Solution:**
1. Check real-time is enabled: **Database** > **Replication**
2. Verify `activities` table has replication enabled
3. Check browser console for subscription errors
4. Ensure you're subscribed to the correct `baby_id`

### Problem: "new row violates row-level security policy"

**Solution:**
This means you're trying to insert/update data you don't have access to.

1. Check you're authenticated: `await isAuthenticated()`
2. Verify you're a member of the family:
   ```sql
   SELECT * FROM family_members WHERE user_id = auth.uid();
   ```
3. Ensure the baby belongs to your family:
   ```sql
   SELECT * FROM babies b
   JOIN family_members fm ON fm.family_id = b.family_id
   WHERE fm.user_id = auth.uid();
   ```

### Problem: "Failed to sync activity"

**Solution:**
1. Check internet connection
2. Verify Supabase project is active (not paused)
3. Check browser console for detailed error
4. The activity is added to pending queue and will retry automatically

### Problem: Invite code not working

**Solution:**
1. Verify invite code is exactly 6 characters
2. Check it exists:
   ```sql
   SELECT * FROM families WHERE invite_code = 'ABC123';
   ```
3. Ensure user is authenticated before joining
4. Check for duplicate family membership (can't join same family twice)

## Next Steps

After completing this setup:

1. ✅ Supabase project created and configured
2. ✅ Database schema deployed
3. ✅ Environment variables set
4. ✅ Real-time enabled
5. ✅ Connection tested

**You're ready to:**
- Implement authentication screens
- Start syncing activities
- Test real-time partner sync
- Deploy to production

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-Time Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase JS Client Reference](https://supabase.com/docs/reference/javascript/introduction)

## Support

If you encounter issues not covered in this guide:

1. Check Supabase Dashboard logs: **Logs** > **API**
2. Review browser console for client-side errors
3. Check `specs/database-schema.sql` comments for context
4. Refer to `src/lib/sync.ts` for sync implementation details

---

**Summary:** You now have a fully configured Supabase backend with multi-tenant architecture, real-time sync, and robust security via RLS policies. The offline-first sync pattern ensures a smooth user experience even with spotty connectivity.
