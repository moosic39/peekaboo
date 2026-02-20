import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { TimelineItem } from '@/components/TimelineItem';
import { useActivityStore } from '@/stores/activityStore';
import { Activity } from '@/types';
import { colors } from '@/constants/colors';

interface ActivitySection {
  title: string;
  data: Activity[];
}

function groupActivitiesByDate(activities: Activity[]): ActivitySection[] {
  const groups = new Map<string, Activity[]>();

  activities.forEach((activity) => {
    const dateKey = format(startOfDay(new Date(activity.timestamp)), 'yyyy-MM-dd');
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(activity);
  });

  const sections = Array.from(groups.entries()).map(([dateKey, data]) => {
    const date = new Date(dateKey);
    let title: string;

    if (isToday(date)) {
      title = 'Today';
    } else if (isYesterday(date)) {
      title = 'Yesterday';
    } else {
      title = format(date, 'EEEE, MMMM d');
    }

    data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { title, data };
  });

  sections.sort((a, b) => {
    const dateA = new Date(a.data[0].timestamp);
    const dateB = new Date(b.data[0].timestamp);
    return dateB.getTime() - dateA.getTime();
  });

  return sections;
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No activities yet</Text>
      <Text style={styles.emptySubtitle}>Activities you log will appear here</Text>
    </View>
  );
}

export default function TimelineScreen() {
  const { activities, deleteActivity } = useActivityStore();

  const sections = useMemo(
    () => groupActivitiesByDate(activities),
    [activities]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Timeline</Text>
        <Text style={styles.subtitle}>Activity history</Text>
      </View>
      {sections.length === 0 ? (
        <EmptyState />
      ) : (
        <SectionList
          sections={sections}
          renderSectionHeader={({ section }) => (
            <View style={styles.dateHeaderRow}>
              <Text style={styles.dateHeader}>{section.title}</Text>
              <View style={styles.dateDivider} />
            </View>
          )}
          renderItem={({ item }) => (
            <TimelineItem
              activity={item}
              onLongPress={() => deleteActivity(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    gap: 12,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  dateDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
