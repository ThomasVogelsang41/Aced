import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Divider } from '../../components/ui/Divider';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useRoundStore } from '../../store/roundStore';
import { useAuthStore } from '../../store/authStore';
import { useBags } from '../../hooks/useBag';
import { getCourse } from '../../lib/discgolfapi';
import type { Course } from '../../types/course';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { startRound } = useRoundStore();
  const { user } = useAuthStore();
  const { data: bags } = useBags(user?.id ?? null);

  const { data: course, isLoading } = useQuery<Course | null>({
    queryKey: ['course', id],
    queryFn: () => getCourse(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingCenter}>
          <Typo variant="body">Course not found.</Typo>
          <Button label="Go Back" variant="ghost" size="md" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  function handleStartRound() {
    const defaultBag = bags?.find((b) => b.isDefault) ?? bags?.[0];
    const roundId = startRound(course!, undefined, [], defaultBag?.id);
    router.push({ pathname: '/round/[id]', params: { id: roundId } });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primaryBlack} />
          <Typo variant="bodyMedium">Courses</Typo>
        </TouchableOpacity>

        {/* Course header */}
        <View style={styles.header}>
          <Typo variant="h1" style={styles.courseName}>{course.name}</Typo>
          <Typo variant="body" style={styles.location}>
            {course.city}, {course.state}
            {course.country !== 'US' ? `, ${course.country}` : ''}
          </Typo>
          <View style={styles.badges}>
            <Badge label={`${course.holeCount} holes`} variant="blue" />
            {course.status && (
              <Badge
                label={course.status === 'closed' ? 'Closed' : 'Open'}
                variant={course.status === 'closed' ? 'orange' : 'green'}
              />
            )}
          </View>
        </View>

        <Divider marginVertical={16} />

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <InfoRow icon="map-outline" label="Location" value={`${course.city}, ${course.state}`} />
          <InfoRow icon="disc-outline" label="Holes" value={String(course.holeCount)} />
          {course.distanceMiles !== undefined && (
            <InfoRow
              icon="navigate-outline"
              label="Distance"
              value={`${course.distanceMiles < 10 ? course.distanceMiles.toFixed(1) : Math.round(course.distanceMiles)} miles away`}
            />
          )}
        </View>

        <Divider marginVertical={16} />

        {/* GPS note */}
        <View style={styles.gpsNote}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.secondaryText} />
          <Typo variant="small" style={styles.gpsNoteText}>
            GPS hole distances are available for courses with ACED-verified layouts. Distances for unverified courses use hole estimates.
          </Typo>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Sticky start round */}
      <View style={styles.stickyBottom}>
        <Button
          label="Start Round Here"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleStartRound}
          icon={<Ionicons name="play" size={18} color={Colors.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon as React.ComponentProps<typeof Ionicons>['name']} size={18} color={Colors.secondaryText} />
    <View style={{ flex: 1 }}>
      <Typo variant="caption">{label}</Typo>
      <Typo variant="bodyMedium">{value}</Typo>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { padding: Spacing['2xl'], paddingBottom: 120 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  header: { gap: Spacing.sm, marginBottom: Spacing.sm },
  courseName: { lineHeight: 36 },
  location: { color: Colors.secondaryText },
  badges: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  infoGrid: { gap: Spacing.base },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  gpsNote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gpsNoteText: { flex: 1, color: Colors.secondaryText },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing['2xl'],
    paddingBottom: 36,
  },
});
