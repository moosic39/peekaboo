# Database Schema V2 - Enhanced Event Tracking & Growth Monitoring

## Overview

This enhanced schema is optimized for:
- **Complete event tracking** - Every activity is stored with full context
- **Time-series visualization** - Efficient queries for graphs and charts
- **Comprehensive growth tracking** - Dedicated table for weight, height, and head circumference
- **Real-time sync** - Live updates across devices
- **Analytics-ready** - Pre-built views for common queries

## Key Improvements

### 1. Enhanced Activities Table

**What Changed:**
- Added `notes` field for user annotations on any activity
- Added `updated_at` timestamp for tracking edits
- Added comprehensive indices for efficient querying and graphing
- GIN index on JSONB `details` for fast filtering

**Benefits:**
- Fast time-series queries for graphs (indexed by timestamp)
- Efficient filtering by activity type and baby
- Users can add context to any event

### 2. New Growth Measurements Table

**Why Separate Table:**
The dedicated `growth_measurements` table provides:
- Better performance for growth charts (no JSONB parsing)
- Decimal precision for medical accuracy (e.g., 3.45 kg, not rounded)
- Direct SQL queries for percentile calculations
- Easier integration with WHO growth standards

**Automatic Sync:**
- When you log a growth activity, it's automatically copied to `growth_measurements`
- Both tables stay in sync via database trigger
- You can query either table depending on your needs

**Fields:**
```sql
- weight (DECIMAL): kg with 2 decimal places (e.g., 3.45, 12.50)
- height (DECIMAL): cm with 2 decimal places (e.g., 50.5, 85.0)
- head_circumference (DECIMAL): cm with 2 decimal places (e.g., 35.5)
- measured_at: Exact timestamp of measurement
- notes: Optional notes (e.g., "measured at pediatrician")
```

### 3. Enhanced Babies Table

**New Fields:**
- `birth_weight`, `birth_height`, `birth_head_circumference` - Birth measurements for growth tracking baseline
- `gender` - For gender-specific growth charts (WHO standards differ by gender)
- `photo_url` - Baby profile picture
- `updated_at` - Track profile updates

### 4. Analytics Views

Pre-built database views for common queries:

#### `daily_activity_summary`
Aggregates activities by day for easy graphing:
```sql
SELECT * FROM daily_activity_summary
WHERE baby_id = '...' AND activity_date >= '2026-01-01'
ORDER BY activity_date;
```

#### `growth_trends`
Shows growth over time with changes between measurements:
```sql
SELECT * FROM growth_trends
WHERE baby_id = '...'
ORDER BY measured_at;
```

#### `feeding_stats`
Daily feeding statistics:
```sql
SELECT * FROM feeding_stats
WHERE baby_id = '...' AND feed_date = '2026-01-19';
```

#### `sleep_stats`
Daily sleep statistics:
```sql
SELECT * FROM sleep_stats
WHERE baby_id = '...' AND sleep_date = '2026-01-19';
```

### 5. Helper Functions

#### `baby_age_in_days(baby_id)`
Calculate baby's age in days from birth:
```sql
SELECT baby_age_in_days('baby-uuid-here');
-- Returns: 49 (days old)
```

#### `latest_growth_measurement(baby_id)`
Get most recent growth measurement:
```sql
SELECT * FROM latest_growth_measurement('baby-uuid-here');
```

#### `generate_invite_code()`
Generate unique 6-character family invite codes:
```sql
SELECT generate_invite_code();
-- Returns: 'A3F7K2'
```

## Data Model Diagrams

### Tables Relationship
```
families
  ├── babies (1-to-many)
  │   ├── activities (1-to-many)
  │   └── growth_measurements (1-to-many)
  └── family_members (many-to-many with users)
```

### Activity Storage Flow
```
User logs activity
    ↓
activities table (all events)
    ↓
IF type = 'growth' → Trigger copies to growth_measurements table
```

## Usage Examples

### 1. Log a Growth Measurement

**Option A: Via Activity (recommended for app)**
```typescript
await supabase.from('activities').insert({
  baby_id: 'baby-uuid',
  type: 'growth',
  timestamp: new Date().toISOString(),
  created_by: userId,
  details: {
    weight: 5.25,
    height: 62.5,
    headCircumference: 40.2
  },
  notes: 'Monthly checkup at pediatrician'
});
// Automatically syncs to growth_measurements via trigger
```

**Option B: Directly to Growth Measurements**
```typescript
await supabase.from('growth_measurements').insert({
  baby_id: 'baby-uuid',
  measured_at: new Date().toISOString(),
  weight: 5.25,
  height: 62.5,
  head_circumference: 40.2,
  notes: 'Monthly checkup',
  created_by: userId
});
```

### 2. Fetch Data for Growth Chart

```typescript
// Get all growth measurements for graphing
const { data: growthData } = await supabase
  .from('growth_measurements')
  .select('measured_at, weight, height, head_circumference')
  .eq('baby_id', babyId)
  .order('measured_at', { ascending: true });

// Use in chart library (e.g., Victory, Recharts)
const chartData = growthData.map(m => ({
  x: new Date(m.measured_at),
  weight: m.weight,
  height: m.height
}));
```

