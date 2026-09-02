import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { TabHeader } from '../../components/TabHeader';
import { AnimatedFadeIn } from '../../components/ui/AnimatedFadeIn';
import { DiscSpinner } from '../../components/ui/DiscSpinner';
import { useAuthStore } from '../../store/authStore';
import { ScoreTrendMountainChart } from '../../components/ui/ScoreTrendMountainChart';
import { searchDiscs, TRYDISCS_ATTRIBUTION } from '../../lib/trydiscs';

type ProfileSubTab = 'profile' | 'friends' | 'settings';

const FULL_ROUNDS_HISTORY = [
  {
    id: 'r-1',
    course: 'Maple Hill DGC (Golds)',
    date: 'May 18, 2025',
    diff: '-4',
    score: 54,
    par: 58,
    eagles: 1,
    birdies: 6,
    pars: 8,
    bogeys: 2,
    doubleBogeys: 1,
    holeScores: [3, 2, 4, 3, 2, 3, 4, 3, 3, 2, 3, 4, 3, 2, 3, 4, 2, 3],
    holePars:   [3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 3, 4, 3, 3, 3, 4, 3, 3],
  },
  {
    id: 'r-2',
    course: 'Pine Ridge DGC',
    date: 'May 11, 2025',
    diff: '+2',
    score: 58,
    par: 56,
    eagles: 0,
    birdies: 4,
    pars: 10,
    bogeys: 3,
    doubleBogeys: 1,
    holeScores: [3, 4, 3, 4, 3, 2, 4, 4, 3, 3, 4, 3, 4, 3, 3, 3, 4, 3],
    holePars:   [3, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 3, 4, 3, 3, 3, 3, 3],
  },
  {
    id: 'r-3',
    course: 'Oak Grove DGC',
    date: 'May 4, 2025',
    diff: '-1',
    score: 55,
    par: 56,
    eagles: 0,
    birdies: 5,
    pars: 9,
    bogeys: 4,
    doubleBogeys: 0,
    holeScores: [2, 3, 3, 3, 4, 2, 3, 4, 3, 3, 2, 4, 3, 3, 4, 3, 3, 3],
    holePars:   [3, 3, 3, 3, 3, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 3, 3, 3],
  },
];

const MOCK_BAG_DISCS = [
  {
    id: 'volt',
    name: 'Volt',
    brand: 'MVP',
    plastic: 'Neutron',
    color: '#0055FF',
    discTextColor: '#FFFFFF',
    speed: 8,
    glide: 5,
    turn: -0.5,
    fade: 2,
    confidence: '92%',
    avgDistance: '276 ft',
    usage: '18%',
    featured: true,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    brand: 'Discmania',
    plastic: 'Neo',
    color: '#F4F4F6',
    discTextColor: '#09090A',
    speed: 7,
    glide: 5,
    turn: 0,
    fade: 2,
    confidence: null,
    avgDistance: '242 ft',
    usage: '24%',
    featured: false,
  },
  {
    id: 'firebird',
    name: 'Firebird',
    brand: 'Innova',
    plastic: 'Champion',
    color: '#EF4444',
    discTextColor: '#FFFFFF',
    speed: 9,
    glide: 3,
    turn: 0,
    fade: 4,
    confidence: null,
    avgDistance: '325 ft',
    usage: '15%',
    featured: false,
  },
  {
    id: 'luna',
    name: 'Luna',
    brand: 'Discraft',
    plastic: 'Jawbreaker',
    color: '#D8B4FE',
    discTextColor: '#09090A',
    speed: 3,
    glide: 3,
    turn: 0,
    fade: 2,
    confidence: null,
    avgDistance: '195 ft',
    usage: '16%',
    featured: false,
  },
];

const MOCK_SHOP_ITEMS = [
  {
    id: 'volt-aced',
    title: 'ACED Pro Volt (Special Edition)',
    category: 'Discs',
    price: '$24.99',
    image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500&auto=format&fit=crop&q=80',
    tag: 'Bestseller',
  },
  {
    id: 'hoodie',
    title: 'ACED Tour Hoodie (Black)',
    category: 'Apparel',
    price: '$68.00',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80',
    tag: 'New',
  },
  {
    id: 'rangefinder',
    title: 'ACED Laser GPS Rangefinder',
    category: 'Gear',
    price: '$189.00',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=80',
    tag: 'Pro Tech',
  },
  {
    id: 'caddie-pass',
    title: 'ACED Smart Caddie Pro (1 Year)',
    category: 'Subscription',
    price: '$29.99/yr',
    image: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=500&auto=format&fit=crop&q=80',
    tag: 'Popular',
  },
];

