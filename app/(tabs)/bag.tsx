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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { TabHeader } from '../../components/TabHeader';
import { AnimatedFadeIn } from '../../components/ui/AnimatedFadeIn';
import { searchDiscs, TRYDISCS_ATTRIBUTION } from '../../lib/trydiscs';

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
  {
    id: 'destroyer',
    name: 'Destroyer',
    brand: 'Innova',
    plastic: 'Star',
    color: '#93C5FD',
    discTextColor: '#09090A',
    speed: 12,
    glide: 5,
    turn: -1,
    fade: 3,
    confidence: null,
    avgDistance: '364 ft',
    usage: '7%',
    featured: false,
  },
];

const MOCK_SHOP_ITEMS = [
  {
    id: 'volt-aced',
    title: 'ACED Pro Volt (Special Edition)',
    category: 'Discs',
    price: '$24.99',
    tag: 'Bestseller',
    icon: 'disc-outline',
  },
  {
    id: 'hoodie',
    title: 'ACED Tour Hoodie (Black)',
    category: 'Apparel',
    price: '$68.00',
    tag: 'New',
    icon: 'shirt-outline',
  },
  {
    id: 'rangefinder',
    title: 'ACED Laser GPS Rangefinder',
    category: 'Gear',
    price: '$189.00',
    tag: 'Pro Tech',
    icon: 'navigate-outline',
  },
  {
    id: 'caddie-pass',
    title: 'ACED Smart Caddie Pro (1 Year)',
    category: 'Subscription',
    price: '$29.99/yr',
    tag: 'Popular',
    icon: 'sparkles-outline',
  },
];

