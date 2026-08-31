import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Divider } from '../../components/ui/Divider';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useRoundStore } from '../../store/roundStore';
import { useAuthStore } from '../../store/authStore';
import { useBags } from '../../hooks/useBag';
import { getCourse } from '../../lib/discgolfapi';
import { DiscSpinner } from '../../components/ui/DiscSpinner';
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
          <DiscSpinner label="Loading course details..." size={44} />
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
        {/* Subtle Data Attribution */}
        <TouchableOpacity
          style={styles.attributionBox}
          activeOpacity={0.7}
          onPress={() => Linking.openURL('https://discgolfapi.com')}
        >
          <Typo variant="caption" style={styles.attributionText}>
            Course data supplied by DiscGolfAPI.
          </Typo>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    <Ionicons name={icon as any} size={18} color={Colors.gray500} />
    <Typo variant="body" style={styles.infoLabel}>{label}</Typo>
    <Typo variant="bodyMedium" style={styles.infoValue}>{value}</Typo>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  header: { gap: 6 },
  courseName: { fontFamily: Typography.fontFamily.bold },
  location: { color: Colors.secondaryText },
  badges: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  infoGrid: { gap: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoLabel: { flex: 1, color: Colors.secondaryText },
  infoValue: { fontFamily: Typography.fontFamily.medium },
  gpsNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.backgroundSoft,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  gpsNoteText: { flex: 1, color: Colors.secondaryText },
  attributionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  attributionText: {
    color: Colors.gray400,
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  stickyBottom: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },
});
