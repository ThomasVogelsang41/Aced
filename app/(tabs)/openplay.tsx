import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { TabHeader } from '../../components/TabHeader';
import { AnimatedFadeIn } from '../../components/ui/AnimatedFadeIn';
import { useLocation } from '../../hooks/useLocation';
import { useNearestCourses } from '../../hooks/useNearestCourses';
import type { Course } from '../../types/course';

// ─────────────────────────────────────────────────────────
//  Types & Constants
// ─────────────────────────────────────────────────────────

export type GameType =
  | 'skins'
  | 'match'
  | 'stroke'
  | 'doubles'
  | 'ace_race'
  | 'ctp'
  | 'points';

interface GameFormatConfig {
  id: GameType;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconFocused: React.ComponentProps<typeof Ionicons>['name'];
}

export const GAME_FORMATS: GameFormatConfig[] = [
  {
    id: 'skins',
    label: 'Skins',
    description: 'Win holes, carry skins.',
    icon: 'flame-outline',
    iconFocused: 'flame',
  },
  {
    id: 'match',
    label: 'Match Play',
    description: 'Head-to-head hole by hole.',
    icon: 'trophy-outline',
    iconFocused: 'trophy',
  },
  {
    id: 'stroke',
    label: 'Stroke Play',
    description: 'Lowest total strokes wins.',
    icon: 'disc-outline',
    iconFocused: 'disc',
  },
  {
    id: 'doubles',
    label: 'Best Disc Doubles',
    description: 'Teams of 2, best drive.',
    icon: 'people-outline',
    iconFocused: 'people',
  },
  {
    id: 'ace_race',
    label: 'Ace Race',
    description: 'First ace on each hole wins.',
    icon: 'star-outline',
    iconFocused: 'star',
  },
  {
    id: 'ctp',
    label: 'CTP (Closest to Pin)',
    description: 'Closest approach on select holes.',
    icon: 'location-outline',
    iconFocused: 'location',
  },
  {
    id: 'points',
    label: 'Points Game',
    description: 'Earn points for eagles, birdies, pars.',
    icon: 'ribbon-outline',
    iconFocused: 'ribbon',
  },
];

const FORMAT_MAP = Object.fromEntries(GAME_FORMATS.map((f) => [f.id, f]));

export interface OpenCardItem {
  id: string;
  courseName: string;
  timeText: string;
  gameType: GameType;
  hostName: string;
  players: string[];
  maxPlayers: number;
  joined: boolean;
}

const INITIAL_OPEN_CARDS: OpenCardItem[] = [
  {
    id: 'card-1',
    courseName: 'Echo Valley DGC',
    timeText: 'Today • 5:30 PM',
    gameType: 'skins',
    hostName: 'Player',
    players: ['P1', 'P2'],
    maxPlayers: 4,
    joined: false,
  },
  {
    id: 'card-2',
    courseName: 'Echo Valley DGC',
    timeText: 'Today • 2:30 PM',
    gameType: 'stroke',
    hostName: 'Player',
    players: ['P1', 'P2'],
    maxPlayers: 4,
    joined: false,
  },
  {
    id: 'card-3',
    courseName: 'Belmont Park DGC',
    timeText: 'Today • 4:00 PM',
    gameType: 'match',
    hostName: 'Player',
    players: ['P1'],
    maxPlayers: 4,
    joined: false,
  },
  {
    id: 'card-4',
    courseName: 'Caesar Ford Park DGC',
    timeText: 'Today • 5:30 PM',
    gameType: 'doubles',
    hostName: 'Player',
    players: ['P1', 'P2', 'P3'],
    maxPlayers: 4,
    joined: false,
  },
  {
    id: 'card-5',
    courseName: 'Maple Hill DGC',
    timeText: 'Tomorrow • 10:00 AM',
    gameType: 'ace_race',
    hostName: 'Player',
    players: ['P1'],
    maxPlayers: 6,
    joined: false,
  },
];

type FilterKey = 'all' | GameType;

