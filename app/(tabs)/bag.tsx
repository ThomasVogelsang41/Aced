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
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { TabHeader } from '../../components/TabHeader';
import { AnimatedFadeIn } from '../../components/ui/AnimatedFadeIn';
import { DiscSpinner } from '../../components/ui/DiscSpinner';
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

export default function BagScreen() {
  const [activeSubTab, setActiveSubTab] = useState<'discs' | 'insights' | 'trends'>('discs');
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
        <TabHeader subtitle="Disc Inventory" title="My Bag" />
      </AnimatedFadeIn>

      {/* Sub Tabs */}
      <AnimatedFadeIn delay={100}>
        <View style={styles.subTabsRow}>
          {(['discs', 'insights', 'trends'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.subTabItem, activeSubTab === tab && styles.subTabItemActive]}
              onPress={() => setActiveSubTab(tab)}
            >
              <Typo
                style={[
                  styles.subTabText,
                  activeSubTab === tab && styles.subTabTextActive,
                ]}
              >
                {tab === 'discs' ? 'Discs' : tab === 'insights' ? 'Flight Matrix' : 'In My Bag'}
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
                    <Typo style={styles.confidenceText}>{disc.confidence} CONFIDENCE</Typo>
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

        {/* Best disc for this hole bottom recommendation card */}
        <View style={styles.holeRecCard}>
          <TouchableOpacity style={styles.holeRecHeader}>
            <View>
              <Typo variant="bodyMedium" style={styles.holeRecTitle}>Best disc for this hole</Typo>
              <Typo variant="caption" style={styles.holeRecSub}>Hole 6 • Par 4 • 412 ft</Typo>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.primaryBlack} />
          </TouchableOpacity>

          <View style={styles.holeRecBody}>
            <View style={[styles.discArtworkSmall, { backgroundColor: Colors.blue }]}>
              <Typo style={styles.discArtworkTextSmall}>VOLT</Typo>
            </View>
            <View style={{ flex: 1 }}>
              <Typo variant="bodyMedium" style={styles.holeRecDiscName}>Volt</Typo>
              <Typo variant="caption" style={styles.holeRecBrand}>MVP Neutron</Typo>
            </View>
            <View style={styles.recConfidenceBadge}>
              <Typo style={styles.recConfidenceText}>92% CONFIDENCE</Typo>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Typo variant="bodyMedium" style={styles.expectedVal}>276 ft</Typo>
              <Typo variant="caption" style={styles.statSubLabel}>EXPECTED</Typo>
            </View>
          </View>
        </View>

        {/* TryDiscs attribution */}
        <Typo variant="caption" style={styles.attribution}>
          {TRYDISCS_ATTRIBUTION.text}
        </Typo>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Disc Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top']}>
          <View style={styles.modalHeader}>
            <Typo variant="h3">Search Disc Catalog</Typo>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearch}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.gray400} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search catalog (Destroyer, Buzzz)..."
                placeholderTextColor={Colors.gray400}
                value={discSearch}
                onChangeText={setDiscSearch}
                autoFocus
              />
              {searchLoading && <DiscSpinner size={20} label="" />}
            </View>
          </View>
          <FlatList
            data={searchResults ?? []}
            keyExtractor={(item) => `${item.brand}:${item.disc}`}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultRow}
                onPress={() => { setAddModalVisible(false); }}
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

const FlightBox: React.FC<{ val: number; label: string }> = ({ val, label }) => (
  <View style={styles.flightBoxItem}>
    <Typo variant="bodyMedium" style={styles.flightValText}>{val}</Typo>
    <Typo variant="caption" style={styles.flightLabelText}>{label}</Typo>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  title: { fontSize: 32, fontFamily: Typography.fontFamily.bold },
  headerIcons: { flexDirection: 'row', gap: Spacing.sm },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sub Tabs
  subTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.base,
  },
  subTabItem: {
    paddingVertical: 12,
    marginRight: Spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabItemActive: { borderBottomColor: Colors.blue },
  subTabText: { fontSize: Typography.size.base, fontFamily: Typography.fontFamily.medium, color: Colors.secondaryText },
  subTabTextActive: { color: Colors.blue, fontFamily: Typography.fontFamily.bold },

  // Disc Card
  discCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  discCardFeatured: {
    borderColor: Colors.blue,
    borderWidth: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  discArtwork: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  discArtworkText: { fontSize: 10, fontFamily: Typography.fontFamily.bold, letterSpacing: 0.5 },
  discMetaInfo: { flex: 1 },
  discNameTitle: { fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.bold },
  discBrandText: { color: Colors.secondaryText, fontSize: Typography.size.xs, marginBottom: 8 },
  flightGrid: { flexDirection: 'row', gap: 10 },
  flightBoxItem: { alignItems: 'center' },
  flightValText: { fontFamily: Typography.fontFamily.bold, fontSize: 13 },
  flightLabelText: { fontSize: 8, color: Colors.secondaryText, fontFamily: Typography.fontFamily.semiBold },

  rightStatsCol: { alignItems: 'flex-end', gap: 6 },
  confidenceBadge: {
    borderWidth: 1,
    borderColor: Colors.blue,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.blueLight,
  },
  confidenceText: { fontSize: 8, color: Colors.blue, fontFamily: Typography.fontFamily.bold },
  statGroup: { alignItems: 'flex-end' },
  distValue: { fontSize: 13, fontFamily: Typography.fontFamily.bold },
  usageValue: { fontSize: 13, fontFamily: Typography.fontFamily.bold },
  statSubLabel: { fontSize: 8, color: Colors.secondaryText, fontFamily: Typography.fontFamily.semiBold },

  // Bottom Hole Rec Card
  holeRecCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginTop: Spacing.md,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  holeRecHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  holeRecTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },
  holeRecSub: { color: Colors.secondaryText, fontSize: Typography.size.xs },
  holeRecBody: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  discArtworkSmall: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  discArtworkTextSmall: { color: Colors.white, fontSize: 8, fontWeight: 'bold' },
  holeRecDiscName: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },
  holeRecBrand: { color: Colors.secondaryText, fontSize: Typography.size.xs },
  recConfidenceBadge: { backgroundColor: Colors.backgroundSoft, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 4 },
  recConfidenceText: { fontSize: 9, fontFamily: Typography.fontFamily.bold, color: Colors.primaryBlack },
  expectedVal: { fontFamily: Typography.fontFamily.bold, fontSize: 13 },

  attribution: { color: Colors.blue, textAlign: 'center', marginVertical: Spacing.base, textDecorationLine: 'underline' },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalSearch: { padding: Spacing.lg },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundSoft, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 12, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.base, color: Colors.primaryBlack, padding: 0 },
  searchResultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
});
