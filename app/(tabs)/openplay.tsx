import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { TabHeader } from '../../components/TabHeader';
import { AnimatedFadeIn } from '../../components/ui/AnimatedFadeIn';

export interface OpenCardItem {
  id: string;
  courseName: string;
  timeText: string;
  gameType: 'skins' | 'match' | 'stroke' | 'doubles';
  formatLabel: string;
  hostName: string;
  players: string[];
  maxPlayers: number;
  entryFee?: string;
  joined: boolean;
}

const INITIAL_OPEN_CARDS: OpenCardItem[] = [
  {
    id: 'card-1',
    courseName: 'Echo Valley DGC',
    timeText: 'Today • 5:30 PM',
    gameType: 'skins',
    formatLabel: 'SKINS GAME',
    hostName: 'Player',
    players: ['P1', 'P2'],
    maxPlayers: 4,
    entryFee: '$5 / skin',
    joined: false,
  },
  {
    id: 'card-2',
    courseName: 'Echo Valley DGC',
    timeText: 'Today • 2:30 PM',
    gameType: 'stroke',
    formatLabel: 'CASUAL STROKE',
    hostName: 'Player',
    players: ['P1', 'P2'],
    maxPlayers: 4,
    joined: false,
  },
  {
    id: 'card-3',
    courseName: 'Belmont Park',
    timeText: 'Today • 4:00 PM',
    gameType: 'match',
    formatLabel: 'MATCH PLAY',
    hostName: 'Player',
    players: ['P1'],
    maxPlayers: 4,
    joined: false,
  },
  {
    id: 'card-4',
    courseName: 'Caesar Ford Park',
    timeText: 'Today • 5:30 PM',
    gameType: 'doubles',
    formatLabel: 'BEST DISC DOUBLES',
    hostName: 'Player',
    players: ['P1', 'P2', 'P3'],
    maxPlayers: 4,
    joined: false,
  },
];

