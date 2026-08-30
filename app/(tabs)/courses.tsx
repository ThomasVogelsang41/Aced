import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from '../../components/ui/Typography';
import { Colors, Spacing, Layout, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useLocation } from '../../hooks/useLocation';

const MOCK_NEARBY = [
  {
    id: 'maple-hill',
    name: 'Maple Hill DGC',
    city: 'Leicester, MA',
    distance: '2.1 mi',
    rating: 4.7,
    reviews: 1248,
    holes: 18,
    tags: ['Technical', 'Hilly'],
    weather: '72° Sunny',
    weatherIcon: 'sunny-outline',
    image: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'northwood-black',
    name: 'Northwood Black',
    city: 'Northfield, MA',
    distance: '3.6 mi',
    rating: 4.5,
    reviews: 823,
    holes: 18,
    tags: ['Technical', 'Forested'],
    weather: '68° Cloudy',
    weatherIcon: 'cloudy-outline',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'pine-ridge',
    name: 'Pine Ridge DGC',
    city: 'Bolton, MA',
    distance: '5.2 mi',
    rating: 4.6,
    reviews: 945,
    holes: 18,
    tags: ['Scenic', 'Rolling'],
    weather: '70° Sunny',
    weatherIcon: 'sunny-outline',
    image: 'https://images.unsplash.com/photo-1511497584788-876761465087?w=500&auto=format&fit=crop&q=80',
  },
];

import { TabHeader } from '../../components/TabHeader';