### 3. Get Daily Activity Summary

```typescript
// Get feeding frequency for the last 7 days
const { data: summary } = await supabase
  .from('daily_activity_summary')
  .select('*')
  .eq('baby_id', babyId)
  .eq('type', 'feed')
  .gte('activity_date', sevenDaysAgo)
  .order('activity_date', { ascending: true });

// Result: [{ activity_date: '2026-01-19', count: 8, ... }, ...]
```

### 4. Calculate Growth Rate

```typescript
// Get growth trends with automatic change calculations
const { data: trends } = await supabase
  .from('growth_trends')
  .select('*')
  .eq('baby_id', babyId)
  .order('measured_at', { ascending: true });

// Each row includes:
// - weight, height, head_circumference (current)
// - previous_weight, previous_height, etc.
// - weight_change, height_change (calculated)
```

### 5. Real-time Subscription

```typescript
// Subscribe to new activities
const subscription = supabase
  .channel('activities')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'activities',
    filter: `baby_id=eq.${babyId}`
  }, (payload) => {
    console.log('New activity:', payload.new);
  })
  .subscribe();

// Subscribe to growth measurements
const growthSub = supabase
  .channel('growth')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'growth_measurements',
    filter: `baby_id=eq.${babyId}`
  }, (payload) => {
    console.log('New measurement:', payload.new);
  })
  .subscribe();
```

## Performance Optimizations

### Indices Created
1. **Baby + Type + Timestamp** - Fast filtering for specific activity types
2. **Timestamp DESC** - Fast "recent activities" queries
3. **JSONB GIN** - Fast JSON field searches (e.g., `details->>'method' = 'breast'`)
4. **Growth measurements by date** - Fast time-series queries

### Query Performance Tips
1. **Use views for aggregations** - Pre-optimized queries
2. **Index baby_id filters** - All queries should filter by baby_id first
3. **Limit time ranges** - Always add date ranges for time-series data
4. **Use prepared statements** - Better performance for repeated queries

## Graph/Visualization Examples

### 1. Weight Growth Chart
```typescript
// Fetch data
const { data } = await supabase
  .from('growth_measurements')
  .select('measured_at, weight')
  .eq('baby_id', babyId)
  .not('weight', 'is', null)
  .order('measured_at');

// Chart configuration
<LineChart data={data}>
  <XAxis dataKey="measured_at" />
  <YAxis label="Weight (kg)" />
  <Line dataKey="weight" stroke="#5CB85C" />
</LineChart>
```

### 2. Daily Feeding Frequency
```typescript
const { data } = await supabase
  .from('daily_activity_summary')
  .select('activity_date, count')
  .eq('baby_id', babyId)
  .eq('type', 'feed')
  .gte('activity_date', lastWeek);

<BarChart data={data}>
  <XAxis dataKey="activity_date" />
  <YAxis label="Feeds per day" />
  <Bar dataKey="count" fill="#4A90D9" />
</BarChart>
```

### 3. Sleep Patterns (Heatmap)
```typescript
const { data } = await supabase
  .from('activities')
  .select('timestamp')
  .eq('baby_id', babyId)
  .eq('type', 'sleep')
  .gte('timestamp', lastMonth);

// Group by hour of day for heatmap
const heatmapData = groupByHourOfDay(data);
```

## Migration from V1

If you already have data in the old schema:

1. **Run schema V2** - Creates new tables and views
2. **Backfill growth measurements**:
```sql
INSERT INTO growth_measurements (baby_id, measured_at, weight, height, head_circumference, created_by)
SELECT
  baby_id,
  timestamp,
  (details->>'weight')::numeric,
  (details->>'height')::numeric,
  (details->>'headCircumference')::numeric,
  created_by
FROM activities
WHERE type = 'growth'
  AND (details->>'weight' IS NOT NULL
    OR details->>'height' IS NOT NULL
    OR details->>'headCircumference' IS NOT NULL);
```

3. **Verify** - Check counts match:
```sql
SELECT COUNT(*) FROM activities WHERE type = 'growth';
SELECT COUNT(*) FROM growth_measurements;
```

## Security (RLS Policies)

All tables have Row Level Security enabled:
- Users can only access families they belong to
- Users can only access babies in their families
- Users can only access activities for their babies
- Users can update/delete their own activities
- Admins can manage family settings and babies

## Real-time Features

Tables with real-time enabled:
- ✅ `activities` - Live activity updates
- ✅ `growth_measurements` - Live growth tracking

Partner sync works automatically - when one parent logs an activity, the other sees it instantly.

## Next Steps

1. **Deploy schema** - Run `database-schema-v2.sql` in Supabase SQL Editor
2. **Update app code** - Use new TypeScript types from `src/types/index.ts`
3. **Test growth tracking** - Verify measurements are stored correctly
4. **Build visualizations** - Use views for graphs
5. **Set up real-time** - Subscribe to activity changes

## Questions?

See:
- `database-schema-v2.sql` - Full SQL schema
- `src/types/index.ts` - TypeScript type definitions
- Supabase docs: https://supabase.com/docs
