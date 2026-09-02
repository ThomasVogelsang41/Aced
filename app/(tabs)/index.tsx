import React, { useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typo } from '../../components/ui/Typography';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from '../../hooks/useLocation';
import { useWeather } from '../../hooks/useWeather';
import { degreesToCardinal } from '../../lib/openmeteo';
import { useNearestCourses } from '../../hooks/useNearestCourses';
import { TabHeader } from '../../components/TabHeader';
import { AnimatedFadeIn } from '../../components/ui/AnimatedFadeIn';
import { RealisticDiscArtwork } from '../../components/ui/RealisticDiscArtwork';
import { useRoundStore } from '../../store/roundStore';
import { Course } from '../../types/course';

function getWeatherIconName(code?: number): React.ComponentProps<typeof Ionicons>['name'] {
  if (code === undefined) return 'sunny-outline';
  if (code === 0 || code === 1) return 'sunny-outline';
  if (code === 2 || code === 3) return 'cloudy-outline';
  if (code >= 45 && code <= 48) return 'cloud-outline';
  if (code >= 51 && code <= 67) return 'rainy-outline';
  if (code >= 71 && code <= 77) return 'snow-outline';
  if (code >= 80 && code <= 82) return 'rainy-outline';
  if (code >= 95) return 'thunderstorm-outline';
  return 'sunny-outline';
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { latitude, longitude } = useLocation();
  const { data: weather } = useWeather(latitude, longitude);
  const { activeRound, course: activeCourse } = useRoundStore();
  const [homeCardJoined, setHomeCardJoined] = useState(false);

  const activeScores = activeRound?.round?.scores ?? [];
  const recordedScores = activeScores.filter((s) => s.strokes > 0);
  const hasActiveRound = activeRound !== null && recordedScores.length > 0;

  const totalStrokes = recordedScores.reduce((acc, curr) => acc + curr.strokes, 0);
  const totalPar = recordedScores.reduce((acc, curr) => acc + curr.par, 0);
  const scoreDiff = totalStrokes - totalPar;
  const scoreFormatted = scoreDiff === 0 ? 'E' : scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`;

  const { data: nearbyCourses } = useNearestCourses(latitude, longitude);

  const userName = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Ricky';
  const displayCourses = (nearbyCourses ?? []).slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Uniform Top Header with ACED Wordmark Logo */}
        <AnimatedFadeIn delay={0}>
          <TabHeader showLogo subtitle="Welcome back," title={userName} />
        </AnimatedFadeIn>

        {/* Start Round Primary CTA */}
        <AnimatedFadeIn delay={100}>
          <TouchableOpacity
            style={styles.startRoundCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/play')}
          >
            <View style={styles.plusCircle}>
              <Ionicons name="add" size={24} color={Colors.white} />
            </View>
            <View style={styles.startRoundText}>
              <Typo variant="h3" style={styles.startTitle}>Start round</Typo>
              <Typo variant="small" style={styles.startSub}>Let's play.</Typo>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        </AnimatedFadeIn>

        {/* Nearby Courses Header */}
        <AnimatedFadeIn delay={180}>
          <View style={styles.sectionHeader}>
            <Typo variant="label" style={styles.sectionTitle}>NEARBY COURSES</Typo>
            <TouchableOpacity onPress={() => router.push('/(tabs)/courses')}>
              <Typo variant="small" style={styles.seeAll}>See all</Typo>
            </TouchableOpacity>
          </View>

          {/* Horizontal Nearby Courses Scroll — Immediate Instant Rendering */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {displayCourses.map((course: Course) => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCardRow}
                activeOpacity={0.88}
                onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })}
              >
                <View style={styles.courseRowBody}>
                  <View style={styles.courseRowTop}>
                    <Typo style={styles.courseName} numberOfLines={1} ellipsizeMode="tail">
                      {course.name}
                    </Typo>
                    {course.distanceMiles !== undefined && (
                      <View style={styles.distBadgeInline}>
                        <Typo style={styles.distText}>
                          {course.distanceMiles.toFixed(1)} mi
                        </Typo>
                      </View>
                    )}
                  </View>
                  <View style={styles.courseRowBottom}>
                    <Typo style={styles.courseHoles} numberOfLines={1} ellipsizeMode="tail">
                      {course.holeCount} Holes • {course.state ? `${course.city}, ${course.state}` : course.city}
                    </Typo>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </AnimatedFadeIn>

        {/* Recent Round Card */}
        <AnimatedFadeIn delay={260}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => router.push('/(tabs)/profile')}>
            <Typo variant="label" style={styles.sectionTitle}>RECENT ROUND</Typo>
            <Ionicons name="chevron-forward" size={18} color={Colors.primaryBlack} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recentRoundCard}
            activeOpacity={0.88}
            onPress={() => {
              if (activeRound) {
                router.push({ pathname: '/round/[id]', params: { id: activeRound.round?.id ?? '1' } });
              } else {
                router.push('/(tabs)/profile');
              }
            }}
          >
            <View style={styles.recentTop}>
              <View style={styles.scoreGaugeCircle}>
                <Typo variant="h2" style={styles.scoreGaugeText}>
                  {hasActiveRound ? scoreFormatted : '-4'}
                </Typo>
                <Typo variant="caption" style={styles.scoreGaugeSub}>
                  {hasActiveRound ? (scoreDiff < 0 ? 'UNDER' : scoreDiff > 0 ? 'OVER' : 'PAR') : 'UNDER'}
                </Typo>
              </View>
              <View style={styles.recentInfo}>
                <Typo variant="bodyMedium" style={styles.recentCourse}>
                  {hasActiveRound ? (activeCourse?.name ?? 'Active Round') : (displayCourses[0]?.name ?? 'Maple Hill DGC')}
                </Typo>
                <Typo variant="small" style={styles.recentDate}>
                  {hasActiveRound ? `Hole ${activeRound?.currentHoleIndex! + 1} of 18 • In Progress` : 'May 18, 2025'}
                </Typo>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Typo variant="caption" style={styles.statLabel}>SCORE</Typo>
                <Typo variant="bodyMedium" style={styles.statVal}>
                  {hasActiveRound ? totalStrokes : 54}
                </Typo>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Typo variant="caption" style={styles.statLabel}>ROUND RATING</Typo>
                <Typo variant="bodyMedium" style={styles.statVal}>1020</Typo>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Typo variant="caption" style={styles.statLabel}>FAIRWAYS</Typo>
                <Typo variant="bodyMedium" style={styles.statVal}>71%</Typo>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Typo variant="caption" style={styles.statLabel}>C1X</Typo>
                <Typo variant="bodyMedium" style={styles.statVal}>4</Typo>
              </View>
            </View>
          </TouchableOpacity>
        </AnimatedFadeIn>



        {/* Split Bottom Grid: Weather & Wind | Create or Join Open Cards */}
        <AnimatedFadeIn delay={250}>
          <View style={styles.bottomGrid}>
            {/* Weather Card */}
            <View style={styles.gridCard}>
              <Typo variant="caption" style={styles.cardHeaderTitle}>WEATHER & WIND</Typo>
              <View style={styles.tempRow}>
                <Ionicons
                  name={getWeatherIconName(weather?.weatherCode)}
                  size={30}
                  color={Colors.primaryBlack}
                />
                <View>
                  <Typo variant="display" style={styles.tempNum}>
                    {weather ? `${weather.temperature}°` : '72°'}
                  </Typo>
                  <Typo variant="caption" style={styles.weatherSub} numberOfLines={1}>
                    {weather ? weather.description : 'Clear sky'}
                  </Typo>
                </View>
              </View>
              <View style={styles.windFooter}>
                <Typo variant="caption" style={styles.windLabel}>WIND</Typo>
                <View style={styles.windValRow}>
                  <Ionicons
                    name="navigate-outline"
                    size={13}
                    color={Colors.primaryBlack}
                    style={{ transform: [{ rotate: `${weather?.windDirection ?? 315}deg` }] }}
                  />
                  <Typo variant="caption" style={styles.windVal}>
                    {weather
                      ? `${weather.windSpeed} mph ${degreesToCardinal(weather.windDirection)}`
                      : '8 mph NW'}
                  </Typo>
                </View>
              </View>
            </View>

            {/* Create or Join Open Cards Card */}
            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.88}
              onPress={() => router.push('/(tabs)/openplay')}
            >
              <Typo variant="caption" style={styles.cardHeaderTitle}>OPEN CARDS</Typo>
              <View style={styles.openCardGridContent}>
                <View style={styles.flameIconCircle}>
                  <Ionicons name="flame" size={20} color={Colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typo variant="bodyMedium" style={{ fontWeight: 'bold', fontSize: 12, lineHeight: 16 }}>
                    Create or Join Open Cards
                  </Typo>
                  <Typo variant="caption" style={{ color: Colors.secondaryText, marginTop: 2, fontSize: 10 }}>
                    3 Open Cards near you
                  </Typo>
                </View>
              </View>
              <View style={styles.bagLinkRow}>
                <Typo variant="caption" style={styles.bagLinkText}>Open Play →</Typo>
                <Ionicons name="chevron-forward" size={12} color={Colors.blue} />
              </View>
            </TouchableOpacity>
          </View>
        </AnimatedFadeIn>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 32 },

  // Primary CTA
  startRoundCard: {
    backgroundColor: Colors.blue,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    ...Shadows.md,
  },
  plusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryBlack,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  startRoundText: { flex: 1 },
  startTitle: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.lg,
  },
  startSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Typography.size.sm,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.base,
  },
  sectionTitle: {
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 0.8,
    fontSize: Typography.size.xs,
  },
  seeAll: { color: Colors.blue, fontFamily: Typography.fontFamily.medium },

  // Horizontal Scroll Courses — Sleek Card Rows
  horizontalScroll: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingRight: Spacing.lg,
  },
  courseCardRow: {
    width: 240,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    minHeight: 72,
    justifyContent: 'center',
    ...Shadows.sm,
  },
  courseRowBody: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  courseRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  courseRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  distBadgeInline: {
    flexShrink: 0,
    backgroundColor: 'rgba(9, 9, 10, 0.85)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  distText: { color: Colors.white, fontSize: 9, fontFamily: Typography.fontFamily.bold },
  courseName: {
    flex: 1,
    fontFamily: Typography.fontFamily.bold,
    fontSize: 13,
    color: Colors.primaryBlack,
  },
  courseHoles: {
    flex: 1,
    color: Colors.secondaryText,
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
  },
  ratingRow: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: { fontFamily: Typography.fontFamily.bold, fontSize: 11, color: Colors.primaryBlack },

  // Recent Round
  recentRoundCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  recentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scoreGaugeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreGaugeText: { fontFamily: Typography.fontFamily.extraBold, color: Colors.primaryBlack, fontSize: 24 },
  scoreGaugeSub: { fontSize: 8, fontFamily: Typography.fontFamily.bold, color: Colors.secondaryText, marginTop: -2 },
  recentInfo: { flex: 1 },
  recentCourse: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.lg },
  recentDate: { color: Colors.secondaryText },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 9, color: Colors.secondaryText, fontFamily: Typography.fontFamily.medium, marginBottom: 2 },
  statVal: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base, color: Colors.primaryBlack },
  statDivider: { width: 1, height: 24, backgroundColor: Colors.border },

  // Split Grid
  bottomGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    justifyContent: 'space-between',
    minHeight: 148,
    ...Shadows.sm,
  },
  cardHeaderTitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.secondaryText,
    letterSpacing: 0.5,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: 4,
  },
  tempNum: { fontSize: 32, fontFamily: Typography.fontFamily.bold, lineHeight: 36 },
  weatherSub: { color: Colors.secondaryText, fontSize: Typography.size.xs },
  windFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  windLabel: { fontSize: 10, color: Colors.secondaryText },
  windValRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  windVal: { fontFamily: Typography.fontFamily.semiBold, fontSize: 11 },

  bagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  discCountNum: { fontSize: 32, fontFamily: Typography.fontFamily.bold, lineHeight: 36 },
  discGraphic: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discBrandText: { fontSize: 7, color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' },
  discNameText: { fontSize: 10, color: Colors.white, fontWeight: 'bold' },
  bagLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  bagLinkText: { color: Colors.blue, fontFamily: Typography.fontFamily.semiBold, fontSize: 11 },

  seeAllText: { fontSize: 12, fontWeight: 'bold', color: Colors.blue },

  openCardGridContent: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  flameIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryBlack, alignItems: 'center', justifyContent: 'center' },

  // PLAY Bar & Open Cards Styles
  playBarCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginVertical: 4,
    ...Shadows.sm,
  },
  playBarHeaderLabel: { fontSize: 10, color: Colors.secondaryText, fontWeight: 'bold', letterSpacing: 0.8 },
  playBarButtonsRow: { flexDirection: 'row', gap: 8 },
  playBarBtn: {
    flex: 1.2,
    height: 44,
    backgroundColor: Colors.primaryBlack,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  playBarBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 12 },
  playBarBtnSecondary: {
    flex: 1,
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playBarBtnTextSecondary: { color: Colors.primaryBlack, fontWeight: 'bold', fontSize: 12 },

  featuredOpenCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    gap: 10,
    marginVertical: 4,
    ...Shadows.sm,
  },
  featuredCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skinsBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  skinsBadgeText: { color: '#D97706', fontSize: 11, fontWeight: 'bold' },
  featuredCourseTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.primaryBlack },
  featuredPlayersRow: { flexDirection: 'row', alignItems: 'center' },
  avatarsRow: { flexDirection: 'row' },
  avatarDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  avatarDotText: { color: Colors.white, fontWeight: 'bold', fontSize: 11 },
  joinBtnSmall: { backgroundColor: Colors.primaryBlack, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.lg },
  joinBtnSmallJoined: { backgroundColor: Colors.backgroundSoft, borderWidth: 1, borderColor: Colors.border },
  joinBtnSmallText: { color: Colors.white, fontWeight: 'bold', fontSize: 11 },
  joinBtnSmallTextJoined: { color: Colors.primaryBlack },

  quickCardsList: { borderTopWidth: 1, borderTopColor: Colors.backgroundSoft, paddingTop: 8, gap: 6 },
  quickCardItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quickCardText: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.primaryBlack, marginLeft: 6 },
  spotsTag: { backgroundColor: Colors.backgroundSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  spotsTagText: { fontSize: 10, color: Colors.secondaryText, fontWeight: 'bold' },
});
