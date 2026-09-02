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
  Linking,
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
import { RealisticDiscArtwork } from '../../components/ui/RealisticDiscArtwork';
import { searchDiscs, getTryDiscsBuyUrl, TRYDISCS_ATTRIBUTION } from '../../lib/trydiscs';
import type { TryDiscsDisc } from '../../types/disc';

interface BagDiscItem {
  id: string;
  name: string;
  brand: string;
  plastic: string;
  color: string;
  textColor: string;
  speed: number;
  glide: number;
  turn: number;
  fade: number;
  confidence: string | null;
  avgDistance: string;
  usage: string;
  featured?: boolean;
}

const INITIAL_BAG_DISCS: BagDiscItem[] = [
  {
    id: 'volt-1',
    name: 'Volt',
    brand: 'MVP',
    plastic: 'Neutron',
    color: '#2563EB',
    textColor: '#FFFFFF',
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
    id: 'explorer-1',
    name: 'Explorer',
    brand: 'Discmania',
    plastic: 'Neo',
    color: '#059669',
    textColor: '#FFFFFF',
    speed: 7,
    glide: 5,
    turn: 0,
    fade: 2,
    confidence: null,
    avgDistance: '242 ft',
    usage: '24%',
  },
  {
    id: 'firebird-1',
    name: 'Firebird',
    brand: 'Innova',
    plastic: 'Champion',
    color: '#DC2626',
    textColor: '#FFFFFF',
    speed: 9,
    glide: 3,
    turn: 0,
    fade: 4,
    confidence: null,
    avgDistance: '325 ft',
    usage: '15%',
  },
  {
    id: 'luna-1',
    name: 'Luna',
    brand: 'Discraft',
    plastic: 'Jawbreaker',
    color: '#8B5CF6',
    textColor: '#FFFFFF',
    speed: 3,
    glide: 3,
    turn: 0,
    fade: 2,
    confidence: null,
    avgDistance: '195 ft',
    usage: '16%',
  },
  {
    id: 'destroyer-1',
    name: 'Destroyer',
    brand: 'Innova',
    plastic: 'Star',
    color: '#D97706',
    textColor: '#FFFFFF',
    speed: 12,
    glide: 5,
    turn: -1,
    fade: 3,
    confidence: null,
    avgDistance: '364 ft',
    usage: '7%',
  },
];

