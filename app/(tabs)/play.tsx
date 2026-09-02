import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useLocation } from '../../hooks/useLocation';
import { useNearestCourses } from '../../hooks/useNearestCourses';
import { useRoundStore } from '../../store/roundStore';
import { TabHeader } from '../../components/TabHeader';
import { AnimatedFadeIn } from '../../components/ui/AnimatedFadeIn';
import { DiscSpinner } from '../../components/ui/DiscSpinner';

export default function PlayScreen() {
  const { activeRound } = useRoundStore();
  const { latitude, longitude } = useLocation();
  const { data: nearbyCourses, isLoading } = useNearestCourses(latitude, longitude, 50);
  const [searchQuery, setSearchQuery] = useState('');

  const displayCourses = searchQuery.trim()
    ? (nearbyCourses ?? []).filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : nearbyCourses ?? [];

  // Active round resume banner
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
                <Typo variant="small" style={{ color: Colors.secondaryText }}>
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
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedFadeIn delay={0}>
          <TabHeader subtitle="Select Course to Play" title="Play" />
        </AnimatedFadeIn>

        {/* Search Bar */}
        <AnimatedFadeIn delay={100}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search course name or city..."
              placeholderTextColor={Colors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </AnimatedFadeIn>

        {/* Course List */}
        <AnimatedFadeIn delay={200}>
          <View style={styles.sectionHeader}>
            <Typo variant="label" style={styles.sectionLabel}>NEARBY COURSES ({displayCourses.length})</Typo>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <DiscSpinner label="Locating nearby courses..." size={36} />
            </View>
          ) : (
            <View style={styles.courseGrid}>
              {displayCourses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.courseCard}
                  activeOpacity={0.88}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/course/[id]', params: { id: c.id } });
                  }}
                >
                  <View style={styles.courseCardTop}>
                    <View style={styles.courseIconBadge}>
                      <Ionicons name="flag" size={18} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typo style={styles.courseName}>{c.name}</Typo>
                      <Typo style={styles.courseCity}>{c.city}, {c.state}</Typo>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
                  </View>

                  <View style={styles.courseCardFooter}>
                    <View style={styles.metaBadge}>
                      <Ionicons name="disc-outline" size={12} color={Colors.secondaryText} />
                      <Typo style={styles.metaBadgeText}>{c.holeCount} Holes</Typo>
                    </View>
                    {c.distanceMiles !== undefined && (
                      <View style={styles.metaBadge}>
                        <Ionicons name="navigate-outline" size={12} color={Colors.secondaryText} />
                        <Typo style={styles.metaBadgeText}>
                          {c.distanceMiles < 10 ? c.distanceMiles.toFixed(1) : Math.round(c.distanceMiles)} mi
                        </Typo>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </AnimatedFadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 32 },
  title: { fontFamily: Typography.fontFamily.bold, marginBottom: Spacing.md },
  activeCard: {
    backgroundColor: Colors.backgroundSoft,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.primaryBlack },
  sectionHeader: { marginBottom: 8 },
  sectionLabel: { color: Colors.secondaryText, letterSpacing: 0.8 },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },

  courseGrid: { gap: 12 },
  courseCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: 12,
    ...Shadows.sm,
  },
  courseCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  courseIconBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryBlack, alignItems: 'center', justifyContent: 'center' },
  courseName: { fontFamily: Typography.fontFamily.bold, fontSize: 15 },
  courseCity: { color: Colors.secondaryText, fontSize: 12 },
  courseCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.md, gap: 4 },
  metaBadgeText: { fontSize: 11, color: Colors.primaryBlack, fontWeight: 'bold' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.md, gap: 4, marginLeft: 'auto' },
  ratingText: { fontSize: 11, fontWeight: 'bold', color: '#92400E' },
});