// ─────────────────────────────────────────────────────────
//  Screen
// ─────────────────────────────────────────────────────────

export default function GroupsScreen() {
  const { latitude, longitude } = useLocation();
  const { data: nearbyCourses } = useNearestCourses(latitude, longitude, 80);

  const [cardsList, setCardsList] = useState<OpenCardItem[]>(INITIAL_OPEN_CARDS);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ── Create Form State ──
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [newTimeText, setNewTimeText] = useState('Today • 6:00 PM');
  const [newFormat, setNewFormat] = useState<GameType>('skins');
  const [newMaxPlayers, setNewMaxPlayers] = useState(4);

  // ── Course search results ──
  const courseResults = useMemo(() => {
    const all = nearbyCourses ?? [];
    if (!courseSearch.trim()) return all.slice(0, 15);
    return all
      .filter(
        (c) =>
          c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
          c.city.toLowerCase().includes(courseSearch.toLowerCase()),
      )
      .slice(0, 15);
  }, [nearbyCourses, courseSearch]);

  // ── Filter tabs ──
  const filterTabs: { key: FilterKey; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { key: 'all', label: 'All', icon: 'grid-outline' },
    { key: 'skins', label: 'Skins', icon: 'flame-outline' },
    { key: 'match', label: 'Match', icon: 'trophy-outline' },
    { key: 'stroke', label: 'Stroke', icon: 'disc-outline' },
    { key: 'doubles', label: 'Doubles', icon: 'people-outline' },
    { key: 'ace_race', label: 'Ace Race', icon: 'star-outline' },
    { key: 'ctp', label: 'CTP', icon: 'location-outline' },
    { key: 'points', label: 'Points', icon: 'ribbon-outline' },
  ];

  const filteredCards = cardsList.filter((card) =>
    activeFilter === 'all' ? true : card.gameType === activeFilter,
  );

  // ── Handlers ──
  const handleJoinCard = (cardId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCardsList((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card;
        const isJoined = card.joined;
        return {
          ...card,
          joined: !isJoined,
          players: isJoined
            ? card.players.filter((p) => p !== 'You')
            : [...card.players, 'You'],
        };
      }),
    );
  };

  const handleCreateCard = () => {
    const courseName = selectedCourse?.name ?? courseSearch.trim();
    if (!courseName) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newCard: OpenCardItem = {
      id: `card-${Date.now()}`,
      courseName,
      timeText: newTimeText,
      gameType: newFormat,
      hostName: 'You',
      players: ['You'],
      maxPlayers: newMaxPlayers,
      joined: true,
    };

    setCardsList((prev) => [newCard, ...prev]);
    // Reset form
    setCourseSearch('');
    setSelectedCourse(null);
    setNewTimeText('Today • 6:00 PM');
    setNewFormat('skins');
    setNewMaxPlayers(4);
    setIsCreateModalOpen(false);
  };

  // ─────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AnimatedFadeIn delay={0} style={{ paddingHorizontal: Spacing.lg }}>
        <TabHeader subtitle="Pickup Cards & Group Games" title="Groups" />
      </AnimatedFadeIn>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create Group Banner */}
        <AnimatedFadeIn delay={50}>
          <TouchableOpacity
            style={styles.createCardBanner}
            activeOpacity={0.88}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsCreateModalOpen(true);
            }}
          >
            <View style={styles.createBannerLeft}>
              <View style={styles.createIconBadge}>
                <Ionicons name="people" size={22} color={Colors.primaryBlack} />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Typo variant="bodyMedium" style={{ fontWeight: 'bold', color: Colors.white }}>
                  Create a Group Card
                </Typo>
                <Typo variant="caption" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Host a pickup round or game for local disc golfers
                </Typo>
              </View>
            </View>
            <Ionicons name="add-circle" size={26} color={Colors.white} />
          </TouchableOpacity>
        </AnimatedFadeIn>

        {/* Filter Pills */}
        <AnimatedFadeIn delay={100}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {filterTabs.map(({ key, label, icon }) => {
              const isActive = activeFilter === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveFilter(key);
                  }}
                >
                  <Ionicons name={icon} size={13} color={isActive ? Colors.white : Colors.primaryBlack} />
                  <Typo style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {label}
                  </Typo>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </AnimatedFadeIn>

        {/* Section Title */}
        <AnimatedFadeIn delay={150}>
          <View style={styles.sectionHeader}>
            <Typo variant="label" style={styles.sectionTitle}>
              OPEN CARDS NEAR YOU ({filteredCards.length})
            </Typo>
          </View>
        </AnimatedFadeIn>

        {/* Open Cards List */}
        {filteredCards.map((card, index) => {
          const fmt = FORMAT_MAP[card.gameType];
          const spotsRemaining = card.maxPlayers - card.players.length;
          const isSkins = card.gameType === 'skins';
          return (
            <AnimatedFadeIn key={card.id} delay={200 + index * 50}>
              <View style={[styles.openCardItem, isSkins && styles.skinsBorderCard]}>
                {/* Format Tag & Time */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.formatTagBadge, isSkins && styles.skinsFormatBadge]}>
                    <Ionicons
                      name={fmt.iconFocused}
                      size={12}
                      color={isSkins ? '#D97706' : Colors.primaryBlack}
                    />
                    <Typo style={[styles.formatTagText, isSkins && styles.skinsFormatText]}>
                      {fmt.label.toUpperCase()}
                    </Typo>
                  </View>
                  <Typo variant="caption" style={styles.cardTimeText}>
                    {card.timeText}
                  </Typo>
                </View>

                {/* Course Name */}
                <Typo variant="h2" style={styles.cardCourseTitle}>
                  {card.courseName}
                </Typo>

                {/* Players Count & Spots */}
                <View style={styles.playersRow}>
                  <View style={styles.avatarsStack}>
                    {card.players.map((_, pIdx) => (
                      <View key={pIdx} style={[styles.avatarBubble, { marginLeft: pIdx === 0 ? 0 : -8 }]}>
                        <Ionicons name="person" size={12} color={Colors.white} />
                      </View>
                    ))}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Typo variant="bodyMedium" style={{ fontWeight: 'bold', fontSize: 13 }}>
                      {card.players.length} / {card.maxPlayers} Players
                    </Typo>
                    <Typo variant="caption" style={{ color: Colors.secondaryText }}>
                      {spotsRemaining > 0 ? `${spotsRemaining} spots remaining` : 'Card Full!'}
                    </Typo>
                  </View>
                </View>

                {/* Join Button */}
                <TouchableOpacity
                  style={[styles.joinCardBtn, card.joined && styles.joinCardBtnJoined]}
                  activeOpacity={0.88}
                  onPress={() => handleJoinCard(card.id)}
                >
                  <Ionicons
                    name={card.joined ? 'checkmark-circle' : 'person-add'}
                    size={18}
                    color={card.joined ? Colors.primaryBlack : Colors.white}
                  />
                  <Typo style={[styles.joinCardBtnText, card.joined && styles.joinCardBtnTextJoined]}>
                    {card.joined ? 'JOINED' : 'JOIN CARD'}
                  </Typo>
                </TouchableOpacity>
              </View>
            </AnimatedFadeIn>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── CREATE GROUP MODAL ─── */}
      <Modal visible={isCreateModalOpen} animationType="slide" onRequestClose={() => setIsCreateModalOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Typo variant="h2" style={{ fontWeight: 'bold' }}>Create Group Card</Typo>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCreateModalOpen(false)}>
              <Ionicons name="close" size={22} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">

            {/* ── Course Search ── */}
            <View style={styles.formGroup}>
              <Typo variant="label" style={styles.formLabel}>COURSE</Typo>

              {selectedCourse ? (
                <TouchableOpacity
                  style={styles.selectedCourseRow}
                  onPress={() => { setSelectedCourse(null); setCourseSearch(''); }}
                >
                  <View style={styles.selectedCourseInfo}>
                    <Ionicons name="location" size={16} color={Colors.blue} />
                    <View style={{ flex: 1 }}>
                      <Typo style={{ fontWeight: 'bold', fontSize: 14 }}>{selectedCourse.name}</Typo>
                      <Typo style={{ color: Colors.secondaryText, fontSize: 11 }}>
                        {selectedCourse.city}{selectedCourse.state ? `, ${selectedCourse.state}` : ''} • {selectedCourse.holeCount} Holes
                      </Typo>
                    </View>
                  </View>
                  <Ionicons name="close-circle" size={20} color={Colors.gray400} />
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.courseSearchBar}>
                    <Ionicons name="search" size={16} color={Colors.gray400} />
                    <TextInput
                      style={styles.courseSearchInput}
                      placeholder="Search disc golf courses..."
                      placeholderTextColor={Colors.gray400}
                      value={courseSearch}
                      onChangeText={(t) => { setCourseSearch(t); setShowCoursePicker(true); }}
                      onFocus={() => setShowCoursePicker(true)}
                    />
                    {courseSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setCourseSearch('')}>
                        <Ionicons name="close-circle" size={16} color={Colors.gray400} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Course results */}
                  {showCoursePicker && courseResults.length > 0 && (
                    <View style={styles.courseDropdown}>
                      {courseResults.map((course) => (
                        <TouchableOpacity
                          key={course.id}
                          style={styles.courseDropdownRow}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedCourse(course);
                            setCourseSearch('');
                            setShowCoursePicker(false);
                          }}
                        >
                          <View style={styles.courseDropdownPin}>
                            <Ionicons name="disc" size={13} color={Colors.white} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Typo style={{ fontWeight: 'bold', fontSize: 13 }} numberOfLines={1}>
                              {course.name}
                            </Typo>
                            <Typo style={{ color: Colors.secondaryText, fontSize: 11 }}>
                              {course.city}{course.state ? `, ${course.state}` : ''} • {course.holeCount} Holes
                              {course.distanceMiles !== undefined ? ` • ${course.distanceMiles.toFixed(1)} mi` : ''}
                            </Typo>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Empty state */}
                  {showCoursePicker && courseSearch.length > 0 && courseResults.length === 0 && (
                    <View style={styles.courseDropdown}>
                      <Typo style={{ color: Colors.secondaryText, textAlign: 'center', padding: 16 }}>
                        No courses found. Try a different name or city.
                      </Typo>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* ── Tee Time ── */}
            <View style={styles.formGroup}>
              <Typo variant="label" style={styles.formLabel}>TEE TIME</Typo>
              <TextInput
                style={styles.formInput}
                value={newTimeText}
                onChangeText={setNewTimeText}
                placeholder="e.g. Today • 5:30 PM"
              />
            </View>

            {/* ── Game Format ── */}
            <View style={styles.formGroup}>
              <Typo variant="label" style={styles.formLabel}>GAME FORMAT</Typo>
              <View style={styles.formatsGrid}>
                {GAME_FORMATS.map((fmt) => {
                  const isSel = newFormat === fmt.id;
                  return (
                    <TouchableOpacity
                      key={fmt.id}
                      style={[styles.formatOption, isSel && styles.formatOptionSel]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNewFormat(fmt.id);
                      }}
                    >
                      <Ionicons
                        name={isSel ? fmt.iconFocused : fmt.icon}
                        size={20}
                        color={isSel ? Colors.white : Colors.primaryBlack}
                      />
                      <Typo style={[styles.formatOptionLabel, isSel && styles.formatOptionLabelSel]}>
                        {fmt.label}
                      </Typo>
                      <Typo style={[styles.formatOptionDesc, isSel && styles.formatOptionDescSel]}>
                        {fmt.description}
                      </Typo>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Max Players ── */}
            <View style={styles.formGroup}>
              <Typo variant="label" style={styles.formLabel}>MAX PLAYERS</Typo>
              <View style={styles.playerCountRow}>
                {[2, 3, 4, 6, 8].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.playerCountBtn, newMaxPlayers === n && styles.playerCountBtnSel]}
                    onPress={() => setNewMaxPlayers(n)}
                  >
                    <Typo style={[styles.playerCountText, newMaxPlayers === n && styles.playerCountTextSel]}>
                      {n}
                    </Typo>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button
              label="Host & Publish Group Card"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleCreateCard}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundSoft },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.base, paddingBottom: 32 },

  createCardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryBlack,
    borderRadius: BorderRadius.xl,
    paddingVertical: 20,
    paddingHorizontal: Spacing.xl,
    marginVertical: 8,
    ...Shadows.md,
  },
  createBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  createIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter Pills
  filterRow: { gap: 8, paddingBottom: 4 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  filterChipActive: { backgroundColor: Colors.primaryBlack, borderColor: Colors.primaryBlack },
  filterChipText: { fontSize: 12, fontWeight: 'bold', color: Colors.primaryBlack },
  filterChipTextActive: { color: Colors.white },

  sectionHeader: { marginTop: 4 },
  sectionTitle: { color: Colors.secondaryText, letterSpacing: 0.8, fontSize: 11, fontWeight: 'bold' },

  // Open Card Item
  openCardItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
    ...Shadows.sm,
  },
  skinsBorderCard: { borderColor: '#F59E0B', borderWidth: 1.5 },

  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formatTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  skinsFormatBadge: { backgroundColor: '#FEF3C7' },
  formatTagText: { fontSize: 10, fontWeight: 'bold', color: Colors.primaryBlack },
  skinsFormatText: { color: '#D97706' },
  cardTimeText: { color: Colors.secondaryText, fontSize: 12, fontWeight: '600' },
  cardCourseTitle: { fontWeight: 'bold', fontSize: 18, color: Colors.primaryBlack },

  playersRow: { flexDirection: 'row', alignItems: 'center' },
  avatarsStack: { flexDirection: 'row', alignItems: 'center' },
  avatarBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },

  joinCardBtn: {
    height: 48,
    backgroundColor: Colors.primaryBlack,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinCardBtnJoined: { backgroundColor: Colors.backgroundSoft, borderWidth: 1, borderColor: Colors.border },
  joinCardBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 14 },
  joinCardBtnTextJoined: { color: Colors.primaryBlack },

  // Modal
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: Spacing.lg,
    gap: 20,
    paddingBottom: 40,
  },

  // Form
  formGroup: { gap: 8 },
  formLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.secondaryText,
    letterSpacing: 0.8,
    fontFamily: Typography.fontFamily.semiBold,
  },
  formInput: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primaryBlack,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Course Search
  courseSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  courseSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.primaryBlack,
    fontFamily: Typography.fontFamily.regular,
    padding: 0,
  },
  selectedCourseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.blueLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.blueBorder,
    gap: 10,
  },
  selectedCourseInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  courseDropdown: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: 4,
    ...Shadows.md,
  },
  courseDropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  courseDropdownPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Game Format Grid
  formatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatOption: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 4,
    alignItems: 'flex-start',
  },
  formatOptionSel: {
    backgroundColor: Colors.primaryBlack,
    borderColor: Colors.primaryBlack,
  },
  formatOptionLabel: {
    fontWeight: 'bold',
    fontSize: 13,
    color: Colors.primaryBlack,
  },
  formatOptionLabelSel: { color: Colors.white },
  formatOptionDesc: {
    fontSize: 10,
    color: Colors.secondaryText,
    lineHeight: 13,
  },
  formatOptionDescSel: { color: 'rgba(255,255,255,0.7)' },

  // Max Players
  playerCountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  playerCountBtn: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCountBtnSel: {
    backgroundColor: Colors.primaryBlack,
    borderColor: Colors.primaryBlack,
  },
  playerCountText: { fontWeight: 'bold', fontSize: 16, color: Colors.primaryBlack },
  playerCountTextSel: { color: Colors.white },
});