const MOCK_FRIENDS = [
  { id: 'f-1', name: 'Jake Miller', username: 'jakemiller', handicap: 3.0, isLive: true, currentCourse: 'Maple Hill DGC' },
  { id: 'f-2', name: 'Mike Chen', username: 'mikechen', handicap: 12.4, isLive: true, currentCourse: 'Maple Hill DGC' },
  { id: 'f-3', name: 'Sarah Jenkins', username: 'sarahj', handicap: 6.8, isLive: false },
  { id: 'f-4', name: 'David Ross', username: 'dross', handicap: 14.1, isLive: false },
];

const MOCK_LIVE_GAMES = [
  {
    id: 'lg-1',
    courseName: 'Maple Hill Disc Golf Course',
    gameType: 'Skins Game',
    players: ['Jake Miller', 'Mike Chen', 'Sarah Jenkins'],
    currentHole: 8,
    statusText: '🔥 4 SKINS CARRYING ON HOLE 8',
    leaderboard: [
      { name: 'Jake Miller', score: '3 skins', totalStrokes: 24, rel: '-2' },
      { name: 'Sarah Jenkins', score: '2 skins', totalStrokes: 26, rel: 'E' },
      { name: 'Mike Chen', score: '1 skin', totalStrokes: 28, rel: '+2' },
    ],
  },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [activeSegment, setActiveSegment] = useState<'profile' | 'friends' | 'settings'>('profile');
  const [addFriendModalVisible, setAddFriendModalVisible] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendsList, setFriendsList] = useState(MOCK_FRIENDS);
  const [newFriendHandle, setNewFriendHandle] = useState('');
  const [selectedHistoryRound, setSelectedHistoryRound] = useState<typeof FULL_ROUNDS_HISTORY[0] | null>(null);
  const [isAllRoundsModalVisible, setIsAllRoundsModalVisible] = useState(false);

  // Native Settings Switch States
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(true);
  const [gpsHighPrecision, setGpsHighPrecision] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  const handleAddFriend = () => {
    if (!newFriendHandle.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const cleanHandle = newFriendHandle.replace('@', '').trim();
    const newFriend = {
      id: `friend-${Date.now()}`,
      name: cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1),
      username: cleanHandle.toLowerCase(),
      handicap: (Math.random() * 8 + 1).toFixed(1),
      isLive: false,
    };
    setFriendsList((prev: any) => [newFriend, ...prev]);
    setNewFriendHandle('');
    setAddFriendModalVisible(false);
  };

  const userName = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Ricky';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Uniform Top Header */}
      <AnimatedFadeIn delay={0} style={{ paddingHorizontal: Spacing.lg }}>
        <TabHeader subtitle="Your stats" title={userName} />
      </AnimatedFadeIn>

      {/* Segmented Sub Nav Control */}
      <AnimatedFadeIn delay={100}>
        <View style={styles.segmentContainer}>
          {(['profile', 'friends', 'settings'] as const).map((seg) => {
            const isAct = activeSegment === seg;
            const labels: Record<string, string> = {
              profile: 'Profile',
              friends: 'Friends',
              settings: 'Settings',
            };
            return (
              <TouchableOpacity
                key={seg}
                style={[styles.segmentBtn, isAct && styles.segmentBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveSegment(seg as any);
                }}
              >
                <Typo style={[styles.segmentText, isAct && styles.segmentTextActive]}>
                  {labels[seg]}
                </Typo>
              </TouchableOpacity>
            );
          })}
        </View>
      </AnimatedFadeIn>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* TAB 1: PROFILE */}
        {activeSegment === 'profile' && (
          <View style={styles.tabContent}>
            {/* Guest/Golfer User Overview Hero Card */}
            <View style={styles.userProfileHeroCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={32} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Typo variant="h2" style={{ fontWeight: 'bold' }}>{userName}</Typo>
                <Typo variant="caption" style={{ color: Colors.secondaryText }}>@{userName.toLowerCase()} • Member since 2024</Typo>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  <View style={styles.handicapBadgeHero}>
                    <Typo style={{ fontSize: 10, fontWeight: 'bold', color: Colors.white }}>ACED +2.4</Typo>
                  </View>
                  <View style={styles.roundsBadgeHero}>
                    <Typo style={{ fontSize: 10, fontWeight: 'bold', color: Colors.primaryBlack }}>182 Rounds</Typo>
                  </View>
                </View>
              </View>
            </View>

            {/* CAREER BEST RECORD */}
            <View style={styles.sectionHeader}>
              <Typo variant="label" style={styles.sectionTitle}>CAREER BEST RECORD</Typo>
            </View>
            <View style={styles.personalBestBanner}>
              <View style={styles.starBox}>
                <Ionicons name="star" size={20} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Typo variant="caption" style={styles.pbLabel}>PERSONAL BEST</Typo>
                <Typo variant="bodyMedium" style={styles.pbTitle}>Career Best Round</Typo>
                <Typo variant="caption" style={styles.pbSub}>-7 (47) at Maple Hill DGC</Typo>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Typo variant="display" style={styles.pbScoreVal}>-7</Typo>
                <Typo variant="caption" style={styles.pbDate}>Apr 12, 2025</Typo>
              </View>
            </View>

            {/* RECENT ROUNDS HISTORY */}
            <View style={styles.sectionHeader}>
              <Typo variant="label" style={styles.sectionTitle}>RECENT ROUNDS HISTORY</Typo>
              <TouchableOpacity onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsAllRoundsModalVisible(true);
              }}>
                <Typo style={styles.seeAllText}>See All →</Typo>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {FULL_ROUNDS_HISTORY.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recentRoundMiniCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSelectedHistoryRound(item);
                  }}
                >
                  <Typo variant="bodyMedium" style={styles.recentMiniCourse} numberOfLines={1}>
                    {item.course}
                  </Typo>
                  <Typo variant="caption" style={styles.recentMiniDate}>{item.date}</Typo>
                  <View style={styles.recentMiniScoreRow}>
                    <View style={[styles.miniDiffBadge, { backgroundColor: item.diff.startsWith('-') ? Colors.blueLight : Colors.redLight }]}>
                      <Typo style={[styles.miniDiffText, { color: item.diff.startsWith('-') ? Colors.blue : Colors.red }]}>{item.diff}</Typo>
                    </View>
                    <Typo variant="h3" style={styles.miniScoreVal}>{item.score}</Typo>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* SCORE TREND MOUNTAIN CHART */}
            <View style={{ marginTop: 8 }}>
              <ScoreTrendMountainChart />
            </View>

            {/* PERFORMANCE BREAKDOWN */}
            <View style={styles.sectionHeader}>
              <Typo variant="label" style={styles.sectionTitle}>PERFORMANCE BREAKDOWN</Typo>
            </View>
            <View style={styles.breakdownCard}>
              <View style={styles.multiBar}>
                <View style={[styles.barSegment, { width: '42%', backgroundColor: Colors.blue }]} />
                <View style={[styles.barSegment, { width: '32%', backgroundColor: '#38BDF8' }]} />
                <View style={[styles.barSegment, { width: '12%', backgroundColor: Colors.green }]} />
                <View style={[styles.barSegment, { width: '6%', backgroundColor: Colors.orange }]} />
                <View style={[styles.barSegment, { width: '8%', backgroundColor: Colors.red }]} />
              </View>
              <View style={styles.breakdownLegend}>
                <View style={styles.legendCol}><Typo variant="bodyMedium">42%</Typo><Typo variant="caption">Birdies</Typo></View>
                <View style={styles.legendCol}><Typo variant="bodyMedium">32%</Typo><Typo variant="caption">Pars</Typo></View>
                <View style={styles.legendCol}><Typo variant="bodyMedium">12%</Typo><Typo variant="caption">Bogeys</Typo></View>
                <View style={styles.legendCol}><Typo variant="bodyMedium">6%</Typo><Typo variant="caption">Dbl Bogeys</Typo></View>
                <View style={styles.legendCol}><Typo variant="bodyMedium">8%</Typo><Typo variant="caption">Other</Typo></View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: FRIENDS */}
        {activeSegment === 'friends' && (
          <View style={styles.tabContent}>
            {/* Add Friend Banner */}
            <TouchableOpacity style={styles.addFriendBanner} onPress={() => setAddFriendModalVisible(true)}>
              <Ionicons name="person-add" size={18} color={Colors.white} />
              <Typo style={{ color: Colors.white, fontWeight: 'bold', fontSize: 13 }}>+ Add Friend by Handle</Typo>
            </TouchableOpacity>

            {/* MY FRIENDS LIST */}
            <View style={styles.cardSection}>
              <Typo variant="label" style={styles.sectionLabel}>MY FRIENDS ({friendsList.length})</Typo>
              {friendsList.map((f) => (
                <View key={f.id} style={styles.friendRow}>
                  <Ionicons name="person-circle-outline" size={34} color={Colors.primaryBlack} />
                  <View style={{ flex: 1 }}>
                    <Typo style={{ fontWeight: 'bold', fontSize: 14 }}>{f.name}</Typo>
                    <Typo style={{ color: Colors.secondaryText, fontSize: 11 }}>@{f.username} • ACED {f.handicap}</Typo>
                  </View>
                  <View style={[styles.statusDot, f.isLive ? styles.statusDotLive : styles.statusDotOnline]} />
                  <Typo style={styles.statusText}>{f.isLive ? 'In Round' : 'Online'}</Typo>
                  <TouchableOpacity
                    style={{ padding: 6, marginLeft: 6 }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFriendsList((prev) => prev.filter((item) => item.id !== f.id));
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.gray400} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TAB 3: SETTINGS */}
        {activeSegment === 'settings' && (
          <View style={styles.tabContent}>
            <View style={styles.cardSection}>
              <Typo variant="label" style={styles.sectionLabel}>APP & GOLFER SETTINGS</Typo>
              <View style={styles.settingsGroupCard}>
                {/* Native Toggle 1 */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLeft}>
                    <Ionicons name="phone-portrait-outline" size={18} color={Colors.primaryBlack} />
                    <Typo variant="bodyMedium">Haptics & Buzz</Typo>
                  </View>
                  <Switch
                    value={hapticsEnabled}
                    onValueChange={(val) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setHapticsEnabled(val);
                    }}
                    trackColor={{ false: Colors.border, true: Colors.blue }}
                  />
                </View>
                <View style={styles.settingDivider} />

                {/* Native Toggle 2 */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLeft}>
                    <Ionicons name="notifications-outline" size={18} color={Colors.primaryBlack} />
                    <Typo variant="bodyMedium">Course Notifications</Typo>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: Colors.border, true: Colors.blue }}
                  />
                </View>
                <View style={styles.settingDivider} />

                {/* Native Toggle 3 */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLeft}>
                    <Ionicons name="cloud-outline" size={18} color={Colors.primaryBlack} />
                    <Typo variant="bodyMedium">Weather Alerts</Typo>
                  </View>
                  <Switch
                    value={weatherAlertsEnabled}
                    onValueChange={setWeatherAlertsEnabled}
                    trackColor={{ false: Colors.border, true: Colors.blue }}
                  />
                </View>
                <View style={styles.settingDivider} />

                {/* Native Toggle 4 */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLeft}>
                    <Ionicons name="location-outline" size={18} color={Colors.primaryBlack} />
                    <Typo variant="bodyMedium">GPS High Precision Mode</Typo>
                  </View>
                  <Switch
                    value={gpsHighPrecision}
                    onValueChange={setGpsHighPrecision}
                    trackColor={{ false: Colors.border, true: Colors.blue }}
                  />
                </View>
                <View style={styles.settingDivider} />

                {/* Native Toggle 5 */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLeft}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primaryBlack} />
                    <Typo variant="bodyMedium">Public Profile</Typo>
                  </View>
                  <Switch
                    value={publicProfile}
                    onValueChange={setPublicProfile}
                    trackColor={{ false: Colors.border, true: Colors.blue }}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
              <Ionicons name="log-out-outline" size={18} color={Colors.red} />
              <Typo style={styles.signOutText}>Sign Out</Typo>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ADD FRIEND MODAL */}
      <Modal visible={addFriendModalVisible} animationType="slide" onRequestClose={() => setAddFriendModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top']}>
          <View style={styles.modalHeader}>
            <Typo variant="h2" style={{ fontWeight: 'bold' }}>Add Friend</Typo>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setAddFriendModalVisible(false)}>
              <Ionicons name="close" size={22} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: Spacing.lg, gap: 12 }}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.gray400} />
              <TextInput
                style={styles.searchInput}
                placeholder="Enter friend username handle (e.g. @jakemiller)..."
                placeholderTextColor={Colors.gray400}
                value={newFriendHandle}
                onChangeText={setNewFriendHandle}
              />
            </View>
            <Button
              label="+ Add Friend to ACED"
              variant="primary"
              size="md"
              fullWidth
              onPress={handleAddFriend}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* 18-HOLE GOLF SCORECARD MODAL */}
      <Modal
        visible={selectedHistoryRound !== null}
        animationType="slide"
        onRequestClose={() => setSelectedHistoryRound(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top']}>
          {selectedHistoryRound && (
            <>
              <View style={styles.modalHeader}>
                <View>
                  <Typo variant="h2" style={{ fontWeight: 'bold' }}>{selectedHistoryRound.course}</Typo>
                  <Typo variant="caption" style={{ color: Colors.secondaryText }}>
                    {selectedHistoryRound.date} • Score: {selectedHistoryRound.diff} ({selectedHistoryRound.score} Throws)
                  </Typo>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedHistoryRound(null)}>
                  <Ionicons name="close" size={22} color={Colors.primaryBlack} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg, gap: 16 }}>
                {/* Round Summary Header Banner */}
                <View style={styles.scorecardHeroBanner}>
                  <View style={{ flex: 1 }}>
                    <Typo style={{ color: Colors.white, fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 }}>
                      ROUND SUMMARY
                    </Typo>
                    <Typo style={{ color: Colors.white, fontSize: 28, fontWeight: 'bold', marginTop: 2 }}>
                      {selectedHistoryRound.diff} ({selectedHistoryRound.score})
                    </Typo>
                    <Typo style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, marginTop: 2 }}>
                      Par {selectedHistoryRound.par} • 18 Holes Completed
                    </Typo>
                  </View>

                  <View style={{ gap: 4, alignItems: 'flex-end' }}>
                    <View style={styles.summaryBadgeChip}><Typo style={styles.summaryBadgeText}>🦅 {selectedHistoryRound.eagles} Eagles</Typo></View>
                    <View style={styles.summaryBadgeChip}><Typo style={styles.summaryBadgeText}>🐥 {selectedHistoryRound.birdies} Birdies</Typo></View>
                    <View style={styles.summaryBadgeChip}><Typo style={styles.summaryBadgeText}>⚖️ {selectedHistoryRound.pars} Pars</Typo></View>
                  </View>
                </View>

                {/* 18-Hole Grid Scorecard */}
                <Typo variant="label" style={{ color: Colors.secondaryText, letterSpacing: 0.8 }}>
                  18-HOLE SCORECARD BREAKDOWN
                </Typo>

                <View style={styles.fullScorecardGridContainer}>
                  {/* Front 9 */}
                  <Typo style={{ fontWeight: 'bold', fontSize: 12, color: Colors.blue }}>FRONT 9</Typo>
                  <View style={styles.scoreRowGrid}>
                    {selectedHistoryRound.holeScores.slice(0, 9).map((num, idx) => {
                      const par = selectedHistoryRound.holePars[idx];
                      const diff = num - par;
                      return (
                        <View key={idx} style={styles.scoreGridBox}>
                          <Typo style={{ fontSize: 9, color: Colors.secondaryText, fontWeight: 'bold' }}>H{idx + 1}</Typo>
                          <Typo style={{ fontSize: 14, fontWeight: 'bold', color: diff < 0 ? Colors.blue : diff > 0 ? Colors.red : Colors.primaryBlack }}>
                            {num}
                          </Typo>
                          <Typo style={{ fontSize: 8, color: Colors.secondaryText }}>P{par}</Typo>
                        </View>
                      );
                    })}
                  </View>

                  {/* Back 9 */}
                  <Typo style={{ fontWeight: 'bold', fontSize: 12, color: Colors.blue, marginTop: 8 }}>BACK 9</Typo>
                  <View style={styles.scoreRowGrid}>
                    {selectedHistoryRound.holeScores.slice(9, 18).map((num, idx) => {
                      const realHoleIdx = idx + 9;
                      const par = selectedHistoryRound.holePars[realHoleIdx];
                      const diff = num - par;
                      return (
                        <View key={idx} style={styles.scoreGridBox}>
                          <Typo style={{ fontSize: 9, color: Colors.secondaryText, fontWeight: 'bold' }}>H{realHoleIdx + 1}</Typo>
                          <Typo style={{ fontSize: 14, fontWeight: 'bold', color: diff < 0 ? Colors.blue : diff > 0 ? Colors.red : Colors.primaryBlack }}>
                            {num}
                          </Typo>
                          <Typo style={{ fontSize: 8, color: Colors.secondaryText }}>P{par}</Typo>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* FULL ROUND HISTORY MODAL */}
      <Modal visible={isAllRoundsModalVisible} animationType="slide" onRequestClose={() => setIsAllRoundsModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top']}>
          <View style={styles.modalHeader}>
            <View>
              <Typo variant="h2" style={{ fontWeight: 'bold' }}>Round History</Typo>
              <Typo variant="caption" style={{ color: Colors.secondaryText }}>All completed rounds ({FULL_ROUNDS_HISTORY.length})</Typo>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsAllRoundsModalVisible(false)}>
              <Ionicons name="close" size={22} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg, gap: 10 }}>
            {FULL_ROUNDS_HISTORY.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.fullRoundCard}
                activeOpacity={0.88}
                onPress={() => {
                  setIsAllRoundsModalVisible(false);
                  setSelectedHistoryRound(item);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Typo style={{ fontWeight: 'bold', fontSize: 16 }}>{item.course}</Typo>
                  <Typo style={{ color: Colors.secondaryText, fontSize: 12 }}>{item.date} • Main Layout</Typo>
                </View>
                <View style={styles.fullRoundScoreBox}>
                  <Typo style={{ fontSize: 18, fontWeight: 'bold' }}>{item.score}</Typo>
                  <Typo style={{ fontSize: 11, fontWeight: 'bold', color: item.diff.startsWith('-') ? Colors.blue : Colors.red }}>({item.diff})</Typo>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const SettingItem: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.settingRow}>
    <View style={styles.settingLeft}>
      <Ionicons name={icon as any} size={18} color={Colors.primaryBlack} />
      <Typo variant="bodyMedium">{label}</Typo>
    </View>
    <Typo variant="small" style={styles.settingValText}>{value}</Typo>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 36 },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    marginBottom: Spacing.md,
  },

  // Segment Bar
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.xl,
    padding: 4,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  segmentBtnActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  segmentText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryText,
  },
  segmentTextActive: {
    color: Colors.blue,
    fontFamily: Typography.fontFamily.bold,
  },

  tabContent: { gap: Spacing.base, paddingTop: Spacing.sm },
  cardSection: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  seeAllText: { color: Colors.blue, fontWeight: 'bold', fontSize: 12 },
  fullRoundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 12,
  },
  fullRoundScoreBox: { alignItems: 'flex-end' },
  sectionLabel: { fontSize: Typography.size.xs, color: Colors.secondaryText, fontFamily: Typography.fontFamily.semiBold, letterSpacing: 0.8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  settingValText: { color: Colors.secondaryText, fontFamily: Typography.fontFamily.medium },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.redLight,
    marginTop: Spacing.md,
  },
  signOutText: { color: Colors.red, fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },

  // Stats
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Typography.size.xs, color: Colors.secondaryText, fontFamily: Typography.fontFamily.semiBold, letterSpacing: 0.8 },
  horizontalScroll: { gap: Spacing.md, paddingBottom: Spacing.md },
  recentRoundMiniCard: { width: 140, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: 4, ...Shadows.sm },
  recentMiniCourse: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },
  recentMiniDate: { color: Colors.secondaryText, fontSize: 10 },
  recentMiniScoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  miniDiffBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.sm },
  miniDiffText: { fontFamily: Typography.fontFamily.bold, fontSize: 13 },
  miniScoreVal: { fontFamily: Typography.fontFamily.bold, fontSize: 18 },

  personalBestBanner: { backgroundColor: Colors.blue, borderRadius: BorderRadius.xl, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginBottom: Spacing.md, ...Shadows.md },
  starBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  pbLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontFamily: Typography.fontFamily.bold, letterSpacing: 0.5 },
  pbTitle: { color: Colors.white, fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },
  pbSub: { color: 'rgba(255,255,255,0.85)', fontSize: Typography.size.xs },
  pbScoreVal: { color: Colors.white, fontSize: 32, fontFamily: Typography.fontFamily.bold },
  pbDate: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },

  overviewGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  gaugeCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center', gap: 8, ...Shadows.sm },
  gaugeTitle: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: Colors.secondaryText },
  circleGauge: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  gaugeNum: { fontFamily: Typography.fontFamily.bold, fontSize: 14, color: Colors.primaryBlack },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  trendText: { fontSize: 9, color: Colors.green, fontFamily: Typography.fontFamily.medium },

  breakdownCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginBottom: Spacing.md, gap: Spacing.base, ...Shadows.sm },
  multiBar: { height: 10, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' },
  barSegment: { height: '100%' },
  breakdownLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  legendCol: { alignItems: 'center' },

  // Bag
  bagHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  discCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm },
  discCardFeatured: { borderColor: Colors.blue, borderWidth: 2 },
  cardMainRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  discArtwork: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  discArtworkText: { fontSize: 9, fontFamily: Typography.fontFamily.bold },
  discMetaInfo: { flex: 1 },
  discNameTitle: { fontSize: Typography.size.base, fontFamily: Typography.fontFamily.bold },
  discBrandText: { color: Colors.secondaryText, fontSize: Typography.size.xs, marginBottom: 4 },
  flightGrid: { flexDirection: 'row', gap: 8 },
  flightBoxItem: { alignItems: 'center' },
  rightStatsCol: { alignItems: 'flex-end', gap: 4 },
  confidenceBadge: { borderWidth: 1, borderColor: Colors.blue, borderRadius: BorderRadius.full, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: Colors.blueLight },
  confidenceText: { fontSize: 8, color: Colors.blue, fontFamily: Typography.fontFamily.bold },
  distValue: { fontSize: 12, fontFamily: Typography.fontFamily.bold },
  statSubLabel: { fontSize: 8, color: Colors.secondaryText, fontFamily: Typography.fontFamily.semiBold },
  attribution: { color: Colors.blue, textAlign: 'center', marginVertical: Spacing.base, textDecorationLine: 'underline' },

  // Shop
  shopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  shopCard: { width: '47%', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', position: 'relative', ...Shadows.sm },
  shopImg: { width: '100%', height: 110 },
  shopTagPill: { position: 'absolute', top: 8, left: 8, backgroundColor: Colors.blue, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  shopTagText: { color: Colors.white, fontSize: 9, fontFamily: Typography.fontFamily.bold },
  shopBody: { padding: Spacing.md, gap: 4 },
  shopTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.sm, lineHeight: 18 },
  shopCat: { color: Colors.secondaryText, fontSize: Typography.size.xs },
  shopBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  shopPrice: { fontSize: Typography.size.base, fontFamily: Typography.fontFamily.bold, color: Colors.primaryBlack },
  buyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },

  // Scorecard Modal Styles
  scorecardHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBlack,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  summaryBadgeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  summaryBadgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  fullScorecardGridContainer: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  scoreRowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  scoreGridBox: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalSearch: { padding: Spacing.lg },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundSoft, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 12, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.base, color: Colors.primaryBlack, padding: 0 },
  searchResultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // User Overview Hero Card & Settings Group
  userProfileHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.sm,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handicapBadgeHero: { backgroundColor: Colors.blue, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  roundsBadgeHero: { backgroundColor: Colors.backgroundSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  settingsGroupCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  settingDivider: { height: 1, backgroundColor: Colors.border },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  // Friends & Live Games
  addFriendBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryBlack, borderRadius: BorderRadius.xl, paddingVertical: 12, gap: 8, marginBottom: 8 },
  liveGroupSection: { gap: 8, marginBottom: 12 },
  liveGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveIndicatorPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  liveGameCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderColor: Colors.blue, padding: Spacing.md, gap: 8, ...Shadows.sm },
  liveGameTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gameTypeBadge: { backgroundColor: Colors.backgroundSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  liveGameStatusRow: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.md },
  liveGameStatusText: { color: '#92400E', fontWeight: 'bold', fontSize: 11 },
  joinLiveScoreboardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.blue, borderRadius: BorderRadius.lg, paddingVertical: 10, gap: 6 },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusDotLive: { backgroundColor: '#EF4444' },
  statusDotOnline: { backgroundColor: '#10B981' },
  statusText: { fontSize: 10, fontWeight: 'bold', color: Colors.secondaryText },
  liveScoreboardStatusBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryBlack, padding: Spacing.md, borderRadius: BorderRadius.xl, gap: 8 },
  liveLeaderboardRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  liveLeaderboardRank: { fontWeight: 'bold', fontSize: 16, width: 20, textAlign: 'center' },
  liveScoreChip: { backgroundColor: Colors.blueLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.full },
  liveScoreChipText: { color: Colors.blue, fontWeight: 'bold', fontSize: 12 },
});