const POPULAR_QUICK_PICKS: Partial<BagDiscItem>[] = [
  { name: 'Buzzz', brand: 'Discraft', plastic: 'Z Line', speed: 5, glide: 4, turn: -1, fade: 1, color: '#10B981' },
  { name: 'Zone', brand: 'Discraft', plastic: 'ESP', speed: 4, glide: 3, turn: 0, fade: 3, color: '#EF4444' },
  { name: 'Destroyer', brand: 'Innova', plastic: 'Star', speed: 12, glide: 5, turn: -1, fade: 3, color: '#3B82F6' },
  { name: 'Teebird', brand: 'Innova', plastic: 'Champion', speed: 7, glide: 5, turn: 0, fade: 2, color: '#F59E0B' },
  { name: 'Grace', brand: 'Latitude 64', plastic: 'Royal Grand', speed: 11, glide: 6, turn: -1, fade: 2, color: '#EC4899' },
  { name: 'Aviar', brand: 'Innova', plastic: 'DX', speed: 2, glide: 3, turn: 0, fade: 1, color: '#6366F1' },
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

const VIBRANT_DISC_COLORS = ['#2563EB', '#DC2626', '#059669', '#D97706', '#8B5CF6', '#EC4899', '#4F46E5'];

export default function BagScreen() {
  const [userBagDiscs, setUserBagDiscs] = useState<BagDiscItem[]>(INITIAL_BAG_DISCS);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [discSearch, setDiscSearch] = useState('');
  const [addedToastMessage, setAddedToastMessage] = useState<string | null>(null);

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['discSearch', discSearch],
    queryFn: () => searchDiscs({ query: discSearch, limit: 20 }),
    enabled: discSearch.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
  });

  const handleAddDiscToBag = (discData: {
    name: string;
    brand: string;
    plastic?: string;
    speed?: number;
    glide?: number;
    turn?: number;
    fade?: number;
    color?: string;
  }) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const randomColor = discData.color ?? VIBRANT_DISC_COLORS[Math.floor(Math.random() * VIBRANT_DISC_COLORS.length)];

    const newDisc: BagDiscItem = {
      id: `disc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: discData.name,
      brand: discData.brand || 'Custom Mold',
      plastic: discData.plastic || 'Premium Blend',
      color: randomColor,
      textColor: '#FFFFFF',
      speed: discData.speed ?? 7,
      glide: discData.glide ?? 5,
      turn: discData.turn ?? 0,
      fade: discData.fade ?? 2,
      confidence: '85%',
      avgDistance: `${Math.round(180 + (discData.speed ?? 7) * 16)} ft`,
      usage: '10%',
    };

    setUserBagDiscs((prev) => [newDisc, ...prev]);
    setAddModalVisible(false);
    setDiscSearch('');

    setAddedToastMessage(`${newDisc.name} by ${newDisc.brand} added to My Bag!`);
    setTimeout(() => {
      setAddedToastMessage(null);
    }, 4000);
  };

  const handleRemoveDisc = (discId: string, discName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUserBagDiscs((prev) => prev.filter((d) => d.id !== discId));
    setAddedToastMessage(`${discName} removed from Bag`);
    setTimeout(() => setAddedToastMessage(null), 3000);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <AnimatedFadeIn delay={0} style={{ paddingHorizontal: Spacing.lg }}>
        <TabHeader subtitle="Disc Inventory" title="My Bag" />
      </AnimatedFadeIn>

      {/* Added Toast Banner */}
      {addedToastMessage && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
          <Typo style={styles.toastText}>{addedToastMessage}</Typo>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Disc to Golf Bag Button */}
        <TouchableOpacity
          style={styles.addDiscPrimaryBanner}
          activeOpacity={0.88}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setAddModalVisible(true);
          }}
        >
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Typo style={{ color: Colors.white, fontWeight: 'bold', fontSize: 14 }}>+ Add Disc to Golf Bag</Typo>
        </TouchableOpacity>

        {/* Disc List or Empty State */}
        {userBagDiscs.length === 0 ? (
          <View style={styles.emptyBagCard}>
            <Ionicons name="disc-outline" size={48} color={Colors.gray400} />
            <Typo variant="h3" style={{ fontWeight: 'bold', marginTop: 12 }}>Your Bag is Empty</Typo>
            <Typo style={{ color: Colors.secondaryText, fontSize: 13, textAlign: 'center', lineHeight: 18, marginTop: 4 }}>
              Add discs to your bag to track your disc inventory, flight stats, and store search with Try Discs.
            </Typo>
            <TouchableOpacity
              style={styles.emptyBagBtn}
              activeOpacity={0.88}
              onPress={() => setAddModalVisible(true)}
            >
              <Typo style={{ color: Colors.white, fontWeight: 'bold', fontSize: 14 }}>+ Add Disc to Bag</Typo>
            </TouchableOpacity>
          </View>
        ) : (
          userBagDiscs.map((disc) => (
            <View key={disc.id} style={[styles.discCard, disc.featured && styles.discCardFeatured]}>
              <View style={styles.cardMainRow}>
                {/* Realistic 3D Disc Artwork */}
                <RealisticDiscArtwork name={disc.name} brand={disc.brand} color={disc.color} textColor={disc.textColor} size={64} />

                <View style={styles.discMetaInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typo variant="h3" style={styles.discNameTitle}>{disc.name}</Typo>
                    <TouchableOpacity onPress={() => handleRemoveDisc(disc.id, disc.name)} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={16} color={Colors.gray400} />
                    </TouchableOpacity>
                  </View>
                  <Typo variant="caption" style={styles.discBrandText}>
                    {disc.brand} • {disc.plastic}
                  </Typo>

                  {/* Flight numbers grid */}
                  <View style={styles.flightGrid}>
                    <FlightBox val={disc.speed} label="SPD" />
                    <FlightBox val={disc.glide} label="GLD" />
                    <FlightBox val={disc.turn} label="TRN" />
                    <FlightBox val={disc.fade} label="FDE" />
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
                    <Typo variant="caption" style={styles.statSubLabel}>AVG DIST</Typo>
                  </View>
                </View>
              </View>

              {/* Direct Link to Try Discs store search */}
              <TouchableOpacity
                style={styles.findDiscBtn}
                activeOpacity={0.8}
                onPress={() => Linking.openURL(getTryDiscsBuyUrl(disc.name))}
              >
                <Ionicons name="cart-outline" size={14} color={Colors.blue} />
                <Typo style={styles.findDiscBtnText}>Search Stores on Try Discs</Typo>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Try Discs Attribution Link */}
        <TouchableOpacity
          style={{ paddingVertical: 16, alignItems: 'center' }}
          onPress={() => Linking.openURL(TRYDISCS_ATTRIBUTION.url)}
        >
          <Typo style={{ color: Colors.blue, fontSize: 11, textDecorationLine: 'underline', fontWeight: 'bold' }}>
            {TRYDISCS_ATTRIBUTION.text}
          </Typo>
        </TouchableOpacity>
      </ScrollView>

      {/* ADD DISC SEARCH MODAL */}
      <Modal visible={addModalVisible} animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top']}>
          <View style={styles.modalHeaderDown}>
            <View>
              <Typo variant="h2" style={{ fontWeight: 'bold' }}>Add Disc to Bag</Typo>
              <Typo variant="caption" style={{ color: Colors.secondaryText }}>Search TryDiscs database or select quick pick</Typo>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setAddModalVisible(false)}>
              <Ionicons name="close" size={22} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: Spacing.lg }}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.gray400} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Destroyer, Buzzz, Zone, Luna..."
                placeholderTextColor={Colors.gray400}
                value={discSearch}
                onChangeText={setDiscSearch}
                autoCapitalize="none"
              />
              {discSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDiscSearch('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.gray400} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {searchLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.primaryBlack} size="large" />
              <Typo style={{ marginTop: 12, color: Colors.secondaryText, fontSize: 13 }}>Searching TryDiscs API...</Typo>
            </View>
          ) : discSearch.trim().length >= 2 ? (
            <FlatList
              data={searchResults ?? []}
              keyExtractor={(item, idx) => `${item.brand}-${item.disc}-${idx}`}
              renderItem={({ item }: { item: TryDiscsDisc }) => (
                <View style={styles.discSearchResultRow}>
                  <RealisticDiscArtwork name={item.disc} brand={item.brand} color={VIBRANT_DISC_COLORS[Math.abs(item.disc.length) % VIBRANT_DISC_COLORS.length]} size={48} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typo style={{ fontWeight: 'bold', fontSize: 15 }}>{item.disc}</Typo>
                    <Typo style={{ color: Colors.secondaryText, fontSize: 11 }}>{item.brand} • {item.category ?? 'Disc'}</Typo>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      <Typo style={{ fontSize: 10, color: Colors.blue, fontWeight: 'bold' }}>
                        {item.speed ?? '—'} / {item.glide ?? '—'} / {item.turn ?? '—'} / {item.fade ?? '—'}
                      </Typo>
                    </View>
                  </View>
                  <Button
                    label="+ Add"
                    variant="primary"
                    size="sm"
                    onPress={() =>
                      handleAddDiscToBag({
                        name: item.disc,
                        brand: item.brand,
                        plastic: item.category ?? 'Premium',
                        speed: item.speed,
                        glide: item.glide,
                        turn: item.turn,
                        fade: item.fade,
                      })
                    }
                  />
                </View>
              )}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 20 }}
            />
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 20 }}>
              <Typo variant="label" style={{ color: Colors.secondaryText, letterSpacing: 0.8, marginBottom: 12 }}>
                POPULAR MOLD QUICK PICKS
              </Typo>
              <View style={{ gap: 10 }}>
                {POPULAR_QUICK_PICKS.map((item, idx) => (
                  <View key={idx} style={styles.discSearchResultRow}>
                    <RealisticDiscArtwork name={item.name!} brand={item.brand!} color={item.color!} size={48} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typo style={{ fontWeight: 'bold', fontSize: 15 }}>{item.name}</Typo>
                      <Typo style={{ color: Colors.secondaryText, fontSize: 11 }}>{item.brand} • {item.plastic}</Typo>
                      <Typo style={{ fontSize: 10, color: Colors.blue, fontWeight: 'bold', marginTop: 2 }}>
                        {item.speed} / {item.glide} / {item.turn} / {item.fade}
                      </Typo>
                    </View>
                    <Button
                      label="+ Add"
                      variant="primary"
                      size="sm"
                      onPress={() =>
                        handleAddDiscToBag({
                          name: item.name!,
                          brand: item.brand!,
                          plastic: item.plastic!,
                          speed: item.speed,
                          glide: item.glide,
                          turn: item.turn,
                          fade: item.fade,
                          color: item.color,
                        })
                      }
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          <TouchableOpacity
            style={{ padding: 16, alignItems: 'center' }}
            onPress={() => Linking.openURL(TRYDISCS_ATTRIBUTION.url)}
          >
            <Typo style={{ color: Colors.blue, fontSize: 11, textDecorationLine: 'underline', fontWeight: 'bold' }}>
              {TRYDISCS_ATTRIBUTION.text}
            </Typo>
          </TouchableOpacity>
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
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },
  subTabsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: Spacing.xs, gap: Spacing.sm },
  subTabItem: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundSoft },
  subTabItemActive: { backgroundColor: Colors.primaryBlack },
  subTabText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.medium, color: Colors.secondaryText },
  subTabTextActive: { color: Colors.white, fontFamily: Typography.fontFamily.bold },

  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.green,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: 8,
    marginBottom: Spacing.xs,
  },
  toastText: { color: Colors.white, fontWeight: 'bold', fontSize: 13 },

  addDiscBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBlack,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
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
  emptyBagCard: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginVertical: Spacing.md,
  },
  addDiscPrimaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBlack,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    gap: 8,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  emptyBagBtn: {
    backgroundColor: Colors.primaryBlack,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    marginTop: 16,
    ...Shadows.sm,
  },
  discCardFeatured: { borderColor: Colors.blue, borderWidth: 1.5 },
  cardMainRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  discMetaInfo: { flex: 1, gap: 2 },
  discNameTitle: { fontFamily: Typography.fontFamily.bold, fontSize: 16 },
  discBrandText: { color: Colors.secondaryText, fontSize: 11 },
  flightGrid: { flexDirection: 'row', gap: 4, marginTop: 4 },
  flightBox: { backgroundColor: Colors.backgroundSoft, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, alignItems: 'center' },
  flightNum: { fontSize: 10, fontWeight: 'bold' },
  flightLabel: { fontSize: 6, color: Colors.secondaryText, fontWeight: 'bold' },
  rightStatsCol: { alignItems: 'flex-end', gap: 4 },
  confidenceBadge: { backgroundColor: Colors.blueLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  confidenceText: { color: Colors.blue, fontSize: 8, fontWeight: 'bold' },
  statGroup: { alignItems: 'flex-end' },
  distValue: { fontSize: 12, fontWeight: 'bold' },
  statSubLabel: { fontSize: 7, color: Colors.secondaryText, fontWeight: 'bold' },
  findDiscBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blueLight,
    borderRadius: BorderRadius.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 10,
    gap: 6,
  },
  findDiscBtnText: { color: Colors.blue, fontWeight: 'bold', fontSize: 11 },

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
  },
  shopIconBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.backgroundSoft, alignItems: 'center', justifyContent: 'center' },
  shopCardBody: { flex: 1 },
  shopTagBadge: { backgroundColor: Colors.blueLight, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 2 },
  shopTagText: { color: Colors.blue, fontSize: 9, fontWeight: 'bold' },
  shopItemTitle: { fontWeight: 'bold', fontSize: 14 },
  shopItemPrice: { color: Colors.secondaryText, fontSize: 12 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.white },
  modalHeaderDown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundSoft, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 12, gap: Spacing.sm },
  searchInput: { flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.base, color: Colors.primaryBlack, padding: 0 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.backgroundSoft, alignItems: 'center', justifyContent: 'center' },
  discSearchResultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
});
