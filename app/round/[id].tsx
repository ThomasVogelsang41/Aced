import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { WeatherBanner } from '../../components/WeatherBanner';
import { CaddieRecommendation } from '../../components/CaddieRecommendation';
import { ScorecardRow } from '../../components/ScorecardRow';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useLocation } from '../../hooks/useLocation';
import { useWeather } from '../../hooks/useWeather';
import { useSaveRound } from '../../hooks/useRound';
import { useRoundStore } from '../../store/roundStore';
import { useBagStore } from '../../store/bagStore';
import { useAuthStore } from '../../store/authStore';
import { getDiscRecommendations } from '../../lib/caddie';
import { haversineDistanceFeet, formatDistance } from '../../lib/distance';
import type { DiscRecommendation } from '../../types/disc';

export default function ActiveRoundScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    activeRound,
    holes,
    recordScore,
    nextHole,
    prevHole,
    goToHole,
    finishRound,
    abandonRound,
  } = useRoundStore();
  const { getActiveBag } = useBagStore();
  const { user } = useAuthStore();
  const saveRound = useSaveRound();

  // Live GPS tracking
  const { latitude, longitude } = useLocation(true);
  const { data: weather } = useWeather(latitude, longitude);

  if (!activeRound || activeRound.round.id !== id) {
    router.replace('/(tabs)/play');
    return null;
  }

  const { round, currentHoleIndex } = activeRound;
  const currentScore = round.scores[currentHoleIndex];
  const currentHole = holes[currentHoleIndex];

  // GPS distance to basket
  const gpsDistanceFt = useMemo(() => {
    if (
      latitude !== null &&
      longitude !== null &&
      currentHole?.basketLat !== undefined &&
      currentHole?.basketLng !== undefined
    ) {
      return haversineDistanceFeet(latitude, longitude, currentHole.basketLat, currentHole.basketLng);
    }
    return currentHole?.distanceFt ?? null;
  }, [latitude, longitude, currentHole]);

  // Caddie recommendations
  const activeBag = getActiveBag();
  const recommendations: DiscRecommendation[] = useMemo(() => {
    if (!activeBag || !gpsDistanceFt) return [];
    return getDiscRecommendations({
      distanceFt: gpsDistanceFt,
      windSpeedMph: weather?.windSpeed ?? 0,
      windDirectionDeg: weather?.windDirection ?? 0,
      teeLat: currentHole?.teeLat,
      teeLng: currentHole?.teeLng,
      basketLat: currentHole?.basketLat,
      basketLng: currentHole?.basketLng,
      playerBag: activeBag.discs,
    });
  }, [gpsDistanceFt, weather, activeBag, currentHole]);

  // Total running score
  const runningTotal = round.scores
    .slice(0, currentHoleIndex + 1)
    .reduce((acc, s) => acc + (s.strokes > 0 ? s.strokes - s.par : 0), 0);

  function handleStroke(delta: number) {
    const current = currentScore.strokes;
    const next = Math.max(1, current + delta);
    recordScore(currentScore.holeNumber, next);
  }

  function handleSetStrokes(n: number) {
    if (n >= 1) recordScore(currentScore.holeNumber, n);
  }

  function handleNextHole() {
    if (currentScore.strokes === 0) {
      Alert.alert('No score entered', 'Please enter a score before moving to the next hole.', [
        { text: 'Skip anyway', onPress: nextHole },
        { text: 'Stay', style: 'cancel' },
      ]);
      return;
    }
    nextHole();
  }

  async function handleFinish() {
    Alert.alert('Finish Round', 'Are you ready to finish this round?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          const finished = finishRound();
          if (finished && user?.id) {
            try {
              await saveRound.mutateAsync({ ...finished.round, userId: user.id });
            } catch {
              // Saved locally even if network fails
            }
          }
          router.replace('/round/scorecard');
        },
      },
    ]);
  }

  function handleAbandon() {
    Alert.alert('Abandon Round', 'This round will not be saved.', [
      { text: 'Keep Playing', style: 'cancel' },
      {
        text: 'Abandon',
        style: 'destructive',
        onPress: () => { abandonRound(); router.replace('/(tabs)/play'); },
      },
    ]);
  }

  const isLastHole = currentHoleIndex === round.scores.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleAbandon} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.primaryBlack} />
        </TouchableOpacity>
        <Typo variant="bodyMedium" style={styles.courseName} numberOfLines={1}>
          {round.courseName}
        </Typo>
        <View style={styles.runningScore}>
          <Typo
            variant="bodyMedium"
            style={[
              styles.scoreText,
              runningTotal < 0 && { color: Colors.green },
              runningTotal > 0 && { color: runningTotal >= 3 ? Colors.red : Colors.orange },
            ]}
          >
            {runningTotal === 0 ? 'E' : runningTotal > 0 ? `+${runningTotal}` : `${runningTotal}`}
          </Typo>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hole navigation */}
        <View style={styles.holeNav}>
          <TouchableOpacity
            style={[styles.navBtn, currentHoleIndex === 0 && styles.navBtnDisabled]}
            onPress={prevHole}
            disabled={currentHoleIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color={currentHoleIndex === 0 ? Colors.gray300 : Colors.primaryBlack} />
          </TouchableOpacity>
          <View style={styles.holeInfo}>
            <Typo variant="label">HOLE</Typo>
            <Typo variant="display" style={styles.holeNumber}>{currentScore.holeNumber}</Typo>
            <Typo variant="label">PAR {currentScore.par}</Typo>
          </View>
          <TouchableOpacity
            style={[styles.navBtn, isLastHole && styles.navBtnDisabled]}
            onPress={handleNextHole}
            disabled={isLastHole}
          >
            <Ionicons name="chevron-forward" size={20} color={isLastHole ? Colors.gray300 : Colors.primaryBlack} />
          </TouchableOpacity>
        </View>

        {/* GPS distance */}
        {gpsDistanceFt !== null && (
          <View style={styles.distanceRow}>
            <Ionicons name="locate" size={16} color={Colors.blue} />
            <Typo variant="h3" style={styles.distanceValue}>
              {formatDistance(gpsDistanceFt)}
            </Typo>
            <Typo variant="small" style={styles.distanceLabel}>to basket</Typo>
          </View>
        )}

        {/* Weather compact */}
        {weather && (
          <View style={styles.weatherRow}>
            <WeatherBanner weather={weather} compact />
          </View>
        )}

        {/* Stroke counter */}
        <View style={styles.strokeCounter}>
          <TouchableOpacity
            style={styles.strokeBtn}
            onPress={() => handleStroke(-1)}
            disabled={currentScore.strokes <= 1}
          >
            <Ionicons
              name="remove"
              size={28}
              color={currentScore.strokes <= 1 ? Colors.gray300 : Colors.primaryBlack}
            />
          </TouchableOpacity>
          <Pressable
            style={styles.strokeDisplay}
            onLongPress={() => handleSetStrokes(currentScore.par)}
          >
            <Typo style={styles.strokeCount}>
              {currentScore.strokes === 0 ? '—' : currentScore.strokes}
            </Typo>
            <Typo variant="caption" style={styles.strokeLabel}>strokes</Typo>
          </Pressable>
          <TouchableOpacity
            style={styles.strokeBtn}
            onPress={() => handleStroke(1)}
          >
            <Ionicons name="add" size={28} color={Colors.primaryBlack} />
          </TouchableOpacity>
        </View>

        {/* Quick score buttons 1–8 */}
        <View style={styles.quickScores}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                styles.quickBtn,
                currentScore.strokes === n && styles.quickBtnActive,
              ]}
              onPress={() => handleSetStrokes(n)}
            >
              <Typo
                style={[
                  styles.quickLabel,
                  currentScore.strokes === n && styles.quickLabelActive,
                ]}
              >
                {n}
              </Typo>
            </TouchableOpacity>
          ))}
        </View>

        {/* Smart Caddie */}
        <CaddieRecommendation
          recommendations={recommendations}
          distanceFt={Math.round(gpsDistanceFt ?? currentHole?.distanceFt ?? 0)}
        />

        {/* Scorecard mini */}
        <View style={styles.scorecardSection}>
          <Typo variant="label" style={styles.scorecardLabel}>Scorecard</Typo>
          <View style={styles.scorecardHeader}>
            {['Hole', 'Par', 'Score', '+/-'].map((h) => (
              <Typo key={h} variant="caption" style={styles.scorecardHeaderCell}>{h}</Typo>
            ))}
          </View>
          {round.scores.map((score, idx) => (
            <TouchableOpacity key={score.holeNumber} onPress={() => goToHole(idx)}>
              <ScorecardRow
                score={score}
                isCurrentHole={idx === currentHoleIndex}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next / Finish */}
        <View style={styles.actions}>
          {isLastHole ? (
            <Button
              label="Finish Round"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={saveRound.isPending}
              onPress={handleFinish}
            />
          ) : (
            <Button
              label={`Next Hole (${currentHoleIndex + 2})`}
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleNextHole}
              icon={<Ionicons name="arrow-forward" size={18} color={Colors.white} />}
              iconPosition="right"
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: { padding: 4, marginRight: 8 },
  courseName: { flex: 1, color: Colors.primaryBlack },
  runningScore: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },
  scroll: { flex: 1 },
  content: { padding: Spacing.base, gap: Spacing.base },
  holeNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { borderColor: Colors.border },
  holeInfo: { alignItems: 'center', gap: 2 },
  holeNumber: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 56,
    lineHeight: 60,
    color: Colors.primaryBlack,
    letterSpacing: -2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.blueLight,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
  },
  distanceValue: { color: Colors.blue },
  distanceLabel: { color: Colors.blue },
  weatherRow: { marginVertical: -4 },
  strokeCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
  },
  strokeBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strokeDisplay: { alignItems: 'center' },
  strokeCount: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 52,
    color: Colors.primaryBlack,
    lineHeight: 56,
    letterSpacing: -2,
  },
  strokeLabel: { color: Colors.secondaryText },
  quickScores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  quickBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnActive: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  quickLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.base,
    color: Colors.secondaryText,
  },
  quickLabelActive: { color: Colors.white },
  scorecardSection: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  scorecardLabel: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  scorecardHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scorecardHeaderCell: {
    flex: 1,
    textAlign: 'center',
    color: Colors.secondaryText,
  },
  actions: { paddingTop: Spacing.sm },
});
