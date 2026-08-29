import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typo } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { WeatherBanner } from '../../components/WeatherBanner';
import { CourseListItem } from '../../components/CourseListItem';
import { Colors, Spacing, Layout, BorderRadius } from '../../constants/theme';
import { useLocation } from '../../hooks/useLocation';
import { useWeather } from '../../hooks/useWeather';
import { useNearestCourses } from '../../hooks/useNearestCourses';
import { useRoundHistory } from '../../hooks/useRound';
import { useAuthStore } from '../../store/authStore';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { latitude, longitude, isLoading: locLoading } = useLocation();
  const { data: weather } = useWeather(latitude, longitude);
  const { data: nearbyCourses, isLoading: coursesLoading, refetch } = useNearestCourses(latitude, longitude, 30);
  const { data: rounds } = useRoundHistory(user?.id ?? null);

  const displayName = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Golfer';
  const recentRounds = rounds?.slice(0, 3) ?? [];

  const totalRounds = rounds?.length ?? 0;
  const avgVsPar =
    rounds && rounds.length > 0
      ? (
          rounds.reduce((acc: number, r: Record<string, unknown>) => {
            const score = Number(r.total_score ?? 0);
            const par = Number(r.total_par ?? 0);
            return acc + (par > 0 ? score - par : 0);
          }, 0) / rounds.length
        ).toFixed(1)
      : '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={coursesLoading} onRefresh={refetch} tintColor={Colors.blue} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Typo variant="small" style={styles.greeting}>Good throw,</Typo>
            <Typo variant="h2">{displayName} 👋</Typo>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person-circle-outline" size={32} color={Colors.primaryBlack} />
          </TouchableOpacity>
        </View>

        {/* Quick action */}
        <Button
          label="Start a Round"
          variant="primary"
          size="lg"
          fullWidth
          icon={<Ionicons name="play" size={18} color={Colors.white} />}
          onPress={() => router.push('/(tabs)/play')}
          style={styles.startBtn}
        />

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <StatCard label="Rounds" value={String(totalRounds)} />
          <StatCard label="Avg vs Par" value={avgVsPar === '—' ? '—' : `${Number(avgVsPar) > 0 ? '+' : ''}${avgVsPar}`} />
          <StatCard label="Aces" value="0" />
        </View>

        {/* Weather */}
        {weather && (
          <View style={styles.section}>
            <Typo variant="label" style={styles.sectionLabel}>Current Conditions</Typo>
            <WeatherBanner weather={weather} />
          </View>
        )}

        {/* Nearby courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typo variant="label" style={styles.sectionLabel}>Nearby Courses</Typo>
            <TouchableOpacity onPress={() => router.push('/(tabs)/courses')}>
              <Typo variant="small" style={styles.seeAll}>See all</Typo>
            </TouchableOpacity>
          </View>
          {locLoading && (
            <Typo variant="small" style={styles.loading}>Finding your location...</Typo>
          )}
          {!locLoading && (!nearbyCourses || nearbyCourses.length === 0) && (
            <Card>
              <Typo variant="small" style={styles.emptyText}>No courses found nearby.</Typo>
            </Card>
          )}
          {(nearbyCourses ?? []).slice(0, 5).map((course) => (
            <CourseListItem
              key={course.id}
              course={course}
              onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })}
            />
          ))}
        </View>

        {/* Recent rounds */}
        {recentRounds.length > 0 && (
          <View style={styles.section}>
            <Typo variant="label" style={styles.sectionLabel}>Recent Rounds</Typo>
            {recentRounds.map((round: Record<string, unknown>) => (
              <Card key={round.id as string} style={styles.roundCard}>
                <Typo variant="bodyMedium">{round.course_name as string}</Typo>
                <View style={styles.roundMeta}>
                  <Typo variant="small">
                    {new Date(round.started_at as string).toLocaleDateString()}
                  </Typo>
                  <Typo variant="bodyMedium" style={styles.roundScore}>
                    {round.total_score !== null
                      ? `${Number(round.total_score) - Number(round.total_par ?? 0) >= 0 ? '+' : ''}${Number(round.total_score) - Number(round.total_par ?? 0)}`
                      : '—'}
                  </Typo>
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.statCard}>
    <Typo variant="h3" style={styles.statValue}>{value}</Typo>
    <Typo variant="caption">{label}</Typo>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Layout.screenPaddingH, paddingTop: Spacing.base },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: { color: Colors.secondaryText, marginBottom: 2 },
  settingsBtn: { padding: 4 },
  startBtn: { marginBottom: Spacing.xl },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { color: Colors.primaryBlack },
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionLabel: { marginBottom: Spacing.sm },
  seeAll: { color: Colors.blue },
  loading: { color: Colors.secondaryText },
  emptyText: { color: Colors.secondaryText },
  roundCard: { marginBottom: Spacing.sm },
  roundMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  roundScore: { color: Colors.primaryBlack },
  bottomPad: { height: 32 },
});
