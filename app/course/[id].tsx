import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
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
import * as Haptics from 'expo-haptics';
import type { Course, Hole } from '../../types/course';
import type { GameType, Player } from '../../types/round';
import { fetchCourseHoleGeometry } from '../../lib/osmHoleGeometry';

const GAME_MODES_LIST: { id: GameType; title: string; desc: string; icon: string }[] = [
  { id: 'stroke', title: 'Stroke Play', desc: 'Lowest total score wins', icon: 'golf-outline' },
  { id: 'skins', title: 'Skins', desc: 'Win holes. Ties carry over', icon: 'flame-outline' },
  { id: 'match', title: 'Match Play', desc: 'Win more holes than your opponent', icon: 'trophy-outline' },
  { id: 'best_shot', title: 'Teams (Best Shot)', desc: 'Play together against another team', icon: 'people-outline' },
  { id: 'disc_roulette', title: 'Disc Roulette', desc: 'Random disc assigned from My Bag per hole', icon: 'dice-outline' },
  { id: 'birdie_battle', title: 'Birdie Battle', desc: 'Earn points for birdies, eagles & aces', icon: 'target-outline' },
  { id: 'one_disc', title: 'One Disc Challenge', desc: 'Choose 1 disc for all 18 holes', icon: 'disc-outline' },
];

const MOCK_DAILY_LEADERBOARD = [
  { name: 'Ricky M.', score: '-5', totalStrokes: 49, timeAgo: 'Today 2:15 PM' },
  { name: 'Jake M.', score: '-3', totalStrokes: 51, timeAgo: 'Today 11:40 AM' },
  { name: 'Sarah J.', score: '-1', totalStrokes: 53, timeAgo: 'Today 9:20 AM' },
];

const MOCK_WEEKLY_LEADERBOARD = [
  { name: 'Paul M.', score: '-9', totalStrokes: 45, timeAgo: '3 days ago' },
  { name: 'Ricky M.', score: '-7', totalStrokes: 47, timeAgo: '5 days ago' },
  { name: 'Eagle W.', score: '-6', totalStrokes: 48, timeAgo: '2 days ago' },
];

const MOCK_MONTHLY_LEADERBOARD = [
  { name: 'Simon L.', score: '-11', totalStrokes: 43, timeAgo: '2 weeks ago' },
  { name: 'Paul M.', score: '-9', totalStrokes: 45, timeAgo: '3 weeks ago' },
  { name: 'Ricky M.', score: '-7', totalStrokes: 47, timeAgo: '1 week ago' },
];