export default function OpenPlayScreen() {
  const [cardsList, setCardsList] = useState<OpenCardItem[]>(INITIAL_OPEN_CARDS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'skins' | 'match' | 'stroke'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Card Form State
  const [newCourseName, setNewCourseName] = useState('Echo Valley DGC');
  const [newTimeText, setNewTimeText] = useState('Today • 6:00 PM');
  const [newFormat, setNewFormat] = useState<'skins' | 'match' | 'stroke'>('skins');
  const [newMaxPlayers, setNewMaxPlayers] = useState(4);

  const handleJoinCard = (cardId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCardsList((prev) =>
      prev.map((card) => {
        if (card.id === cardId) {
          const isAlreadyJoined = card.joined;
          const updatedPlayers = isAlreadyJoined
            ? card.players.filter((p) => p !== 'You')
            : [...card.players, 'You'];
          return {
            ...card,
            joined: !isAlreadyJoined,
            players: updatedPlayers,
          };
        }
        return card;
      })
    );
  };

  const handleCreateCard = () => {
    if (!newCourseName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const formatLabelMap = {
      skins: '🔥 SKINS GAME',
      match: '🏆 MATCH PLAY',
      stroke: '🌿 STROKE PLAY',
    };

    const newCard: OpenCardItem = {
      id: `card-${Date.now()}`,
      courseName: newCourseName,
      timeText: newTimeText,
      gameType: newFormat,
      formatLabel: formatLabelMap[newFormat],
      hostName: 'You',
      players: ['You'],
      maxPlayers: newMaxPlayers,
      joined: true,
    };

    setCardsList((prev) => [newCard, ...prev]);
    setIsCreateModalOpen(false);
  };

  const filteredCards = cardsList.filter((card) => {
    if (activeFilter === 'skins') return card.gameType === 'skins';
    if (activeFilter === 'match') return card.gameType === 'match';
    if (activeFilter === 'stroke') return card.gameType === 'stroke';
    return true;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AnimatedFadeIn delay={0} style={{ paddingHorizontal: Spacing.lg }}>
        <TabHeader subtitle="Pickup Cards & Group Games" title="Open Play" />
      </AnimatedFadeIn>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create Open Card Banner */}
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
              <View style={styles.flameIconBadge}>
                <Ionicons name="flame" size={24} color={Colors.primaryBlack} />
              </View>
              <View>
                <Typo variant="bodyMedium" style={{ fontWeight: 'bold', color: Colors.white }}>
                  Create an Open Card
                </Typo>
                <Typo variant="caption" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Host a pickup round or Skins game for local disc golfers
                </Typo>
              </View>
            </View>
            <Ionicons name="add-circle" size={26} color={Colors.white} />
          </TouchableOpacity>
        </AnimatedFadeIn>

        {/* Filter Pills */}
        <AnimatedFadeIn delay={100}>
          <View style={styles.filterRow}>
            {(['all', 'skins', 'match', 'stroke'] as const).map((filterKey) => {
              const isActive = activeFilter === filterKey;
              const labels = {
                all: 'All Cards',
                skins: 'Skins',
                match: 'Match Play',
                stroke: 'Stroke Play',
              };
              const icons: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
                all: 'grid-outline',
                skins: 'flame-outline',
                match: 'trophy-outline',
                stroke: 'disc-outline',
              };
              return (
                <TouchableOpacity
                  key={filterKey}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveFilter(filterKey);
                  }}
                >
                  <Ionicons name={icons[filterKey]} size={13} color={isActive ? Colors.white : Colors.primaryBlack} />
                  <Typo style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {labels[filterKey]}
                  </Typo>
                </TouchableOpacity>
              );
            })}
          </View>
        </AnimatedFadeIn>

        {/* Open Cards Section Title */}
        <AnimatedFadeIn delay={150}>
          <View style={styles.sectionHeader}>
            <Typo variant="label" style={styles.sectionTitle}>
              OPEN CARDS NEAR YOU ({filteredCards.length})
            </Typo>
          </View>
        </AnimatedFadeIn>

        {/* Open Cards List */}
        {filteredCards.map((card, index) => {
          const spotsRemaining = card.maxPlayers - card.players.length;
          const gameIcon = card.gameType === 'skins' ? 'flame' : card.gameType === 'match' ? 'trophy' : 'disc';
          return (
            <AnimatedFadeIn key={card.id} delay={200 + index * 50}>
              <View style={[styles.openCardItem, card.gameType === 'skins' && styles.skinsBorderCard]}>
                {/* Format Tag & Time */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.formatTagBadge, card.gameType === 'skins' && styles.skinsFormatBadge]}>
                    <Ionicons name={gameIcon} size={12} color={card.gameType === 'skins' ? '#D97706' : Colors.primaryBlack} />
                    <Typo style={[styles.formatTagText, card.gameType === 'skins' && styles.skinsFormatText]}>
                      {card.formatLabel}
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
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Typo variant="bodyMedium" style={{ fontWeight: 'bold', fontSize: 13 }}>
                      {card.players.length} / {card.maxPlayers} Players
                    </Typo>
                    <Typo variant="caption" style={{ color: Colors.secondaryText }}>
                      {spotsRemaining > 0 ? `${spotsRemaining} spots remaining` : 'Card Full!'}
                    </Typo>
                  </View>

                </View>

                {/* Join Card Button */}
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
                    {card.joined ? 'JOINED CARD' : 'JOIN CARD'}
                  </Typo>
                </TouchableOpacity>
              </View>
            </AnimatedFadeIn>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* CREATE OPEN CARD MODAL */}
      <Modal visible={isCreateModalOpen} animationType="slide" onRequestClose={() => setIsCreateModalOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top']}>
          <View style={styles.modalHeader}>
            <Typo variant="h2" style={{ fontWeight: 'bold' }}>Create Open Card</Typo>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCreateModalOpen(false)}>
              <Ionicons name="close" size={22} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg, gap: 16 }}>
            <View style={styles.formGroup}>
              <Typo variant="label" style={styles.formLabel}>COURSE NAME</Typo>
              <TextInput
                style={styles.formInput}
                value={newCourseName}
                onChangeText={setNewCourseName}
                placeholder="e.g. Echo Valley DGC"
              />
            </View>

            <View style={styles.formGroup}>
              <Typo variant="label" style={styles.formLabel}>TEE TIME</Typo>
              <TextInput
                style={styles.formInput}
                value={newTimeText}
                onChangeText={setNewTimeText}
                placeholder="e.g. Today • 5:30 PM"
              />
            </View>

            <View style={styles.formGroup}>
              <Typo variant="label" style={styles.formLabel}>GAME FORMAT</Typo>
              <View style={styles.formatSelectRow}>
                {(['skins', 'match', 'stroke'] as const).map((fmt) => {
                  const isSel = newFormat === fmt;
                  const labels = { skins: '🔥 Skins', match: '🏆 Match', stroke: '🌿 Stroke' };
                  return (
                    <TouchableOpacity
                      key={fmt}
                      style={[styles.formatSelectBtn, isSel && styles.formatSelectBtnSel]}
                      onPress={() => setNewFormat(fmt)}
                    >
                      <Typo style={[styles.formatSelectText, isSel && styles.formatSelectTextSel]}>
                        {labels[fmt]}
                      </Typo>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Button
              label="Host & Publish Open Card"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleCreateCard}
              style={{ marginTop: 12 }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

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
  flameIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  filterChipActive: { backgroundColor: Colors.primaryBlack, borderColor: Colors.primaryBlack },
  filterChipText: { fontSize: 12, fontWeight: 'bold', color: Colors.primaryBlack },
  filterChipTextActive: { color: Colors.white },

  sectionHeader: { marginTop: 8 },
  sectionTitle: { color: Colors.secondaryText, letterSpacing: 0.8, fontSize: 11, fontWeight: 'bold' },

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

  playersRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
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
  avatarInitial: { color: Colors.white, fontWeight: 'bold', fontSize: 13 },
  entryFeeBadge: { backgroundColor: Colors.backgroundSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.md },
  entryFeeText: { fontSize: 10, fontWeight: 'bold', color: Colors.primaryBlack },

  joinCardBtn: {
    height: 48,
    backgroundColor: Colors.primaryBlack,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  joinCardBtnJoined: { backgroundColor: Colors.backgroundSoft, borderWidth: 1, borderColor: Colors.border },
  joinCardBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 14 },
  joinCardBtnTextJoined: { color: Colors.primaryBlack },

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
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.backgroundSoft, alignItems: 'center', justifyContent: 'center' },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 11, fontWeight: 'bold', color: Colors.secondaryText, letterSpacing: 0.8 },
  formInput: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primaryBlack,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formatSelectRow: { flexDirection: 'row', gap: 8 },
  formatSelectBtn: { flex: 1, paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  formatSelectBtnSel: { backgroundColor: Colors.primaryBlack, borderColor: Colors.primaryBlack },
  formatSelectText: { fontWeight: 'bold', fontSize: 12, color: Colors.primaryBlack },
  formatSelectTextSel: { color: Colors.white },
});
