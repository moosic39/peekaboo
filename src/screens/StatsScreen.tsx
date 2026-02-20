import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subDays, startOfDay } from 'date-fns';
import { useActivityStore } from '@/stores/activityStore';
import { Activity, ActivityType } from '@/types';
import { colors, activityColors, activityColorsBg, activityColorsBorder } from '@/constants/colors';

interface ActivityStats {
  feed: number;
  diaper: number;
  sleep: number;
  pump: number;
  growth: number;
  sleepMinutes: number;
}

function calculateStats(activities: Activity[], days: number = 1): ActivityStats {
  const cutoff = subDays(startOfDay(new Date()), days - 1);
  const filtered = activities.filter((a) => new Date(a.timestamp) >= cutoff);

  const stats: ActivityStats = {
    feed: 0,
    diaper: 0,
    sleep: 0,
    pump: 0,
    growth: 0,
    sleepMinutes: 0,
  };

  filtered.forEach((activity) => {
    stats[activity.type]++;

    if (activity.type === 'sleep' && 'duration' in activity.details && activity.details.duration) {
      stats.sleepMinutes += activity.details.duration;
    }
  });

  return stats;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

interface StatCardProps {
  icon: string;
  label: string;
  count: number;
  subtitle?: string;
  type: ActivityType;
}

function StatCard({ icon, label, count, subtitle, type }: StatCardProps) {
  const accentColor = activityColors[type];
  const bgColor = activityColorsBg[type];
  const borderColor = activityColorsBorder[type];

  return (
    <View style={[styles.statCard, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.statCardTop}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={[styles.statCount, { color: accentColor }]}>{count}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export default function StatsScreen() {
  const { activities } = useActivityStore();

  const todayStats = useMemo(() => calculateStats(activities, 1), [activities]);
  const weekStats = useMemo(() => calculateStats(activities, 7), [activities]);

  const todaySleepDuration = todayStats.sleepMinutes > 0 ? formatMinutes(todayStats.sleepMinutes) : undefined;
  const weekSleepDuration = weekStats.sleepMinutes > 0 ? formatMinutes(weekStats.sleepMinutes) : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Statistics</Text>
          <Text style={styles.subtitle}>Your baby's activity summary</Text>
        </View>

        <Text style={styles.sectionLabel}>Today</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="🍼" label="Feeds" count={todayStats.feed} type="feed" />
          <StatCard icon="🧷" label="Diapers" count={todayStats.diaper} type="diaper" />
          <StatCard icon="😴" label="Sleep" count={todayStats.sleep} subtitle={todaySleepDuration} type="sleep" />
          <StatCard icon="🍶" label="Pumps" count={todayStats.pump} type="pump" />
        </View>

        <Text style={styles.sectionLabel}>This Week</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="🍼" label="Feeds" count={weekStats.feed} type="feed" />
          <StatCard icon="🧷" label="Diapers" count={weekStats.diaper} type="diaper" />
          <StatCard icon="😴" label="Sleep" count={weekStats.sleep} subtitle={weekSleepDuration} type="sleep" />
          <StatCard icon="🍶" label="Pumps" count={weekStats.pump} type="pump" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 16,
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  statCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  statIcon: {
    fontSize: 28,
  },
  statCount: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
});
