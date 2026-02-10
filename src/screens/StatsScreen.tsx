import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subDays, startOfDay } from 'date-fns';
import { useActivityStore } from '@/stores/activityStore';
import { Activity, ActivityType } from '@/types';
import { colors } from '@/constants/colors';

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
  color: string;
}

function StatCard({ icon, label, count, subtitle, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statCount}>{count}</Text>
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
        <Text style={styles.title}>Statistics</Text>

        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="🍼"
            label="Feeds"
            count={todayStats.feed}
            color={colors.feed}
          />
          <StatCard
            icon="🧷"
            label="Diapers"
            count={todayStats.diaper}
            color={colors.diaper}
          />
          <StatCard
            icon="😴"
            label="Sleep"
            count={todayStats.sleep}
            subtitle={todaySleepDuration}
            color={colors.sleep}
          />
          <StatCard
            icon="🍶"
            label="Pumps"
            count={todayStats.pump}
            color={colors.pump}
          />
        </View>

        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="🍼"
            label="Feeds"
            count={weekStats.feed}
            color={colors.feed}
          />
          <StatCard
            icon="🧷"
            label="Diapers"
            count={weekStats.diaper}
            color={colors.diaper}
          />
          <StatCard
            icon="😴"
            label="Sleep"
            count={weekStats.sleep}
            subtitle={weekSleepDuration}
            color={colors.sleep}
          />
          <StatCard
            icon="🍶"
            label="Pumps"
            count={weekStats.pump}
            color={colors.pump}
          />
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
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
