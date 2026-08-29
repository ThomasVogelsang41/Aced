import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { CourseListItem } from '../../components/CourseListItem';
import { Colors, Spacing, Layout, BorderRadius, Typography } from '../../constants/theme';
import { useLocation } from '../../hooks/useLocation';
import { useNearestCourses } from '../../hooks/useNearestCourses';
import { useRoundStore } from '../../store/roundStore';
import { useAuthStore } from '../../store/authStore';
import { useBagStore } from '../../store/bagStore';
import type { Course } from '../../types/course';

export default function PlayScreen() {
  const { activeRound } = useRoundStore();
  const { user } = useAuthStore();
  const { getActiveBag } = useBagStore();
  const { latitude, longitude } = useLocation();
  const { data: nearbyCourses, isLoading } = useNearestCourses(latitude, longitude, 50);
  const [searchQuery, setSearchQuery] = useState('');

  // If there's an active round, show the resume banner
  if (activeRound) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.content}>
          <Typo variant="h2" style={styles.title}>Active Round</Typo>
          <View style={styles.activeCard}>
            <View style={styles.activeInfo}>
              <Ionicons name="disc" size={24} color={Colors.blue} />
              <View style={{ flex: 1 }}>
                <Typo variant="bodyMedium">{activeRound.round.courseName}</Typo>
                <Typo variant="small">
                  Hole {activeRound.currentHoleIndex + 1} of {activeRound.round.scores.length}
                </Typo>
              </View>
            </View>
            <Button
              label="Resume Round"
              variant="primary"
              size="md"
              fullWidth
              onPress={() =>
                router.push({
                  pathname: '/round/[id]',
                  params: { id: activeRound.round.id },
                })
              }
              style={styles.resumeBtn}
            />
          </View>
          <Typo variant="small" style={styles.orText}>— or start a new round —</Typo>
          <CourseList courses={nearbyCourses ?? []} isLoading={isLoading} />
        </View>
      </SafeAreaView>
    );
  }

  const filtered = searchQuery.trim()
    ? (nearbyCourses ?? []).filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : nearbyCourses ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Typo variant="h2" style={styles.title}>Play</Typo>
        <Typo variant="small" style={styles.subtitle}>Select a course to start your round</Typo>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter courses..."
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Typo variant="label" style={styles.sectionLabel}>
          {isLoading ? 'Finding nearby courses...' : `${filtered.length} Courses`}
        </Typo>

        {filtered.map((course) => (
          <CourseListItem
            key={course.id}
            course={course}
            onPress={() =>
              router.push({ pathname: '/course/[id]', params: { id: course.id } })
            }
          />
        ))}

        {!isLoading && filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={40} color={Colors.gray300} />
            <Typo variant="body" style={styles.emptyText}>No courses found nearby</Typo>
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CourseList: React.FC<{ courses: Course[]; isLoading: boolean }> = ({
  courses,
  isLoading,
}) => (
  <ScrollView showsVerticalScrollIndicator={false}>
    {isLoading && <ActivityIndicator color={Colors.blue} />}
    {courses.slice(0, 8).map((c) => (
      <CourseListItem
        key={c.id}
        course={c}
        onPress={() =>
          router.push({ pathname: '/course/[id]', params: { id: c.id } })
        }
      />
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing.base,
    paddingBottom: 32,
  },
  title: { marginBottom: 4 },
  subtitle: { color: Colors.secondaryText, marginBottom: Spacing.xl },
  activeCard: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  activeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  resumeBtn: { marginTop: Spacing.sm },
  orText: {
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.primaryBlack,
    padding: 0,
  },
  sectionLabel: { marginBottom: Spacing.md, color: Colors.secondaryText },
  empty: { alignItems: 'center', paddingTop: 48, gap: Spacing.sm },
  emptyText: { color: Colors.secondaryText },
});
