import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Linking,
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
  const [isFullScreenMapOpen, setIsFullScreenMapOpen] = useState(false);
  
  const { latitude, longitude, isLoading: isLocationLoading, hasPermission, requestLocationPermission } = useLocation();

  // Search Here State
  const [targetLat, setTargetLat] = useState<number | null>(null);
  const [targetLng, setTargetLng] = useState<number | null>(null);
  const [mapDelta, setMapDelta] = useState<number>(0.08);
  const [showSearchHere, setShowSearchHere] = useState<boolean>(false);
  const [isSearchingArea, setIsSearchingArea] = useState<boolean>(false);

  const displayLat = targetLat ?? latitude ?? 39.63;
  const displayLng = targetLng ?? longitude ?? -84.22;

  const currentMapCenterRef = useRef({
    latitude: displayLat,
    longitude: displayLng,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });

  const { data: nearestCourses, isLoading: isCoursesLoading, refetch } = useNearestCourses(displayLat, displayLng);

  // Safety Capping: Maximum 20 courses rendered at any time to prevent API charges or performance slowdowns
  const MAX_COURSES_LIMIT = 20;

  const rawCoursesList = nearestCourses ?? [];
  const cappedCoursesList = rawCoursesList.slice(0, MAX_COURSES_LIMIT);

  const filtered = cappedCoursesList.filter((c) => {
    const matchesSearch = !searchQuery.trim() || (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!matchesSearch) return false;

    if (activeFilter === '18holes') {
      return c.holeCount >= 18;
    }
    if (activeFilter === '9holes') {
      return c.holeCount < 18;
    }
    if (activeFilter === 'under5mi') {
      return c.distanceMiles !== undefined && c.distanceMiles <= 5;
    }
    if (activeFilter === 'verified') {
      return c.status === 'open';
    }

    return true;
  });

  function handleRegionChangeComplete(region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) {
    currentMapCenterRef.current = region;
    setMapDelta(region.latitudeDelta);

    const anchorLat = targetLat ?? displayLat;
    const anchorLng = targetLng ?? displayLng;

    if (anchorLat !== null && anchorLng !== null) {
      const distMoved = Math.abs(region.latitude - anchorLat) + Math.abs(region.longitude - anchorLng);
      if (distMoved > 0.005) {
        setShowSearchHere(true);
      }
    }
  }

  async function handleSearchThisArea() {
    const center = currentMapCenterRef.current;
    setIsSearchingArea(true);
    setShowSearchHere(false);
    setTargetLat(center.latitude);
    setTargetLng(center.longitude);
    await refetch();
    setIsSearchingArea(false);
  }

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
              initialRegion={{
                latitude: displayLat,
                longitude: displayLng,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              onRegionChangeComplete={handleRegionChangeComplete}
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
                        <Typo variant="bodyMedium" style={styles.calloutTitle} numberOfLines={1}>{course.name}</Typo>
                        <Typo variant="caption" style={styles.calloutLocation}>
                          {course.state ? `${course.city}, ${course.state}` : course.city}
                        </Typo>
                        <Typo variant="caption" style={styles.calloutSub}>
                          {course.holeCount} Holes{course.totalDistanceFt ? ` • ${course.totalDistanceFt.toLocaleString()} ft` : ''}
                        </Typo>
                        {course.distanceMiles !== undefined && (
                          <Typo variant="caption" style={styles.calloutDistance}>
                            {course.distanceMiles.toFixed(1)} mi away
                          </Typo>
                        )}
                        <View style={styles.calloutBtn}>
                          <Typo style={styles.calloutBtnText}>View Course →</Typo>
                        </View>
                      </View>
                    </Callout>
                  </Marker>
                ))}
              </MapView>

            {/* Bottom-Right Full Screen Map Expand Button */}
            <TouchableOpacity
              style={styles.fullScreenExpandBtn}
              activeOpacity={0.85}
              onPress={() => setIsFullScreenMapOpen(true)}
            >
              <Ionicons name="expand-outline" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </AnimatedFadeIn>

        {/* Full-Screen Interactive Map Modal */}
        <Modal
          visible={isFullScreenMapOpen}
          animationType="slide"
          onRequestClose={() => setIsFullScreenMapOpen(false)}
        >
          <View style={styles.fullScreenModalContainer}>
            <MapView
              style={styles.fullScreenMapView}
              provider={PROVIDER_DEFAULT}
              initialRegion={{
                latitude: displayLat,
                longitude: displayLng,
                latitudeDelta: 0.12,
                longitudeDelta: 0.12,
              }}
                onRegionChangeComplete={handleRegionChangeComplete}
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
                      onPress={() => {
                        setIsFullScreenMapOpen(false);
                        router.push({ pathname: '/course/[id]', params: { id: course.id } });
                      }}
                    >
                      <View style={styles.calloutInner}>
                        <Typo variant="bodyMedium" style={styles.calloutTitle} numberOfLines={1}>{course.name}</Typo>
                        <Typo variant="caption" style={styles.calloutLocation}>
                          {course.state ? `${course.city}, ${course.state}` : course.city}
                        </Typo>
                        <Typo variant="caption" style={styles.calloutSub}>
                          {course.holeCount} Holes{course.totalDistanceFt ? ` • ${course.totalDistanceFt.toLocaleString()} ft` : ''}
                        </Typo>
                        <View style={styles.calloutBtn}>
                          <Typo style={styles.calloutBtnText}>View Course →</Typo>
                        </View>
                      </View>
                    </Callout>
                  </Marker>
                ))}
              </MapView>

            {/* Top-Center Floating Search Pill in Fullscreen */}
            <SafeAreaView style={styles.fullScreenTopOverlay} edges={['top']}>
              {mapDelta > 2.5 ? (
                <View style={styles.zoomNoticePill}>
                  <Ionicons name="alert-circle-outline" size={14} color={Colors.white} />
                  <Typo style={styles.zoomNoticeText}>Zoom in closer to search courses</Typo>
                </View>
              ) : showSearchHere ? (
                <TouchableOpacity
                  style={styles.searchHerePill}
                  activeOpacity={0.85}
                  onPress={handleSearchThisArea}
                >
                  {isSearchingArea ? (
                    <DiscSpinner size={16} label="" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="search" size={14} color={Colors.white} />
                      <Typo style={styles.searchHereText}>Search This Area</Typo>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </SafeAreaView>

            {/* Bottom-Right Minimize/Exit Fullscreen Button */}
            <SafeAreaView style={styles.bottomRightMinimizeOverlay} edges={['bottom']}>
              <TouchableOpacity
                style={styles.closeModalBtn}
                activeOpacity={0.85}
                onPress={() => setIsFullScreenMapOpen(false)}
              >
                <Ionicons name="contract-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </Modal>

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

        {/* Nearby Courses Header */}
        <View style={styles.sectionHeader}>
          <Typo variant="label" style={styles.sectionTitle}>
            COURSES NEAR YOU ({filtered.length})
          </Typo>
        </View>

        {/* Course Cards List */}
        {isLocationLoading || isCoursesLoading ? (
          <DiscSpinner label="Finding closest disc golf courses..." size={36} />
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
                    {course.state ? `${course.city}, ${course.state}` : course.city}
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
                  {course.holeCount} Holes{course.totalDistanceFt ? ` • ${course.totalDistanceFt.toLocaleString()} ft` : ''}{course.parTotal ? ` • Par ${course.parTotal}` : ''}
                </Typo>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color={Colors.primaryBlack} />
                  <Typo variant="caption" style={styles.ratingText}>4.8</Typo>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Subtle Data Attribution */}
        <TouchableOpacity
          style={styles.attributionBox}
          activeOpacity={0.7}
          onPress={() => Linking.openURL('https://discgolfapi.com')}
        >
          <Typo variant="caption" style={styles.attributionText}>
            Course data supplied by OpenStreetMap (OSM) & DiscGolfAPI.
          </Typo>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 32 },

  attributionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  attributionText: {
    color: Colors.gray400,
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },

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

  // Floating Search Here Pill Styles
  searchHerePill: {
    position: 'absolute',
    top: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBlack,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.md,
    zIndex: 99,
  },
  searchHereText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
  },
  zoomNoticePill: {
    position: 'absolute',
    top: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(9, 9, 10, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
    zIndex: 99,
  },
  zoomNoticeText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
  },
  fullScreenTopOverlay: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },

  // Interactive Map View
  mapContainer: {
    height: 220,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.base,
    position: 'relative',
    ...Shadows.md,
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  mapLoadingPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSoft,
  },
  fullScreenExpandBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBlack,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },

  // Full Screen Modal Styles
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: Colors.primaryBlack,
    position: 'relative',
  },
  fullScreenMapView: {
    width: '100%',
    height: '100%',
  },
  bottomRightMinimizeOverlay: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 999,
  },
  closeModalBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryBlack,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  customMapPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryBlack,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows.sm,
  },
  calloutBox: {
    width: 175,
    padding: Spacing.xs,
  },
  calloutInner: {
    gap: 3,
  },
  calloutTitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
  },
  calloutLocation: {
    fontSize: 10,
    color: Colors.blue,
    fontFamily: Typography.fontFamily.medium,
  },
  calloutSub: {
    fontSize: 10,
    color: Colors.secondaryText,
  },
  calloutDistance: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryBlack,
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
    padding: Spacing.lg,
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
