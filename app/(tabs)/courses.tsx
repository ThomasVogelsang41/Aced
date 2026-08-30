import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { Typo } from '../../components/ui/Typography';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useLocation } from '../../hooks/useLocation';
import { useNearestCourses } from '../../hooks/useNearestCourses';
import { TabHeader } from '../../components/TabHeader';
import { AnimatedFadeIn } from '../../components/ui/AnimatedFadeIn';
import { DiscSpinner } from '../../components/ui/DiscSpinner';

export default function CoursesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('nearby');
  const { latitude, longitude, hasPermission, requestLocationPermission } = useLocation();

  const userLat = latitude ?? 42.2514;
  const userLng = longitude ?? -71.9424;

  const { data: nearestCourses, isLoading } = useNearestCourses(userLat, userLng);

  const coursesList = nearestCourses ?? [
    {
      id: 'maple-hill',
      name: 'Maple Hill DGC',
      city: 'Leicester',
      state: 'MA',
      country: 'US',
      holeCount: 18,
      status: 'open',
      latitude: 42.2514,
      longitude: -71.9424,
      distanceMiles: 2.1,
    },
    {
      id: 'pine-ridge',
      name: 'Pine Ridge DGC',
      city: 'Auburn',
      state: 'MA',
      country: 'US',
      holeCount: 18,
      status: 'open',
      latitude: 42.1945,
      longitude: -71.8359,
      distanceMiles: 4.8,
    },
    {
      id: 'oak-grove',
      name: 'Oak Grove DGC',
      city: 'Pasadena',
      state: 'CA',
      country: 'US',
      holeCount: 18,
      status: 'open',
      latitude: 34.1872,
      longitude: -118.1706,
      distanceMiles: 8.5,
    },
  ];

  const filtered = searchQuery.trim()
    ? coursesList.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : coursesList;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Uniform Top Header */}
        <AnimatedFadeIn delay={0}>
          <TabHeader subtitle="Course Directory" title="Map" />
        </AnimatedFadeIn>

        {!hasPermission && (
          <AnimatedFadeIn delay={50}>
            <TouchableOpacity
              style={styles.locationPermissionBanner}
              activeOpacity={0.85}
              onPress={requestLocationPermission}
            >
              <View style={styles.permIconCircle}>
                <Ionicons name="navigate" size={18} color={Colors.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Typo variant="bodyMedium" style={styles.permTitle}>Use My Location</Typo>
                <Typo variant="caption" style={styles.permSub}>Tap to enable GPS & see courses near you</Typo>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </AnimatedFadeIn>
        )}

        {/* Interactive React Native MapView */}
        <AnimatedFadeIn delay={100}>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.mapView}
              provider={PROVIDER_DEFAULT}
              region={{
                latitude: userLat,
                longitude: userLng,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
              mapType="standard"
            >
              {filtered.map((course) => (
                <Marker
                  key={course.id}
                  coordinate={{
                    latitude: course.latitude,
                    longitude: course.longitude,
                  }}
                  title={course.name}
                  description={`${course.holeCount} Holes • ${course.city}, ${course.state}`}
                >
                  <View style={styles.customMapPin}>
                    <Ionicons name="disc" size={14} color={Colors.white} />
                  </View>

                  <Callout
                    style={styles.calloutBox}
                    onPress={() =>
                      router.push({ pathname: '/course/[id]', params: { id: course.id } })
                    }
                  >
                    <View style={styles.calloutInner}>
                      <Typo variant="bodyMedium" style={styles.calloutTitle}>{course.name}</Typo>
                      <Typo variant="caption" style={styles.calloutSub}>
                        {course.holeCount} Holes • {course.distanceMiles ? `${course.distanceMiles.toFixed(1)} mi` : 'Nearby'}
                      </Typo>
                      <View style={styles.calloutBtn}>
                        <Typo style={styles.calloutBtnText}>View Course →</Typo>
                      </View>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          </View>
        </AnimatedFadeIn>

        {/* Search Input */}
        <AnimatedFadeIn delay={180}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses by name or city..."
              placeholderTextColor={Colors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </AnimatedFadeIn>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'nearby' && styles.filterPillActive]}
            onPress={() => setActiveFilter('nearby')}
          >
            <Ionicons
              name="location"
              size={14}
              color={activeFilter === 'nearby' ? Colors.white : Colors.primaryBlack}
            />
            <Typo style={[styles.filterText, activeFilter === 'nearby' && styles.filterTextActive]}>
              Nearby
            </Typo>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterPill}>
            <Typo style={styles.filterText}>18 Holes</Typo>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterPill}>
            <Typo style={styles.filterText}>Verified Layouts</Typo>
          </TouchableOpacity>
        </ScrollView>

        {/* Nearby Courses Header */}
        <View style={styles.sectionHeader}>
          <Typo variant="label" style={styles.sectionTitle}>
            COURSES NEAR YOU ({filtered.length})
          </Typo>
        </View>

        {/* Course Cards List */}
        {isLoading ? (
          <DiscSpinner label="Locating nearby disc golf courses..." size={36} />
        ) : (
          filtered.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              activeOpacity={0.88}
              onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.pinCircle}>
                  <Ionicons name="disc" size={18} color={Colors.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typo variant="bodyMedium" style={styles.courseTitle}>{course.name}</Typo>
                  <Typo variant="caption" style={styles.courseLocation}>
                    {course.city}, {course.state}
                  </Typo>
                </View>
                {course.distanceMiles !== undefined && (
                  <View style={styles.distanceBadge}>
                    <Typo style={styles.distanceText}>{course.distanceMiles.toFixed(1)} mi</Typo>
                  </View>
                )}
              </View>

              <View style={styles.cardFooterRow}>
                <Typo variant="caption" style={styles.holesText}>
                  {course.holeCount} Holes • Par 58
                </Typo>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color={Colors.primaryBlack} />
                  <Typo variant="caption" style={styles.ratingText}>4.8</Typo>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  // Location Permission Banner
  locationPermissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blueLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.blueBorder,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  permIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.blue,
  },
  permSub: {
    color: Colors.secondaryText,
    fontSize: Typography.size.xs,
  },

  // Interactive Map View
  mapContainer: {
    height: 220,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  customMapPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows.sm,
  },
  calloutBox: {
    width: 160,
    padding: Spacing.xs,
  },
  calloutInner: {
    gap: 4,
  },
  calloutTitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
  },
  calloutSub: {
    fontSize: 10,
    color: Colors.secondaryText,
  },
  calloutBtn: {
    backgroundColor: Colors.blue,
    borderRadius: BorderRadius.sm,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginTop: 4,
    alignItems: 'center',
  },
  calloutBtnText: {
    color: Colors.white,
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
  },

  // Search Bar
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
  filterRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryBlack,
    borderColor: Colors.primaryBlack,
  },
  filterText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryBlack,
  },
  filterTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },

  // Section Header
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.xs,
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 0.8,
  },

  // Course Cards
  courseCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.base,
  },
  courseLocation: {
    color: Colors.secondaryText,
    fontSize: Typography.size.xs,
  },
  distanceBadge: {
    backgroundColor: Colors.primaryBlack,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanceText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
  },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundSoft,
  },
  holesText: {
    color: Colors.secondaryText,
    fontSize: Typography.size.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xs,
  },
});
