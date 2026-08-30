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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { TabHeader } from '../../components/TabHeader';
import { useAuthStore } from '../../store/authStore';
import { searchDiscs, TRYDISCS_ATTRIBUTION } from '../../lib/trydiscs';

type ProfileSubTab = 'profile' | 'stats' | 'bag' | 'shop';

const MOCK_RECENT = [
  { course: 'Maple Hill DGC', date: 'May 18, 2025', diff: '-4', score: 54, color: Colors.blue },
  { course: 'Pine Ridge DGC', date: 'May 11, 2025', diff: '+2', score: 58, color: Colors.red },
  { course: 'Oak Grove DGC', date: 'May 4, 2025', diff: '-1', score: 55, color: Colors.green },
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

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [activeSegment, setActiveSegment] = useState<ProfileSubTab>('profile');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [discSearch, setDiscSearch] = useState('');

  const userName = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Ricky';

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['discSearch', discSearch],
    queryFn: () => searchDiscs({ query: discSearch, limit: 20 }),
    enabled: discSearch.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Uniform Top Header */}
      <View style={{ paddingHorizontal: Spacing.lg }}>
        <TabHeader subtitle="Your stats" title={userName} />
      </View>

      {/* Segmented Sub Nav Control */}
      <View style={styles.segmentContainer}>
        {(['profile', 'stats', 'bag', 'shop'] as const).map((seg) => {
          const isAct = activeSegment === seg;
          const labels: Record<ProfileSubTab, string> = {
            profile: 'Profile',
            stats: 'Stats',
            bag: 'My Bag',
            shop: 'Shop',
          };
          return (
            <TouchableOpacity
              key={seg}
              style={[styles.segmentBtn, isAct && styles.segmentBtnActive]}
              onPress={() => setActiveSegment(seg)}
            >
              <Typo style={[styles.segmentText, isAct && styles.segmentTextActive]}>
                {labels[seg]}
              </Typo>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* SEGMENT 1: PROFILE / ACCOUNT */}
        {activeSegment === 'profile' && (
          <View style={styles.tabContent}>
            <View style={styles.cardSection}>
              <Typo variant="label" style={styles.sectionLabel}>PLAYER SETTINGS</Typo>
              <SettingItem icon="person-outline" label="Throwing Style" value="RHBH (Right-Hand Backhand)" />
              <SettingItem icon="speedometer-outline" label="Handicap" value="+2.4" />
              <SettingItem icon="navigate-outline" label="Distance Units" value="Feet (ft)" />
            </View>

            <View style={styles.cardSection}>
              <Typo variant="label" style={styles.sectionLabel}>APP SETTINGS</Typo>
              <SettingItem icon="notifications-outline" label="Course Notifications" value="Enabled" />
              <SettingItem icon="cloud-outline" label="Weather Alerts" value="Enabled" />
              <SettingItem icon="shield-checkmark-outline" label="Privacy & Security" value="Public Profile" />
            </View>

            <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
              <Ionicons name="log-out-outline" size={18} color={Colors.red} />
              <Typo style={styles.signOutText}>Sign Out</Typo>
            </TouchableOpacity>
          </View>
        )}

        {/* SEGMENT 2: STATS */}
        {activeSegment === 'stats' && (
          <View style={styles.tabContent}>
            {/* Recent Rounds */}
            <View style={styles.sectionHeader}>
              <Typo variant="label" style={styles.sectionTitle}>RECENT ROUNDS</Typo>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {MOCK_RECENT.map((item, i) => (
                <View key={i} style={styles.recentRoundMiniCard}>
                  <Typo variant="bodyMedium" style={styles.recentMiniCourse} numberOfLines={1}>
                    {item.course}
                  </Typo>
                  <Typo variant="caption" style={styles.recentMiniDate}>{item.date}</Typo>
                  <View style={styles.recentMiniScoreRow}>
                    <View style={[styles.miniDiffBadge, { backgroundColor: item.color === Colors.blue ? Colors.blueLight : item.color === Colors.red ? Colors.redLight : Colors.greenLight }]}>
                      <Typo style={[styles.miniDiffText, { color: item.color }]}>{item.diff}</Typo>
                    </View>
                    <Typo variant="h3" style={styles.miniScoreVal}>{item.score}</Typo>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Personal Best Banner */}
            <View style={styles.personalBestBanner}>
              <View style={styles.starBox}>
                <Ionicons name="star" size={20} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Typo variant="caption" style={styles.pbLabel}>PERSONAL BEST</Typo>
                <Typo variant="bodyMedium" style={styles.pbTitle}>Career best round</Typo>
                <Typo variant="caption" style={styles.pbSub}>-7 at Maple Hill DGC</Typo>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Typo variant="display" style={styles.pbScoreVal}>-7</Typo>
                <Typo variant="caption" style={styles.pbDate}>Apr 12, 2025</Typo>
              </View>
            </View>

            {/* Performance Overview */}
            <View style={styles.sectionHeader}>
              <Typo variant="label" style={styles.sectionTitle}>PERFORMANCE OVERVIEW</Typo>
            </View>
            <View style={styles.overviewGrid}>
              <View style={styles.gaugeCard}>
                <Typo variant="caption" style={styles.gaugeTitle}>Fairway Hits</Typo>
                <View style={styles.circleGauge}>
                  <Typo variant="h3" style={styles.gaugeNum}>71%</Typo>
                </View>
                <View style={styles.trendRow}>
                  <Ionicons name="arrow-up" size={12} color={Colors.green} />
                  <Typo style={styles.trendText}>8% vs last 20</Typo>
                </View>
              </View>
              <View style={styles.gaugeCard}>
                <Typo variant="caption" style={styles.gaugeTitle}>C1 Putting</Typo>
                <View style={styles.circleGauge}>
                  <Typo variant="h3" style={styles.gaugeNum}>82%</Typo>
                </View>
                <View style={styles.trendRow}>
                  <Ionicons name="arrow-up" size={12} color={Colors.green} />
                  <Typo style={styles.trendText}>6% vs last 20</Typo>
                </View>
              </View>
              <View style={styles.gaugeCard}>
                <Typo variant="caption" style={styles.gaugeTitle}>Avg Drive</Typo>
                <View style={styles.circleGauge}>
                  <Typo variant="h3" style={styles.gaugeNum}>312 ft</Typo>
                </View>
                <View style={styles.trendRow}>
                  <Ionicons name="arrow-up" size={12} color={Colors.green} />
                  <Typo style={styles.trendText}>15 ft vs last 20</Typo>
                </View>
              </View>
            </View>

            {/* Breakdown */}
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

        {/* SEGMENT 3: MY BAG */}
        {activeSegment === 'bag' && (
          <View style={styles.tabContent}>
            <View style={styles.bagHeaderRow}>
              <Typo variant="label" style={styles.sectionTitle}>DISCS IN BAG ({MOCK_BAG_DISCS.length})</Typo>
              <Button
                label="Add Disc"
                variant="primary"
                size="sm"
                icon={<Ionicons name="add" size={16} color={Colors.white} />}
                onPress={() => setAddModalVisible(true)}
              />
            </View>

            {MOCK_BAG_DISCS.map((disc) => (
              <View key={disc.id} style={[styles.discCard, disc.featured && styles.discCardFeatured]}>
                <View style={styles.cardMainRow}>
                  <View style={[styles.discArtwork, { backgroundColor: disc.color }]}>
                    <Typo style={[styles.discArtworkText, { color: disc.discTextColor }]}>
                      {disc.name.toUpperCase()}
                    </Typo>
                  </View>
                  <View style={styles.discMetaInfo}>
                    <Typo variant="h3" style={styles.discNameTitle}>{disc.name}</Typo>
                    <Typo variant="caption" style={styles.discBrandText}>{disc.brand} • {disc.plastic}</Typo>
                    <View style={styles.flightGrid}>
                      <View style={styles.flightBoxItem}><Typo variant="bodyMedium">{disc.speed}</Typo><Typo variant="caption">SPEED</Typo></View>
                      <View style={styles.flightBoxItem}><Typo variant="bodyMedium">{disc.glide}</Typo><Typo variant="caption">GLIDE</Typo></View>
                      <View style={styles.flightBoxItem}><Typo variant="bodyMedium">{disc.turn}</Typo><Typo variant="caption">TURN</Typo></View>
                      <View style={styles.flightBoxItem}><Typo variant="bodyMedium">{disc.fade}</Typo><Typo variant="caption">FADE</Typo></View>
                    </View>
                  </View>
                  <View style={styles.rightStatsCol}>
                    {disc.confidence && (
                      <View style={styles.confidenceBadge}>
                        <Typo style={styles.confidenceText}>{disc.confidence} CONFIDENCE</Typo>
                      </View>
                    )}
                    <Typo variant="bodyMedium" style={styles.distValue}>{disc.avgDistance}</Typo>
                    <Typo variant="caption" style={styles.statSubLabel}>AVG DISTANCE</Typo>
                  </View>
                </View>
              </View>
            ))}

            <Typo variant="caption" style={styles.attribution}>{TRYDISCS_ATTRIBUTION.text}</Typo>
          </View>
        )}

        {/* SEGMENT 4: SHOP */}
        {activeSegment === 'shop' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Typo variant="label" style={styles.sectionTitle}>ACED GEAR & DISCS</Typo>
            </View>
            <View style={styles.shopGrid}>
              {MOCK_SHOP_ITEMS.map((item) => (
                <View key={item.id} style={styles.shopCard}>
                  <Image source={{ uri: item.image }} style={styles.shopImg} />
                  <View style={styles.shopTagPill}>
                    <Typo style={styles.shopTagText}>{item.tag}</Typo>
                  </View>
                  <View style={styles.shopBody}>
                    <Typo variant="bodyMedium" style={styles.shopTitle} numberOfLines={2}>{item.title}</Typo>
                    <Typo variant="caption" style={styles.shopCat}>{item.category}</Typo>
                    <View style={styles.shopBottomRow}>
                      <Typo variant="h3" style={styles.shopPrice}>{item.price}</Typo>
                      <TouchableOpacity style={styles.buyBtn}>
                        <Ionicons name="cart-outline" size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Disc Search Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top']}>
          <View style={styles.modalHeader}>
            <Typo variant="h3">Search Discs</Typo>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearch}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.gray400} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search catalog..."
                placeholderTextColor={Colors.gray400}
                value={discSearch}
                onChangeText={setDiscSearch}
                autoFocus
              />
              {searchLoading && <ActivityIndicator size="small" color={Colors.blue} />}
            </View>
          </View>
          <FlatList
            data={searchResults ?? []}
            keyExtractor={(item) => `${item.brand}:${item.disc}`}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultRow}
                onPress={() => setAddModalVisible(false)}
              >
                <View style={{ flex: 1 }}>
                  <Typo variant="bodyMedium">{item.disc}</Typo>
                  <Typo variant="caption">{item.brand}</Typo>
                </View>
                <Ionicons name="add-circle" size={24} color={Colors.blue} />
              </TouchableOpacity>
            )}
          />
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
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 24, color: Colors.white, fontFamily: Typography.fontFamily.bold },
  userName: { fontSize: 24, fontFamily: Typography.fontFamily.bold },
  userEmail: { color: Colors.secondaryText, fontSize: Typography.size.xs },

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

  tabContent: { gap: Spacing.base },

  // Profile Cards
  cardSection: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.sm,
  },
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

  // Modal
  modal: { flex: 1, backgroundColor: Colors.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalSearch: { padding: Spacing.lg },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundSoft, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 12, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.base, color: Colors.primaryBlack, padding: 0 },
  searchResultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
});
