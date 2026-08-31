import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Divider } from '../../components/ui/Divider';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useRoundStore } from '../../store/roundStore';
import { useAuthStore } from '../../store/authStore';
import { useBags } from '../../hooks/useBag';
import { getCourse } from '../../lib/discgolfapi';
import { DiscSpinner } from '../../components/ui/DiscSpinner';
import type { Course } from '../../types/course';

import { fetchCourseHoleGeometry } from '../../lib/osmHoleGeometry';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { startRound } = useRoundStore();
  const { user } = useAuthStore();
  const { data: bags } = useBags(user?.id ?? null);
  const [is3dTourOpen, setIs3dTourOpen] = useState(false);
  const tourMapRef = useRef<MapView>(null);

  const { data: course, isLoading } = useQuery<Course | null>({
    queryKey: ['course', id],
    queryFn: () => getCourse(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  });

  const { data: holesGeometry } = useQuery({
    queryKey: ['courseGeometry', id, course?.latitude, course?.longitude],
    queryFn: () => fetchCourseHoleGeometry(id!, course!.latitude, course!.longitude, course!.holeCount),
    enabled: !!course,
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingCenter}>
          <DiscSpinner label="Loading course details..." size={44} />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingCenter}>
          <Typo variant="body">Course not found.</Typo>
          <Button label="Go Back" variant="ghost" size="md" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  async function handleStartRound() {
    const defaultBag = bags?.find((b) => b.isDefault) ?? bags?.[0];
    const holesToUse = holesGeometry || await fetchCourseHoleGeometry(course!.id, course!.latitude, course!.longitude, course!.holeCount);
    const roundId = startRound(course!, undefined, holesToUse, defaultBag?.id);
    router.push({ pathname: '/round/[id]', params: { id: roundId } });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primaryBlack} />
          <Typo variant="bodyMedium">Courses</Typo>
        </TouchableOpacity>

        {/* Course header */}
        <View style={styles.header}>
          <Typo variant="h1" style={styles.courseName}>{course.name}</Typo>
          <Typo variant="body" style={styles.location}>
            {course.city}, {course.state}
            {course.country !== 'US' ? `, ${course.country}` : ''}
          </Typo>
          <View style={styles.badges}>
            <Badge label={`${course.holeCount} holes`} variant="blue" />
            {holesGeometry?.some((h) => h.isOsmVerified) ? (
              <Badge label="OSM GPS Hole Geometry" variant="green" />
            ) : (
              <Badge label="Standard Layout" variant="gray" />
            )}
          </View>
        </View>

        {/* 3D Photorealistic Aerial Course Flyover Hero Card */}
        <TouchableOpacity
          style={styles.explore3dHeroCard}
          activeOpacity={0.88}
          onPress={() => setIs3dTourOpen(true)}
        >
          <View style={styles.explore3dBadgesRow}>
            <View style={styles.badge3d}>
              <Ionicons name="cube-outline" size={12} color={Colors.white} />
              <Typo style={styles.badge3dText}>EXPLORE 3D</Typo>
            </View>
            <View style={styles.badgeLive}>
              <Typo style={styles.badgeLiveText}>PHOTOREALISTIC AERIAL VIEW</Typo>
            </View>
          </View>

          <Typo variant="h2" style={styles.hero3dTitle}>
            3D Aerial Course Preview
          </Typo>
          <Typo variant="caption" style={styles.hero3dSub}>
            Take a cinematic 360° flyover tour of {course.name} fairway corridors & green targets.
          </Typo>

          <View style={styles.hero3dPlayRow}>
            <View style={styles.hero3dPlayBtn}>
              <Ionicons name="videocam" size={16} color={Colors.primaryBlack} />
              <Typo style={styles.hero3dPlayText}>Launch 3D Flyover</Typo>
            </View>
          </View>
        </TouchableOpacity>

        <Divider marginVertical={16} />

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <InfoRow icon="map-outline" label="Location" value={`${course.city}, ${course.state}`} />
          <InfoRow icon="disc-outline" label="Holes" value={String(course.holeCount)} />
          <InfoRow
            icon="compass-outline"
            label="OSM Mapping"
            value={holesGeometry?.some((h) => h.isOsmVerified) ? "Tees, Baskets & Fairways Mapped" : "Standard Layout"}
          />
          {course.distanceMiles !== undefined && (
            <InfoRow
              icon="navigate-outline"
              label="Distance"
              value={`${course.distanceMiles < 10 ? course.distanceMiles.toFixed(1) : Math.round(course.distanceMiles)} miles away`}
            />
          )}
        </View>

        <Divider marginVertical={16} />

        {/* GPS note */}
        <View style={styles.gpsNote}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.secondaryText} />
          <Typo variant="small" style={styles.gpsNoteText}>
            GPS hole distances are available for courses with ACED-verified layouts. Distances for unverified courses use hole estimates.
          </Typo>
        </View>
        {/* Subtle Data Attribution */}
        <TouchableOpacity
          style={styles.attributionBox}
          activeOpacity={0.7}
          onPress={() => Linking.openURL('https://discgolfapi.com')}
        >
          <Typo variant="caption" style={styles.attributionText}>
            Course data supplied by DiscGolfAPI.
          </Typo>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Sticky start round */}
      <View style={styles.stickyBottom}>
        <Button
          label="Start Round Here"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleStartRound}
          icon={<Ionicons name="play" size={18} color={Colors.white} />}
        />
      </View>

      {/* 3D Photorealistic Aerial Course Flyover Modal */}
      <Modal visible={is3dTourOpen} animationType="slide" onRequestClose={() => setIs3dTourOpen(false)}>
        <View style={{ flex: 1, backgroundColor: Colors.primaryBlack }}>
          <MapView
            ref={tourMapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_DEFAULT}
            mapType="satellite"
            pitchEnabled={true}
            rotateEnabled={true}
            zoomEnabled={true}
            initialRegion={{
              latitude: course.latitude,
              longitude: course.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
          >
            {holesGeometry?.map((hole) => (
              <React.Fragment key={hole.id}>
                {hole.teeLat && hole.teeLng && (
                  <Marker coordinate={{ latitude: hole.teeLat, longitude: hole.teeLng }}>
                    <View style={styles.tourMarkerTee}>
                      <Typo style={{ color: Colors.white, fontSize: 9, fontWeight: 'bold' }}>T{hole.holeNumber}</Typo>
                    </View>
                  </Marker>
                )}
                {hole.basketLat && hole.basketLng && (
                  <Marker coordinate={{ latitude: hole.basketLat, longitude: hole.basketLng }}>
                    <View style={styles.tourMarkerBasket}>
                      <Ionicons name="flag" size={12} color={Colors.white} />
                    </View>
                  </Marker>
                )}
              </React.Fragment>
            ))}
          </MapView>

          <SafeAreaView style={styles.tourHeaderOverlay} pointerEvents="box-none" edges={['top']}>
            <TouchableOpacity style={styles.tourCloseBtn} onPress={() => setIs3dTourOpen(false)}>
              <Ionicons name="close" size={20} color={Colors.primaryBlack} />
            </TouchableOpacity>

            <View style={styles.tourHeaderTitleBox}>
              <Typo variant="bodyMedium" style={{ color: Colors.white, fontWeight: 'bold' }}>
                {course.name} 3D Tour
              </Typo>
              <Typo variant="caption" style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 10 }}>
                Photorealistic Aerial View • {course.holeCount} Holes
              </Typo>
            </View>

            <View style={{ width: 44 }} />
          </SafeAreaView>

          <View style={styles.tourFooterCard}>
            <Typo variant="bodyMedium" style={{ color: Colors.white, fontWeight: 'bold' }}>
              Photorealistic 3D Aerial View
            </Typo>
            <Typo variant="caption" style={{ color: Colors.gray400, marginTop: 2 }}>
              Rotate, tilt, and zoom around {course.name}'s fairway corridors & greens.
            </Typo>
            <TouchableOpacity style={styles.tourStartBtn} onPress={() => { setIs3dTourOpen(false); handleStartRound(); }}>
              <Ionicons name="play" size={16} color={Colors.white} />
              <Typo style={{ color: Colors.white, fontWeight: 'bold' }}>Start Playing Course</Typo>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon as any} size={18} color={Colors.gray500} />
    <Typo variant="body" style={styles.infoLabel}>{label}</Typo>
    <Typo variant="bodyMedium" style={styles.infoValue}>{value}</Typo>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  header: { gap: 6 },
  courseName: { fontFamily: Typography.fontFamily.bold },
  location: { color: Colors.secondaryText },
  badges: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  infoGrid: { gap: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoLabel: { flex: 1, color: Colors.secondaryText },
  infoValue: { fontFamily: Typography.fontFamily.medium },
  gpsNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.backgroundSoft,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  gpsNoteText: { flex: 1, color: Colors.secondaryText },
  attributionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  attributionText: {
    color: Colors.gray400,
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  stickyBottom: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },

  // EXPLORE 3D Hero Card
  explore3dHeroCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    ...Shadows.md,
  },
  explore3dBadgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge3d: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badge3dText: { color: Colors.white, fontSize: 9, fontFamily: Typography.fontFamily.bold, letterSpacing: 0.5 },
  badgeLive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeLiveText: { color: Colors.white, fontSize: 8, fontFamily: Typography.fontFamily.bold, letterSpacing: 0.5 },
  hero3dTitle: { color: Colors.white, fontSize: 18, fontFamily: Typography.fontFamily.bold },
  hero3dSub: { color: Colors.gray400, fontSize: 11 },
  hero3dPlayRow: { marginTop: 4 },
  hero3dPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    gap: 6,
  },
  hero3dPlayText: { color: Colors.primaryBlack, fontSize: 11, fontFamily: Typography.fontFamily.bold },

  // Tour Overlay Styles
  tourHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    zIndex: 10,
  },
  tourCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  tourHeaderTitleBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tourFooterCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
    ...Shadows.md,
  },
  tourStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    gap: 8,
    marginTop: 4,
  },
  tourMarkerTee: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.primaryBlack,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  tourMarkerBasket: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
});
