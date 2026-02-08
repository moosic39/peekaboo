# Database Reset Guide

This guide explains how to reset your Supabase database and set up the V2 schema.

## ⚠️ WARNING

**This will DELETE ALL DATA in your Peekaboo database!**

Only run this if you want to:
- Start fresh with the V2 schema
- Fix database issues (like the infinite recursion bug)
- Switch from V1 to V2 schema

## 📋 What the Reset Script Does

The `specs/database-reset.sql` script will:

1. **Drop all existing objects** (in safe order):
   - Views
   - Triggers
   - Functions
   - Tables
   - Policies

2. **Set up V2 schema** with:
   - Core tables: `families`, `babies`, `family_members`, `activities`, `growth_measurements`
   - Analytics views: `daily_activity_summary`, `growth_trends`, `feeding_stats`, `sleep_stats`
   - Helper functions (including RLS recursion fix)
   - Row Level Security policies
   - Real-time subscriptions
   - Triggers for automatic updates

## 🚀 How to Run the Reset

### Step 1: Backup Your Data (Optional)

If you have existing data you want to save:

1. Go to **Supabase Dashboard** → **Table Editor**
2. Export each table to CSV
3. Save the files locally

### Step 2: Run the Reset Script

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your **Peekaboo project**
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `/home/dev/Documents/peekaboo/specs/database-reset.sql`
6. Paste into the SQL Editor
7. Click **Run** or press `Ctrl+Enter`

### Step 3: Verify the Reset

You should see success messages like:

```
✓ All tables, views, functions, and triggers dropped successfully!
Now setting up V2 schema...
✅ Database reset complete!
✅ V2 schema installed successfully!
```

### Step 4: Test the Connection

Run the test script from your project directory:

```bash
node test-connection.js
```

You should see all green checkmarks:

```
✓ Environment variables loaded
✓ Supabase client initialized
✓ Families table accessible
✓ Babies table accessible
✓ Activities table accessible
✓ Family_members table accessible
✅ Connection test complete!
```

## 🔍 What's Different in V2

The V2 schema includes several enhancements:

### New Tables
- **`growth_measurements`**: Dedicated table for tracking baby growth over time
  - Separates growth data for better analytics
  - Supports weight, height, and head circumference
  - Auto-synced from activity logs

### New Views
- **`daily_activity_summary`**: Daily counts per activity type
- **`growth_trends`**: Growth changes over time
- **`feeding_stats`**: Feeding patterns and amounts
- **`sleep_stats`**: Sleep session statistics

### Enhanced Features
- **Birth details**: Added to babies table (birth_weight, birth_height, etc.)
- **Better gender options**: More inclusive choices
- **Photo support**: Photo URL field for baby profiles
- **Notes field**: All activities can have optional notes
- **Trigger sync**: Growth activities auto-populate growth_measurements

### Fixed Issues
- **RLS infinite recursion**: Fixed with `user_is_in_family()` SECURITY DEFINER function
- **Better indexes**: Optimized for common queries
- **Cleaner policies**: More consistent and easier to understand

## 🐛 Troubleshooting

### Error: "relation already exists"

This means some objects weren't dropped. The script has error handling for this - just run it again.

### Error: "permission denied"

Make sure you're using the **Service Role Key** in the SQL Editor, not the anon key.

### Tables exist but queries fail

Check if RLS is enabled and policies are created:

```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies
WHERE schemaname = 'public';
```

### Need to rollback to V1

If you need to go back to V1:

1. Run the reset script again
2. Then run `specs/database-schema.sql` (V1) instead
3. Make sure it has the RLS fix applied

## 📚 Related Documentation

- **V2 Schema**: `specs/database-schema-v2.sql`
- **V1 Schema**: `specs/database-schema.sql`
- **Setup Guide**: `docs/SUPABASE-SETUP.md`
- **Quick Fix**: `specs/fix-rls-policies.sql` (for V1 only)

## 💡 Tips

- **Run during development**: It's safe to reset often during development
- **Test with sample data**: Add sample data after reset to test your app
- **Real-time subscriptions**: Make sure they're enabled after reset
- **Use transactions**: Wrap in BEGIN/COMMIT if you want to test first

```sql
BEGIN;
-- Paste reset script here
-- Check results
-- ROLLBACK; -- or COMMIT;
```

## 🎯 After Reset

Once your database is reset with V2 schema:

1. **Test the connection**: `node test-connection.js`
2. **Create test data**: Add a family, baby, and some activities
3. **Test real-time**: Try the app with two devices/tabs
4. **Check analytics views**: Query the new views for stats

## 📞 Need Help?

If you encounter issues:

1. Check Supabase logs: **Dashboard** → **Logs** → **Postgres Logs**
2. Review the error message carefully
3. Make sure your `.env` file has correct credentials
4. Try running individual sections of the script

---

**Ready to reset?** Just run `specs/database-reset.sql` in your Supabase SQL Editor!