export default function BagScreen() {
  const [activeSubTab, setActiveSubTab] = useState<'discs' | 'shop'>('discs');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [discSearch, setDiscSearch] = useState('');

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['discSearch', discSearch],
    queryFn: () => searchDiscs({ query: discSearch, limit: 20 }),
    enabled: discSearch.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Uniform Top Header */}
      <AnimatedFadeIn delay={0} style={{ paddingHorizontal: Spacing.lg }}>
        <TabHeader subtitle="Disc Inventory & Gear" title="My Bag" />
      </AnimatedFadeIn>

      {/* Sub Tabs: Discs | Pro Shop */}
      <AnimatedFadeIn delay={100}>
        <View style={styles.subTabsRow}>
          {(['discs', 'shop'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.subTabItem, activeSubTab === tab && styles.subTabItemActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveSubTab(tab);
              }}
            >
              <Typo
                style={[
                  styles.subTabText,
                  activeSubTab === tab && styles.subTabTextActive,
                ]}
              >
                {tab === 'discs' ? 'Discs Inventory' : 'Pro Shop'}
              </Typo>
            </TouchableOpacity>
          ))}
        </View>
      </AnimatedFadeIn>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeSubTab === 'discs' ? (
          <>
            {/* Add Disc CTA */}
            <TouchableOpacity style={styles.addDiscBanner} onPress={() => setAddModalVisible(true)}>
              <Ionicons name="add-circle" size={20} color={Colors.white} />
              <Typo style={styles.addDiscText}>Add New Disc to Bag</Typo>
            </TouchableOpacity>

            {/* Disc List */}
            {MOCK_BAG_DISCS.map((disc) => (
              <View
                key={disc.id}
                style={[
                  styles.discCard,
                  disc.featured && styles.discCardFeatured,
                ]}
              >
                <View style={styles.cardMainRow}>
                  {/* Render Circle Disc Artwork */}
                  <View style={[styles.discArtwork, { backgroundColor: disc.color }]}>
                    <Typo style={[styles.discArtworkText, { color: disc.discTextColor }]}>
                      {disc.name.toUpperCase()}
                    </Typo>
                  </View>

                  <View style={styles.discMetaInfo}>
                    <Typo variant="h3" style={styles.discNameTitle}>{disc.name}</Typo>
                    <Typo variant="caption" style={styles.discBrandText}>
                      {disc.brand} • {disc.plastic}
                    </Typo>

                    {/* Flight numbers grid */}
                    <View style={styles.flightGrid}>
                      <FlightBox val={disc.speed} label="SPEED" />
                      <FlightBox val={disc.glide} label="GLIDE" />
                      <FlightBox val={disc.turn} label="TURN" />
                      <FlightBox val={disc.fade} label="FADE" />
                    </View>
                  </View>

                  {/* Right Stats Box */}
                  <View style={styles.rightStatsCol}>
                    {disc.confidence && (
                      <View style={styles.confidenceBadge}>
                        <Typo style={styles.confidenceText}>{disc.confidence} CONF</Typo>
                      </View>
                    )}
                    <View style={styles.statGroup}>
                      <Typo variant="bodyMedium" style={styles.distValue}>{disc.avgDistance}</Typo>
                      <Typo variant="caption" style={styles.statSubLabel}>AVG DISTANCE</Typo>
                    </View>
                    <View style={styles.statGroup}>
                      <Typo variant="bodyMedium" style={styles.usageValue}>{disc.usage}</Typo>
                      <Typo variant="caption" style={styles.statSubLabel}>USAGE</Typo>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          /* PRO SHOP TAB INTEGRATED IN BAG */
          <View style={styles.shopGrid}>
            <Typo variant="label" style={{ color: Colors.secondaryText, letterSpacing: 0.8, marginBottom: 8 }}>
              OFFICIAL ACED PRO SHOP
            </Typo>
            {MOCK_SHOP_ITEMS.map((item) => (
              <View key={item.id} style={styles.shopCard}>
                <View style={styles.shopIconBadge}>
                  <Ionicons name={item.icon as any} size={28} color={Colors.primaryBlack} />
                </View>
                <View style={styles.shopCardBody}>
                  <View style={styles.shopTagBadge}>
                    <Typo style={styles.shopTagText}>{item.tag}</Typo>
                  </View>
                  <Typo style={styles.shopItemTitle}>{item.title}</Typo>
                  <Typo style={styles.shopItemPrice}>{item.price}</Typo>
                  <Button label="Buy Now" variant="primary" size="sm" style={{ marginTop: 8 }} />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ADD DISC SEARCH MODAL */}
      <Modal visible={addModalVisible} animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top']}>
          <View style={styles.modalHeader}>
            <Typo variant="h2" style={styles.modalTitle}>Search Disc Database</Typo>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setAddModalVisible(false)}>
              <Ionicons name="close" size={22} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: Spacing.lg }}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.gray400} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Destroyer, Buzzz, Destroyer..."
                placeholderTextColor={Colors.gray400}
                value={discSearch}
                onChangeText={setDiscSearch}
              />
            </View>
          </View>

          {searchLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.primaryBlack} />
            </View>
          ) : (
            <FlatList
              data={searchResults ?? []}
              keyExtractor={(item, idx) => `${item.brand}-${item.disc}-${idx}`}
              renderItem={({ item }) => (
                <View style={styles.discSearchResultRow}>
                  <View style={{ flex: 1 }}>
                    <Typo style={{ fontWeight: 'bold' }}>{item.disc}</Typo>
                    <Typo style={{ color: Colors.secondaryText, fontSize: 11 }}>{item.brand}</Typo>
                  </View>
                  <Button label="Add" variant="ghost" size="sm" onPress={() => setAddModalVisible(false)} />
                </View>
              )}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
            />
          )}

          <View style={{ padding: 12, alignItems: 'center' }}>
            <Typo style={{ color: Colors.gray400, fontSize: 10 }}>{TRYDISCS_ATTRIBUTION.text}</Typo>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const FlightBox: React.FC<{ val: number; label: string }> = ({ val, label }) => (
  <View style={styles.flightBox}>
    <Typo style={styles.flightNum}>{val}</Typo>
    <Typo style={styles.flightLabel}>{label}</Typo>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  subTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  subTabItem: { paddingVertical: Spacing.xs, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabItemActive: { borderBottomColor: Colors.primaryBlack },
  subTabText: { color: Colors.secondaryText, fontSize: 13, fontFamily: Typography.fontFamily.medium },
  subTabTextActive: { color: Colors.primaryBlack, fontFamily: Typography.fontFamily.bold },

  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },

  addDiscBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBlack,
    borderRadius: BorderRadius.xl,
    paddingVertical: 12,
    gap: 8,
    ...Shadows.sm,
  },
  addDiscText: { color: Colors.white, fontWeight: 'bold', fontSize: 13 },

  discCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  discCardFeatured: { borderColor: Colors.blue, borderWidth: 1.5 },
  cardMainRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  discArtwork: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  discArtworkText: { fontSize: 8, fontFamily: Typography.fontFamily.extraBold },
  discMetaInfo: { flex: 1, gap: 2 },
  discNameTitle: { fontFamily: Typography.fontFamily.bold, fontSize: 16 },
  discBrandText: { color: Colors.secondaryText, fontSize: 11 },
  flightGrid: { flexDirection: 'row', gap: 4, marginTop: 4 },
  flightBox: { backgroundColor: Colors.backgroundSoft, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, alignItems: 'center' },
  flightNum: { fontSize: 10, fontWeight: 'bold' },
  flightLabel: { fontSize: 6, color: Colors.secondaryText, fontWeight: 'bold' },
  rightStatsCol: { alignItems: 'flex-end', gap: 4 },
  confidenceBadge: { backgroundColor: Colors.blueLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  confidenceText: { color: Colors.blue, fontSize: 8, fontWeight: 'bold' },
  statGroup: { alignItems: 'flex-end' },
  distValue: { fontSize: 12, fontWeight: 'bold' },
  usageValue: { fontSize: 12, fontWeight: 'bold' },
  statSubLabel: { fontSize: 7, color: Colors.secondaryText, fontWeight: 'bold' },

  // Shop Grid
  shopGrid: { gap: 12 },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  shopIconBadge: { width: 56, height: 56, borderRadius: BorderRadius.lg, backgroundColor: Colors.backgroundSoft, alignItems: 'center', justifyContent: 'center' },
  shopCardBody: { flex: 1, gap: 2 },
  shopTagBadge: { backgroundColor: Colors.primaryBlack, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  shopTagText: { color: Colors.white, fontSize: 8, fontWeight: 'bold' },
  shopItemTitle: { fontWeight: 'bold', fontSize: 14, marginTop: 2 },
  shopItemPrice: { color: Colors.blue, fontWeight: 'bold', fontSize: 13 },

  modalSafe: { flex: 1, backgroundColor: Colors.white },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontFamily: Typography.fontFamily.bold },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.backgroundSoft, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundSoft, borderRadius: BorderRadius.lg, paddingHorizontal: 12, height: 42, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: Colors.primaryBlack },
  discSearchResultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
});
