import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typo } from '../../components/ui/Typography';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from '../../hooks/useLocation';
import { useWeather } from '../../hooks/useWeather';
import { TabHeader } from '../../components/TabHeader';
import { AnimatedFadeIn } from '../../components/ui/AnimatedFadeIn';

// Demo course images for rich visuals matching mockups
const MOCK_COURSES = [
  {
    id: 'maple-hill',
    name: 'Maple Hill DGC',
    holes: 18,
    par: 58,
    rating: 4.7,
    distance: '2.1 mi',
    image: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'pine-ridge',
    name: 'Pine Ridge DGC',
    holes: 18,
    par: 59,
    rating: 4.6,
    distance: '3.4 mi',
    image: 'https://images.unsplash.com/photo-1511497584788-876761465087?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'oak-grove',
    name: 'Oak Grove DGC',
    holes: 18,
    par: 60,
    rating: 4.5,
    distance: '5.8 mi',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=80',
  },
];

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { latitude, longitude } = useLocation();
  const { data: weather } = useWeather(latitude, longitude);

  const userName = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Ricky';

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

          {/* Horizontal Nearby Courses Scroll — Sleek Single Line */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {MOCK_COURSES.map((course, idx) => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCardRow}
                activeOpacity={0.88}
                onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })}
              >
                <Image source={{ uri: course.image }} style={styles.courseRowImg} />
                <View style={styles.courseRowBody}>
                  <View style={styles.courseRowTop}>
                    <Typo variant="bodyMedium" style={styles.courseName} numberOfLines={1}>
                      {course.name}
                    </Typo>
                    <View style={styles.distBadgeInline}>
                      <Typo variant="caption" style={styles.distText}>{course.distance}</Typo>
                    </View>
                  </View>
                  <View style={styles.courseRowBottom}>
                    <Typo variant="caption" style={styles.courseHoles}>
                      {course.holes} Holes • Par {course.par}
                    </Typo>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={11} color={Colors.primaryBlack} />
                      <Typo variant="caption" style={styles.ratingText}>{course.rating}</Typo>
                    </View>
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

          <View style={styles.recentRoundCard}>
            <View style={styles.recentTop}>
              <View style={styles.scoreGaugeCircle}>
                <Typo variant="h2" style={styles.scoreGaugeText}>-4</Typo>
                <Typo variant="caption" style={styles.scoreGaugeSub}>UNDER</Typo>
              </View>
              <View style={styles.recentInfo}>
                <Typo variant="bodyMedium" style={styles.recentCourse}>Maple Hill DGC</Typo>
                <Typo variant="small" style={styles.recentDate}>May 18, 2025</Typo>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Typo variant="caption" style={styles.statLabel}>SCORE</Typo>
                <Typo variant="bodyMedium" style={styles.statVal}>54</Typo>
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
          </View>
        </AnimatedFadeIn>

        {/* Split Bottom Grid: Weather & Wind | My Bag */}
        <View style={styles.bottomGrid}>
          {/* Weather Card */}
          <View style={styles.gridCard}>
            <Typo variant="caption" style={styles.cardHeaderTitle}>WEATHER & WIND</Typo>
            <View style={styles.tempRow}>
              <Ionicons name="sunny-outline" size={32} color={Colors.primaryBlack} />
              <View>
                <Typo variant="display" style={styles.tempNum}>
                  {weather ? `${weather.temperature}°` : '72°'}
                </Typo>
                <Typo variant="caption" style={styles.weatherSub}>
                  {weather ? weather.description : 'Sunny'}
                </Typo>
              </View>
            </View>
            <View style={styles.windFooter}>
              <Typo variant="caption" style={styles.windLabel}>WIND</Typo>
              <View style={styles.windValRow}>
                <Ionicons name="navigate-outline" size={14} color={Colors.primaryBlack} />
                <Typo variant="caption" style={styles.windVal}>
                  {weather ? `${weather.windSpeed} mph` : '8 mph NW'}
                </Typo>
              </View>
            </View>
          </View>

          {/* My Bag Card */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/bag')}
          >
            <Typo variant="caption" style={styles.cardHeaderTitle}>MY BAG</Typo>
            <View style={styles.bagContent}>
              <View>
                <Typo variant="display" style={styles.discCountNum}>14</Typo>
                <Typo variant="caption" style={styles.weatherSub}>Discs</Typo>
              </View>
              {/* Disc Graphic Circle */}
              <View style={styles.discGraphic}>
                <Typo variant="caption" style={styles.discBrandText}>ACED</Typo>
                <Typo variant="bodyMedium" style={styles.discNameText}>VOLT</Typo>
              </View>
            </View>
            <View style={styles.bagLinkRow}>
              <Typo variant="caption" style={styles.bagLinkText}>View bag</Typo>
              <Ionicons name="chevron-forward" size={12} color={Colors.blue} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  welcomeText: { color: Colors.secondaryText, fontSize: Typography.size.base },
  userName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 32,
    color: Colors.primaryBlack,
    lineHeight: 36,
  },
  blueBar: {
    height: 4,
    width: 32,
    backgroundColor: Colors.blue,
    borderRadius: 2,
    marginTop: 6,
  },
  bellBtn: {
    padding: 8,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.blue,
  },

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
  },
  sectionTitle: {
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 0.8,
    fontSize: Typography.size.xs,
  },
  seeAll: { color: Colors.blue, fontFamily: Typography.fontFamily.medium },

  // Horizontal Scroll Courses — Sleek Single Line Rows
  horizontalScroll: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  courseCardRow: {
    width: 240,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  courseRowImg: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
  },
  courseRowBody: {
    flex: 1,
    gap: 4,
  },
  courseRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  courseRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distBadgeInline: {
    backgroundColor: 'rgba(9, 9, 10, 0.85)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  distText: { color: Colors.white, fontSize: 10, fontFamily: Typography.fontFamily.medium },
  courseBody: { padding: Spacing.md, gap: 3 },
  courseName: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },
  courseHoles: { color: Colors.secondaryText, fontSize: Typography.size.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.xs },

  // Recent Round
  recentRoundCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing['2xl'],
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
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    justifyContent: 'space-between',
    minHeight: 140,
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
});
