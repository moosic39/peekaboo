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

  // Group activities by date
  activities.forEach((activity) => {
    const dateKey = format(startOfDay(new Date(activity.timestamp)), 'yyyy-MM-dd');
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(activity);
  });

  // Convert to sections with formatted titles
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

    // Sort activities within section by timestamp (newest first)
    data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { title, data };
  });

  // Sort sections by date (newest first)
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
      <Text style={styles.title}>Timeline</Text>
      {sections.length === 0 ? (
        <EmptyState />
      ) : (
        <SectionList
          sections={sections}
          renderSectionHeader={({ section }) => (
            <Text style={styles.dateHeader}>{section.title}</Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
