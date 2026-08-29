import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { DiscCard } from '../../components/DiscCard';
import { Badge } from '../../components/ui/Badge';
import { Divider } from '../../components/ui/Divider';
import { Colors, Spacing, Layout, BorderRadius, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useBagStore } from '../../store/bagStore';
import { useBags, useAddDiscToBag, useRemoveDiscFromBag } from '../../hooks/useBag';
import { searchDiscs, TRYDISCS_ATTRIBUTION } from '../../lib/trydiscs';
import type { TryDiscsDisc } from '../../types/disc';

type FilterCategory = 'all' | 'distance_driver' | 'fairway_driver' | 'midrange' | 'putter';

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  all: 'All',
  distance_driver: 'Drivers',
  fairway_driver: 'Fairways',
  midrange: 'Mids',
  putter: 'Putters',
};

function normalizeCategoryFromTryDiscs(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('distance') || lower.includes('disc golf driver')) return 'distance_driver';
  if (lower.includes('fairway')) return 'fairway_driver';
  if (lower.includes('mid')) return 'midrange';
  if (lower.includes('putter')) return 'putter';
  return 'midrange';
}

export default function BagScreen() {
  const { user } = useAuthStore();
  const { getActiveBag, activeBagId } = useBagStore();
  const { isLoading } = useBags(user?.id ?? null);
  const addDiscMutation = useAddDiscToBag();
  const removeDiscMutation = useRemoveDiscFromBag();

  const [filter, setFilter] = useState<FilterCategory>('all');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [discSearch, setDiscSearch] = useState('');

  const activeBag = getActiveBag();

  // TryDiscs search query
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['discSearch', discSearch],
    queryFn: () => searchDiscs({ query: discSearch, limit: 20 }),
    enabled: discSearch.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
  });

  const filteredDiscs = (activeBag?.discs ?? []).filter(
    (d) => filter === 'all' || d.category === filter
  );

  function handleAddDisc(tdDisc: TryDiscsDisc) {
    if (!activeBagId) return;
    const category = normalizeCategoryFromTryDiscs(tdDisc.category) as 'distance_driver' | 'fairway_driver' | 'midrange' | 'putter';
    addDiscMutation.mutate({
      bagId: activeBagId,
      disc: {
        id: `${tdDisc.brand}:${tdDisc.disc}`,
        bagId: activeBagId,
        brand: tdDisc.brand,
        name: tdDisc.disc,
        category,
        speed: tdDisc.speed,
        glide: tdDisc.glide,
        turn: tdDisc.turn,
        fade: tdDisc.fade,
      },
    });
    setAddModalVisible(false);
    setDiscSearch('');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Typo variant="h2">My Bag</Typo>
          <Typo variant="small" style={styles.bagName}>
            {activeBag?.name ?? 'No bag selected'}
          </Typo>
        </View>
        <Button
          label="Add Disc"
          variant="primary"
          size="sm"
          icon={<Ionicons name="add" size={16} color={Colors.white} />}
          onPress={() => setAddModalVisible(true)}
        />
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {(Object.keys(CATEGORY_LABELS) as FilterCategory[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, filter === cat && styles.filterChipActive]}
            onPress={() => setFilter(cat)}
          >
            <Typo
              style={[
                styles.filterLabel,
                filter === cat && styles.filterLabelActive,
              ]}
            >
              {CATEGORY_LABELS[cat]}
            </Typo>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Divider />

      {/* Disc list */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.blue} />
        </View>
      ) : filteredDiscs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bag-outline" size={48} color={Colors.gray300} />
          <Typo variant="body" style={styles.emptyTitle}>
            {filter === 'all' ? 'Your bag is empty' : `No ${CATEGORY_LABELS[filter].toLowerCase()} in bag`}
          </Typo>
          <Typo variant="small" style={styles.emptyText}>
            Tap "Add Disc" to search the TryDiscs catalog
          </Typo>
          <Button
            label="Add Your First Disc"
            variant="primary"
            size="md"
            onPress={() => setAddModalVisible(true)}
            style={styles.emptyBtn}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {filteredDiscs.map((disc) => (
            <DiscCard
              key={disc.bagDiscId}
              disc={disc}
              onRemove={() =>
                removeDiscMutation.mutate({ bagId: disc.bagId, bagDiscId: disc.bagDiscId })
              }
            />
          ))}
          {/* TryDiscs attribution */}
          <TouchableOpacity>
            <Typo variant="caption" style={styles.attribution}>
              {TRYDISCS_ATTRIBUTION.text}
            </Typo>
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Add Disc Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top']}>
          <View style={styles.modalHeader}>
            <Typo variant="h3">Add Disc</Typo>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearch}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.gray400} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search discs (e.g. Destroyer, Buzzz)..."
                placeholderTextColor={Colors.gray400}
                value={discSearch}
                onChangeText={setDiscSearch}
                autoFocus
                clearButtonMode="while-editing"
              />
              {searchLoading && <ActivityIndicator size="small" color={Colors.blue} />}
            </View>
          </View>

          <FlatList
            data={searchResults ?? []}
            keyExtractor={(item) => `${item.brand}:${item.disc}`}
            contentContainerStyle={styles.modalList}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              discSearch.length >= 2 && !searchLoading ? (
                <View style={styles.center}>
                  <Typo variant="small" style={styles.emptyText}>No discs found</Typo>
                </View>
              ) : discSearch.length < 2 ? (
                <Typo variant="small" style={[styles.emptyText, { textAlign: 'center', padding: 24 }]}>
                  Type at least 2 characters to search
                </Typo>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultRow}
                onPress={() => handleAddDisc(item)}
              >
                <View style={styles.searchResultInfo}>
                  <Typo variant="bodyMedium">{item.disc}</Typo>
                  <Typo variant="small">{item.brand}</Typo>
                  <View style={styles.flightRow}>
                    {[item.speed, item.glide, item.turn, item.fade].map((v, i) => (
                      <View key={i} style={styles.flightPill}>
                        <Typo style={styles.flightLabel}>
                          {['S', 'G', 'T', 'F'][i]}
                        </Typo>
                        <Typo style={styles.flightVal}>{v}</Typo>
                      </View>
                    ))}
                  </View>
                </View>
                <Ionicons name="add-circle" size={28} color={Colors.blue} />
              </TouchableOpacity>
            )}
          />

          <Typo variant="caption" style={[styles.attribution, { textAlign: 'center', marginBottom: 16 }]}>
            {TRYDISCS_ATTRIBUTION.text}
          </Typo>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
  },
  bagName: { color: Colors.secondaryText, marginTop: 2 },
  filterRow: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  filterLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: Colors.secondaryText,
  },
  filterLabelActive: { color: Colors.white },
  scroll: { flex: 1 },
  list: { paddingHorizontal: Layout.screenPaddingH, paddingTop: Spacing.base },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'], gap: Spacing.sm },
  emptyTitle: { color: Colors.primaryBlack, marginTop: Spacing.sm },
  emptyText: { color: Colors.secondaryText, textAlign: 'center' },
  emptyBtn: { marginTop: Spacing.base },
  attribution: { color: Colors.blue, textDecorationLine: 'underline', textAlign: 'center', marginVertical: Spacing.base },
  // Modal
  modal: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalSearch: { paddingHorizontal: Layout.screenPaddingH, paddingVertical: Spacing.base },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.primaryBlack,
    padding: 0,
  },
  modalList: { paddingHorizontal: Layout.screenPaddingH },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.base,
  },
  searchResultInfo: { flex: 1, gap: 4 },
  flightRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  flightPill: {
    flexDirection: 'row',
    gap: 3,
    backgroundColor: Colors.backgroundSoft,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  flightLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 10,
    color: Colors.secondaryText,
  },
  flightVal: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: Colors.primaryBlack,
  },
});