const INITIAL_PLAYERS: Player[] = [
  { id: 'user-1', name: 'Thomas', handicap: 9.1, isUser: true },
  { id: 'player-2', name: 'Jake', handicap: 3.0 },
];

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { startRound } = useRoundStore();
  const { user } = useAuthStore();
  const { data: bags } = useBags(user?.id ?? null);
  const [is3dTourOpen, setIs3dTourOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameType>('stroke');
  const [useHandicap, setUseHandicap] = useState(true);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [newPlayerName, setNewPlayerName] = useState('');
  const tourMapRef = useRef<MapView>(null);

  const { data: course, isLoading } = useQuery<Course | null>({
    queryKey: ['course', id],
    queryFn: () => getCourse(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (is3dTourOpen && tourMapRef.current && course) {
      setTimeout(() => {
        if (tourMapRef.current && course) {
          tourMapRef.current.animateCamera(
            {
              center: { latitude: course.latitude, longitude: course.longitude },
              heading: 45,
              pitch: 65,
              zoom: 16.5,
            },
            { duration: 1200 }
          );
        }
      }, 300);
    }
  }, [is3dTourOpen, course]);

  const { data: holesGeometry } = useQuery({
    queryKey: ['courseGeometry', id, course?.latitude, course?.longitude],
    queryFn: () => fetchCourseHoleGeometry(id!, course!.latitude, course!.longitude, course!.holeCount),
    enabled: !!course,
    staleTime: 60 * 60 * 1000,
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

  async function handleStartRound() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const defaultBag = bags?.find((b) => b.isDefault) ?? bags?.[0];
    const holesToUse = holesGeometry || await fetchCourseHoleGeometry(course!.id, course!.latitude, course!.longitude, course!.holeCount);
    const roundId = startRound(
      course!,
      undefined,
      holesToUse,
      defaultBag?.id,
      selectedGame,
      { useHandicap, carryTies: true },
      players
    );
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
            {holesGeometry?.some((h: Hole) => h.isOsmVerified) ? (
              <Badge label="OSM GPS Hole Geometry" variant="green" />
            ) : (
              <Badge label="Standard Layout" variant="gray" />
            )}
          </View>
        </View>

        {/* Course Leaderboards Card */}
        <View style={styles.leaderboardCard}>
          <View style={styles.leaderboardHeaderStack}>
            <View style={styles.leaderboardTitleRow}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
              <Typo variant="h2" style={styles.leaderboardTitleText}>Course Leaderboard</Typo>
            </View>

            <View style={styles.leaderboardToggleBg}>
              <TouchableOpacity
                style={[styles.leaderboardToggleBtn, leaderboardTab === 'daily' && styles.leaderboardToggleActive]}
                onPress={() => setLeaderboardTab('daily')}
              >
                <Typo style={[styles.leaderboardToggleText, leaderboardTab === 'daily' && styles.leaderboardToggleTextActive]}>Daily</Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.leaderboardToggleBtn, leaderboardTab === 'weekly' && styles.leaderboardToggleActive]}
                onPress={() => setLeaderboardTab('weekly')}
              >
                <Typo style={[styles.leaderboardToggleText, leaderboardTab === 'weekly' && styles.leaderboardToggleTextActive]}>Weekly</Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.leaderboardToggleBtn, leaderboardTab === 'monthly' && styles.leaderboardToggleActive]}
                onPress={() => setLeaderboardTab('monthly')}
              >
                <Typo style={[styles.leaderboardToggleText, leaderboardTab === 'monthly' && styles.leaderboardToggleTextActive]}>Monthly</Typo>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.challengeBanner}>
            <Ionicons name="flame" size={14} color="#92400E" />
            <Typo style={{ color: '#92400E', fontWeight: 'bold', fontSize: 11 }}>
              {leaderboardTab === 'daily'
                ? "Can you beat today's best round of -5?"
                : leaderboardTab === 'weekly'
                ? "Can you beat this week's best round of -9?"
                : "Can you beat this month's best round of -11?"}
            </Typo>
          </View>

          <View style={styles.leaderboardRowsContainer}>
            {(leaderboardTab === 'daily'
              ? MOCK_DAILY_LEADERBOARD
              : leaderboardTab === 'weekly'
              ? MOCK_WEEKLY_LEADERBOARD
              : MOCK_MONTHLY_LEADERBOARD
            ).map((entry, idx) => (
              <View key={idx} style={styles.leaderboardItemRow}>
                <Typo style={styles.leaderboardRankText}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</Typo>
                <View style={{ flex: 1 }}>
                  <Typo style={{ fontWeight: 'bold', fontSize: 14 }}>{entry.name}</Typo>
                  <Typo style={{ color: Colors.secondaryText, fontSize: 11 }}>{entry.timeAgo}</Typo>
                </View>
                <View style={styles.leaderboardScorePill}>
                  <Typo style={{ fontWeight: 'bold', color: Colors.blue, fontSize: 13 }}>{entry.score}</Typo>
                  <Typo style={{ fontSize: 10, color: Colors.secondaryText }}>({entry.totalStrokes})</Typo>
                </View>
              </View>
            ))}
          </View>
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

      {/* Sticky Start Round & Game Mode Configuration Card */}
      <View style={styles.stickyBottom}>
        <View style={styles.gameSetupCard}>
          <TouchableOpacity
            style={styles.gameSelectorHeader}
            activeOpacity={0.88}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsGameModalOpen(true);
            }}
          >
            <View style={{ flex: 1 }}>
              <Typo variant="caption" style={styles.gameModeLabel}>GAME MODE (DEFAULTS TO NORMAL ROUND)</Typo>
              <Typo variant="bodyMedium" style={styles.gameModeTitle}>
                {selectedGame === 'stroke' ? 'Normal Round (Stroke Play)' : GAME_MODES_LIST.find((g) => g.id === selectedGame)?.title}
              </Typo>
              <Typo variant="caption" style={styles.gameModeDesc}>
                {GAME_MODES_LIST.find((g) => g.id === selectedGame)?.desc ?? 'Lowest total score wins'}
              </Typo>
            </View>
            <View style={styles.changeModeBadge}>
              <Ionicons name="options-outline" size={14} color={Colors.white} />
              <Typo style={styles.changeModeText}>Change</Typo>
            </View>
          </TouchableOpacity>

          <View style={styles.setupRow}>
            <TouchableOpacity
              style={[styles.setupChip, useHandicap && styles.setupChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setUseHandicap(!useHandicap);
              }}
            >
              <Ionicons name={useHandicap ? "checkmark-circle" : "ellipse-outline"} size={14} color={useHandicap ? Colors.white : Colors.primaryBlack} />
              <Typo style={[styles.setupChipText, useHandicap && { color: Colors.white }]}>
                Handicaps: {useHandicap ? 'ON' : 'OFF'}
              </Typo>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setupChip}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsPlayerModalOpen(true);
              }}
            >
              <Ionicons name="people" size={14} color={Colors.primaryBlack} />
              <Typo style={styles.setupChipText}>{players.length} Players</Typo>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          label={`Start ${GAME_MODES_LIST.find((g) => g.id === selectedGame)?.title ?? 'Round'} Here`}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleStartRound}
          icon={<Ionicons name="play" size={18} color={Colors.white} />}
        />
        <Typo variant="caption" style={{ color: Colors.secondaryText, fontSize: 10, textAlign: 'center', marginTop: 8 }}>
          Course data supplied by OpenStreetMap (OSM) & DiscGolfAPI.
        </Typo>
      </View>

      {/* 3D Photorealistic Aerial Course Flyover Modal */}
      <Modal visible={is3dTourOpen} animationType="slide" onRequestClose={() => setIs3dTourOpen(false)}>
        <View style={{ flex: 1, backgroundColor: Colors.primaryBlack }}>
          <MapView
            ref={tourMapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_DEFAULT}
            mapType="satellite"
            pitchEnabled={true}
            rotateEnabled={true}
            zoomEnabled={true}
            initialRegion={{
              latitude: course.latitude,
              longitude: course.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
          >
            {holesGeometry?.map((hole: Hole) => (
              <React.Fragment key={hole.id}>
                {hole.teeLat && hole.teeLng && (
                  <Marker coordinate={{ latitude: hole.teeLat, longitude: hole.teeLng }}>
                    <View style={styles.tourMarkerTee}>
                      <Typo style={{ color: Colors.white, fontSize: 9, fontWeight: 'bold' }}>T{hole.holeNumber}</Typo>
                    </View>
                  </Marker>
                )}
                {hole.basketLat && hole.basketLng && (
                  <Marker coordinate={{ latitude: hole.basketLat, longitude: hole.basketLng }}>
                    <View style={styles.tourMarkerBasket}>
                      <Ionicons name="flag" size={12} color={Colors.white} />
                    </View>
                  </Marker>
                )}
              </React.Fragment>
            ))}
          </MapView>

          <SafeAreaView style={styles.tourHeaderOverlay} pointerEvents="box-none" edges={['top']}>
            <TouchableOpacity style={styles.tourCloseBtn} onPress={() => setIs3dTourOpen(false)}>
              <Ionicons name="close" size={20} color={Colors.primaryBlack} />
            </TouchableOpacity>

            <View style={styles.tourHeaderTitleBox}>
              <Typo variant="bodyMedium" style={{ color: Colors.white, fontWeight: 'bold' }}>
                {course.name} 3D Tour
              </Typo>
              <Typo variant="caption" style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 10 }}>
                Photorealistic Aerial View • {course.holeCount} Holes
              </Typo>
            </View>

            <View style={{ width: 44 }} />
          </SafeAreaView>

          <View style={styles.tourFooterCard}>
            <Typo variant="bodyMedium" style={{ color: Colors.white, fontWeight: 'bold' }}>
              Photorealistic 3D Aerial View
            </Typo>
            <Typo variant="caption" style={{ color: Colors.gray400, marginTop: 2 }}>
              Rotate, tilt, and zoom around {course.name}'s fairway corridors & greens.
            </Typo>
            <TouchableOpacity style={styles.tourStartBtn} onPress={() => { setIs3dTourOpen(false); handleStartRound(); }}>
              <Ionicons name="play" size={16} color={Colors.white} />
              <Typo style={{ color: Colors.white, fontWeight: 'bold' }}>Start Playing Course</Typo>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* GAME MODE SELECTION MODAL */}
      <Modal visible={isGameModalOpen} animationType="slide" onRequestClose={() => setIsGameModalOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top']}>
          <View style={styles.modalHeader}>
            <Typo variant="h2" style={{ fontWeight: 'bold' }}>Choose Game Mode</Typo>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsGameModalOpen(false)}>
              <Ionicons name="close" size={22} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg, gap: 10 }}>
            {GAME_MODES_LIST.map((g) => {
              const isSelected = selectedGame === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.modalGameRow, isSelected && styles.modalGameRowSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedGame(g.id);
                    setIsGameModalOpen(false);
                  }}
                >
                  <Ionicons name={g.icon as any} size={24} color={isSelected ? Colors.white : Colors.primaryBlack} />
                  <View style={{ flex: 1 }}>
                    <Typo style={[styles.modalGameTitle, isSelected && { color: Colors.white }]}>{g.title}</Typo>
                    <Typo style={[styles.modalGameDesc, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>{g.desc}</Typo>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={Colors.white} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* PLAYER MANAGEMENT MODAL */}
      <Modal visible={isPlayerModalOpen} animationType="slide" onRequestClose={() => setIsPlayerModalOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top']}>
          <View style={styles.modalHeader}>
            <Typo variant="h2" style={{ fontWeight: 'bold' }}>Round Players</Typo>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsPlayerModalOpen(false)}>
              <Ionicons name="close" size={22} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: Spacing.lg, flex: 1, gap: 12 }}>
            {players.map((p) => (
              <View key={p.id} style={styles.playerRow}>
                <Ionicons name="person-circle-outline" size={24} color={Colors.primaryBlack} />
                <Typo style={{ flex: 1, fontWeight: 'bold' }}>{p.name}</Typo>
                <View style={styles.handicapBadge}>
                  <Typo style={{ fontSize: 10, fontWeight: 'bold' }}>ACED {p.handicap}</Typo>
                </View>
              </View>
            ))}

            <View style={styles.addPlayerRow}>
              <TextInput
                style={styles.addPlayerInput}
                placeholder="Add player name..."
                placeholderTextColor={Colors.gray400}
                value={newPlayerName}
                onChangeText={setNewPlayerName}
              />
              <TouchableOpacity
                style={styles.addPlayerBtn}
                onPress={() => {
                  if (!newPlayerName.trim()) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPlayers([
                    ...players,
                    { id: `p-${Date.now()}`, name: newPlayerName.trim(), handicap: 12.0 },
                  ]);
                  setNewPlayerName('');
                }}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ padding: Spacing.lg }}>
            <Button label="Done" variant="primary" size="lg" fullWidth onPress={() => setIsPlayerModalOpen(false)} />
          </View>
        </SafeAreaView>
      </Modal>
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

  // EXPLORE 3D Hero Card
  explore3dHeroCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    ...Shadows.md,
  },
  explore3dBadgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge3d: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badge3dText: { color: Colors.white, fontSize: 9, fontFamily: Typography.fontFamily.bold, letterSpacing: 0.5 },
  badgeLive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeLiveText: { color: Colors.white, fontSize: 8, fontFamily: Typography.fontFamily.bold, letterSpacing: 0.5 },
  hero3dTitle: { color: Colors.white, fontSize: 18, fontFamily: Typography.fontFamily.bold },
  hero3dSub: { color: Colors.gray400, fontSize: 11 },
  hero3dPlayRow: { marginTop: 4 },
  hero3dPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    gap: 6,
  },
  hero3dPlayText: { color: Colors.primaryBlack, fontSize: 11, fontFamily: Typography.fontFamily.bold },

  // Tour Overlay Styles
  tourHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    zIndex: 10,
  },
  tourCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  tourHeaderTitleBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tourFooterCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
    ...Shadows.md,
  },
  tourStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    gap: 8,
    marginTop: 4,
  },
  tourMarkerTee: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.primaryBlack,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  tourMarkerBasket: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },

  // Leaderboards Card
  leaderboardCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: 16,
    marginVertical: 8,
    ...Shadows.md,
  },
  leaderboardHeaderStack: { gap: 12 },
  leaderboardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leaderboardTitleText: { fontWeight: 'bold', fontSize: 18, color: Colors.primaryBlack },
  leaderboardToggleBg: { flexDirection: 'row', backgroundColor: Colors.backgroundSoft, borderRadius: BorderRadius.full, padding: 4, alignSelf: 'flex-start' },
  leaderboardToggleBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full },
  leaderboardToggleActive: { backgroundColor: Colors.primaryBlack },
  leaderboardToggleText: { fontSize: 12, color: Colors.secondaryText, fontWeight: 'bold' },
  leaderboardToggleTextActive: { color: Colors.white },
  challengeBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 10, borderRadius: BorderRadius.lg, gap: 8 },
  leaderboardRowsContainer: { gap: 12 },
  leaderboardItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.backgroundSoft },
  leaderboardRankText: { fontSize: 22 },
  leaderboardScorePill: { alignItems: 'flex-end' },

  // Game Setup Card in Sticky Bottom
  gameSetupCard: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  gameSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  gameModeLabel: { fontSize: 9, color: Colors.secondaryText, letterSpacing: 0.5, fontWeight: 'bold' },
  gameModeTitle: { fontWeight: 'bold', fontSize: 14, color: Colors.primaryBlack },
  gameModeDesc: { fontSize: 11, color: Colors.secondaryText },
  changeModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBlack,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  changeModeText: { color: Colors.white, fontSize: 11, fontWeight: 'bold' },
  setupRow: { flexDirection: 'row', gap: 8 },
  setupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  setupChipActive: { backgroundColor: Colors.primaryBlack, borderColor: Colors.primaryBlack },
  setupChipText: { fontSize: 11, fontWeight: 'bold', color: Colors.primaryBlack },

  // Modal styles
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.backgroundSoft, alignItems: 'center', justifyContent: 'center' },
  modalGameRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderColor: Colors.border, gap: 12 },
  modalGameRowSelected: { backgroundColor: Colors.primaryBlack, borderColor: Colors.primaryBlack },
  modalGameTitle: { fontWeight: 'bold', fontSize: 15 },
  modalGameDesc: { fontSize: 11, color: Colors.secondaryText },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  handicapBadge: { backgroundColor: Colors.backgroundSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full },
  addPlayerRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addPlayerInput: { flex: 1, backgroundColor: Colors.backgroundSoft, borderRadius: BorderRadius.lg, paddingHorizontal: 12, height: 42, fontSize: 13, color: Colors.primaryBlack },
  addPlayerBtn: { width: 42, height: 42, borderRadius: BorderRadius.lg, backgroundColor: Colors.primaryBlack, alignItems: 'center', justifyContent: 'center' },
});