export default function CoursesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('nearby');
  const { latitude, longitude } = useLocation();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Uniform Top Header */}
        <TabHeader subtitle="Course Directory" title="Map" />

        {/* Map View Graphic Header */}
        <View style={styles.mapGraphicCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop&q=80' }}
            style={styles.mapImage}
          />
          <View style={styles.mapOverlay}>
            <View style={[styles.mapMarker, styles.mapMarkerActive]}>
              <Typo style={styles.markerTextActive}>A</Typo>
            </View>
            <View style={[styles.mapMarker, { top: 30, left: 70 }]}>
              <Typo style={styles.markerText}>A</Typo>
            </View>
            <View style={[styles.mapMarker, { top: 20, right: 80 }]}>
              <Typo style={styles.markerText}>A</Typo>
            </View>
            <View style={[styles.mapMarker, { bottom: 30, left: 100 }]}>
              <Typo style={styles.markerText}>A</Typo>
            </View>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses, locations, or keywords"
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'nearby' && styles.filterPillActive]}
            onPress={() => setActiveFilter('nearby')}
          >
            <Ionicons
              name="location"
              size={12}
              color={activeFilter === 'nearby' ? Colors.white : Colors.blue}
            />
            <Typo style={[styles.filterText, activeFilter === 'nearby' && styles.filterTextActive]}>
              Nearby
            </Typo>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterPill}>
            <Typo style={styles.filterText}>All Types</Typo>
            <Ionicons name="chevron-down" size={12} color={Colors.gray500} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterPill}>
            <Typo style={styles.filterText}>18 Holes</Typo>
            <Ionicons name="chevron-down" size={12} color={Colors.gray500} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterPill}>
            <Typo style={styles.filterText}>All Conditions</Typo>
            <Ionicons name="chevron-down" size={12} color={Colors.gray500} />
          </TouchableOpacity>
        </ScrollView>

        {/* Nearby Header */}
        <View style={styles.sectionHeader}>
          <Typo variant="label" style={styles.sectionTitle}>NEARBY COURSES</Typo>
          <TouchableOpacity>
            <Typo variant="small" style={styles.seeAll}>See all</Typo>
          </TouchableOpacity>
        </View>

        {/* Course Cards List */}
        {MOCK_NEARBY.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={styles.courseCard}
            activeOpacity={0.88}
            onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })}
          >
            <Image source={{ uri: course.image }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <Typo variant="bodyMedium" style={styles.courseTitle}>{course.name}</Typo>
              <Typo variant="caption" style={styles.courseCity}>
                {course.city} • {course.distance}
              </Typo>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={Colors.primaryBlack} />
                <Typo variant="caption" style={styles.ratingVal}>{course.rating}</Typo>
                <Typo variant="caption" style={styles.reviewsCount}>({course.reviews})</Typo>
                <Typo variant="caption" style={styles.holesCount}>{course.holes} holes</Typo>
              </View>
              <View style={styles.tagsRow}>
                {course.tags.map((tag) => (
                  <View key={tag} style={styles.tagPill}>
                    <Typo style={styles.tagText}>{tag}</Typo>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.weatherColumn}>
              <Ionicons name={course.weatherIcon as any} size={16} color={Colors.primaryBlack} />
              <Typo variant="caption" style={styles.weatherTemp}>{course.weather.split(' ')[0]}</Typo>
              <Typo variant="caption" style={styles.weatherSub}>{course.weather.split(' ')[1]}</Typo>
              <Ionicons name="chevron-forward" size={16} color={Colors.gray300} style={{ marginTop: 8 }} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Featured Course Banner */}
        <View style={styles.sectionHeader}>
          <Typo variant="label" style={styles.sectionTitle}>FEATURED COURSE</Typo>
        </View>

        <View style={styles.featuredCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&auto=format&fit=crop&q=80' }}
            style={styles.featuredImg}
          />
          <View style={styles.featuredDarkOverlay} />
          <View style={styles.featuredContent}>
            <View style={{ flex: 1 }}>
              <Typo variant="bodyMedium" style={styles.featuredTitle}>Maple Hill DGC</Typo>
              <Typo variant="caption" style={styles.featuredSub}>Top rated in your area</Typo>
            </View>
            <TouchableOpacity
              style={styles.viewCourseBtn}
              onPress={() => router.push({ pathname: '/course/[id]', params: { id: 'maple-hill' } })}
            >
              <Typo style={styles.viewCourseText}>View Course</Typo>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  title: { fontSize: 32, fontFamily: Typography.fontFamily.bold },
  bellBtn: { padding: 4, position: 'relative' },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.blue,
  },

  // Map Header
  mapGraphicCard: {
    height: 140,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapImage: { width: '100%', height: '100%', opacity: 0.8 },
  mapOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  mapMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primaryBlack,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  mapMarkerActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.blue,
    borderColor: Colors.white,
    borderWidth: 2,
  },
  markerText: { fontSize: 12, fontFamily: Typography.fontFamily.bold, color: Colors.primaryBlack },
  markerTextActive: { fontSize: 16, fontFamily: Typography.fontFamily.bold, color: Colors.white },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.primaryBlack,
    padding: 0,
  },

  // Filter Pills
  filterRow: { gap: Spacing.sm, marginBottom: Spacing.xl },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    gap: 6,
  },
  filterPillActive: { backgroundColor: Colors.blue, borderColor: Colors.blue },
  filterText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.medium, color: Colors.primaryBlack },
  filterTextActive: { color: Colors.white },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: Typography.size.xs, color: Colors.secondaryText, fontFamily: Typography.fontFamily.semiBold, letterSpacing: 0.8 },
  seeAll: { color: Colors.blue, fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.sm },

  // Course Card
  courseCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  cardImage: { width: 84, height: 84, borderRadius: BorderRadius.md },
  cardInfo: { flex: 1, gap: 2 },
  courseTitle: { fontSize: Typography.size.base, fontFamily: Typography.fontFamily.bold },
  courseCity: { color: Colors.secondaryText, fontSize: Typography.size.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingVal: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.xs },
  reviewsCount: { color: Colors.secondaryText, fontSize: Typography.size.xs },
  holesCount: { color: Colors.secondaryText, fontSize: Typography.size.xs, marginLeft: 6 },
  tagsRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  tagPill: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, color: '#B45309', fontFamily: Typography.fontFamily.medium },

  weatherColumn: { alignItems: 'flex-end', justifyContent: 'center' },
  weatherTemp: { fontFamily: Typography.fontFamily.bold, fontSize: 12, marginTop: 2 },
  weatherSub: { color: Colors.secondaryText, fontSize: 10 },

  // Featured Banner
  featuredCard: {
    height: 100,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  featuredImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featuredDarkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  featuredContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 },
  featuredTitle: { color: Colors.white, fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },
  featuredSub: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.size.xs },
  viewCourseBtn: { backgroundColor: Colors.blue, borderRadius: BorderRadius.full, paddingHorizontal: 16, paddingVertical: 10 },
  viewCourseText: { color: Colors.white, fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.xs },
});
