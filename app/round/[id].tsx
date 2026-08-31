import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MapView, { Marker, Polyline, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { Typo } from '../../components/ui/Typography';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useRoundStore } from '../../store/roundStore';
import { useLocation } from '../../hooks/useLocation';
import { useWeather } from '../../hooks/useWeather';
import { degreesToCardinal } from '../../lib/openmeteo';
import { DiscGolfBasketIcon } from '../../components/icons/DiscGolfBasketIcon';
import * as Haptics from 'expo-haptics';
import type { Hole } from '../../types/course';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getDistanceFeet(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 3.28084);
}

function getHeadingBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos((lon2 - lon1) * (Math.PI / 180));
  const brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}

function generateCurvedFlightPath(
  tee: { latitude: number; longitude: number },
  basket: { latitude: number; longitude: number },
  curveFactor = 0.12,
  numPoints = 16
): { latitude: number; longitude: number }[] {
  const dLat = basket.latitude - tee.latitude;
  const dLng = basket.longitude - tee.longitude;

  const midLat = (tee.latitude + basket.latitude) / 2;
  const midLng = (tee.longitude + basket.longitude) / 2;

  const controlLat = midLat - dLng * curveFactor;
  const controlLng = midLng + dLat * curveFactor;

  const points: { latitude: number; longitude: number }[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const oneMinusT = 1 - t;

    const lat =
      oneMinusT * oneMinusT * tee.latitude +
      2 * oneMinusT * t * controlLat +
      t * t * basket.latitude;

    const lng =
      oneMinusT * oneMinusT * tee.longitude +
      2 * oneMinusT * t * controlLng +
      t * t * basket.longitude;

    points.push({ latitude: lat, longitude: lng });
  }

  return points;
}

export default function ActiveRoundScreen() {
  const {
    activeRound,
    course,
    holes,
    recordScore,
    nextHole,
    prevHole,
    goToHole,
    finishRound,
    abandonRound,
  } = useRoundStore();

  const { latitude: userLat, longitude: userLng } = useLocation();
  const { data: weather } = useWeather(userLat, userLng);
  const mapRef = useRef<MapView>(null);

  const [mapType, setMapType] = useState<'satellite' | 'standard'>('satellite');

  const currentHoleIndex = activeRound?.currentHoleIndex ?? 0;
  const currentHoleScore = activeRound?.round?.scores[currentHoleIndex];
  const holeCount = activeRound?.round?.scores?.length ?? course?.holeCount ?? 18;

  // Active hole data or fallback
  const currentHole: Hole = holes[currentHoleIndex] ?? {
    id: `hole-${currentHoleIndex + 1}`,
    layoutId: 'layout-1',
    holeNumber: currentHoleIndex + 1,
    par: 3,
    distanceFt: 310,
  };

  const [currentStrokes, setCurrentStrokes] = useState<number>(
    currentHoleScore?.strokes && currentHoleScore.strokes > 0 ? currentHoleScore.strokes : currentHole.par
  );

  useEffect(() => {
    const existing = activeRound?.round?.scores[currentHoleIndex]?.strokes;
    setCurrentStrokes(existing && existing > 0 ? existing : currentHole.par);
  }, [currentHoleIndex, activeRound]);

  // Anchor Basket Pin in exact same spot on screen (just below top header bar) for every hole
  useEffect(() => {
    if (mapRef.current && currentHole) {
      const teeLat = currentHole.teeLat ?? course?.latitude;
      const teeLng = currentHole.teeLng ?? course?.longitude;
      const basketLat = currentHole.basketLat;
      const basketLng = currentHole.basketLng;

      if (teeLat && teeLng) {
        if (basketLat && basketLng) {
          const bearing = getHeadingBearing(teeLat, teeLng, basketLat, basketLng);
          
          // Compute camera center offset along reverse bearing to position Basket higher up on screen
          const distMeters = (currentHole.distanceFt || 300) * 0.3048;
          const offsetMeters = distMeters * 0.48;
          const reverseRad = (bearing - 180) * (Math.PI / 180);
          const latOffset = (offsetMeters / 111320) * Math.cos(reverseRad);
          const lngOffset = (offsetMeters / (111320 * Math.cos(basketLat * (Math.PI / 180)))) * Math.sin(reverseRad);

          const centerLat = basketLat + latOffset;
          const centerLng = basketLng + lngOffset;

          const targetZoom = Math.max(16.2, Math.min(18.2, 19.5 - distMeters / 120));

          mapRef.current.animateCamera(
            {
              center: { latitude: centerLat, longitude: centerLng },
              heading: bearing,
              zoom: targetZoom,
              pitch: 0,
            },
            { duration: 800 }
          );
        } else {
          mapRef.current.animateCamera(
            {
              center: { latitude: teeLat, longitude: teeLng },
              zoom: 17,
              heading: 0,
            },
            { duration: 800 }
          );
        }
      }
    }
  }, [currentHoleIndex, currentHole, course]);

  // Calculate live feet to basket from user's location if available
  const liveFeetToBasket =
    userLat && userLng && currentHole.basketLat && currentHole.basketLng
      ? getDistanceFeet(userLat, userLng, currentHole.basketLat, currentHole.basketLng)
      : currentHole.distanceFt;

  const teeCoords = currentHole.teeLat && currentHole.teeLng ? { latitude: currentHole.teeLat, longitude: currentHole.teeLng } : null;
  const basketCoords = currentHole.basketLat && currentHole.basketLng ? { latitude: currentHole.basketLat, longitude: currentHole.basketLng } : null;

  // Smart Caddie Recommendation calculation
  const smartRecommendation = React.useMemo(() => {
    const dist = currentHole.distanceFt;
    const wind = weather?.windSpeed ?? 8;
    const hNum = currentHole.holeNumber;

    if (dist > 380 || wind > 12) {
      return {
        disc: 'Destroyer',
        type: 'Overstable Distance Driver',
        line: 'RHBH Hyzer arc wide left around tree line',
        curveFactor: 0.18,
      };
    } else if (dist > 280) {
      return {
        disc: 'Explorer',
        type: 'Stable Fairway Driver',
        line: hNum % 2 === 0 ? 'Flex S-curve shaping around center tree gap' : 'Hyzer flip straight down fairway corridor',
        curveFactor: hNum % 2 === 0 ? -0.14 : 0.12,
      };
    } else {
      return {
        disc: 'Buzzz',
        type: 'Overstable Midrange',
        line: 'Low-ceiling straight tunnel line directly to pin',
        curveFactor: 0.05,
      };
    }
  }, [currentHole, weather]);

  // Build fairway polyline coordinates (straight centerline)
  const polylineCoords = React.useMemo(() => {
    if (currentHole.fairwayPath && currentHole.fairwayPath.length > 2) {
      return currentHole.fairwayPath.map((pt) => ({ latitude: pt.lat, longitude: pt.lng }));
    }
    if (teeCoords && basketCoords) {
      return [teeCoords, basketCoords];
    }
    return [];
  }, [currentHole, teeCoords, basketCoords]);

  const [isFlyingHole, setIsFlyingHole] = useState(false);

  function handleFlyHole() {
    if (!mapRef.current || !teeCoords || !basketCoords) return;
    setIsFlyingHole(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const initialBearing = getHeadingBearing(teeCoords.latitude, teeCoords.longitude, basketCoords.latitude, basketCoords.longitude);
    const midLat = (teeCoords.latitude + basketCoords.latitude) / 2;
    const midLng = (teeCoords.longitude + basketCoords.longitude) / 2;

    // Step 1: Start behind Tee Pad looking forward down fairway with 60 deg 3D tilt
    mapRef.current.animateCamera(
      {
        center: teeCoords,
        heading: initialBearing,
        pitch: 60,
        zoom: 18.5,
      },
      { duration: 1200 }
    );

    // Step 2: Fly forward above the fairway gap & dogleg
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.animateCamera(
          {
            center: { latitude: midLat, longitude: midLng },
            heading: (initialBearing + 15) % 360,
            pitch: 50,
            zoom: 18,
          },
          { duration: 1500 }
        );
      }
    }, 1400);

    // Step 3: Swoop in toward Basket & start 360 orbit
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.animateCamera(
          {
            center: basketCoords,
            heading: (initialBearing + 180) % 360,
            pitch: 45,
            zoom: 18.8,
          },
          { duration: 2000 }
        );
      }
    }, 3000);

    // Step 4: Complete 360 orbit around Basket pin
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.animateCamera(
          {
            center: basketCoords,
            heading: (initialBearing + 360) % 360,
            pitch: 40,
            zoom: 18.5,
          },
          { duration: 2000 }
        );
      }
    }, 5100);

    // Step 5: Return to standard play view
    setTimeout(() => {
      setIsFlyingHole(false);
      if (mapRef.current && currentHole) {
        const distMeters = (currentHole.distanceFt || 300) * 0.3048;
        const offsetMeters = distMeters * 0.48;
        const reverseRad = (initialBearing - 180) * (Math.PI / 180);
        const latOffset = (offsetMeters / 111320) * Math.cos(reverseRad);
        const lngOffset = (offsetMeters / (111320 * Math.cos(basketCoords.latitude * (Math.PI / 180)))) * Math.sin(reverseRad);

        mapRef.current.animateCamera(
          {
            center: { latitude: basketCoords.latitude + latOffset, longitude: basketCoords.longitude + lngOffset },
            heading: initialBearing,
            zoom: Math.max(16.2, Math.min(18.2, 19.5 - distMeters / 120)),
            pitch: 0,
          },
          { duration: 900 }
        );
      }
    }, 7200);
  }

  // Build smart recommended obstacle-avoidance throw line
  const recommendedThrowCoords = React.useMemo(() => {
    if (teeCoords && basketCoords) {
      return generateCurvedFlightPath(teeCoords, basketCoords, smartRecommendation.curveFactor, 20);
    }
    return [];
  }, [teeCoords, basketCoords, smartRecommendation]);

  function handleRecordScoreAndAdvance(strokes: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    recordScore(currentHole.holeNumber, strokes);
    if (currentHoleIndex < holeCount - 1) {
      nextHole();
    } else {
      handlePromptFinishRound();
    }
  }

  function handlePromptFinishRound() {
    Alert.alert(
      'Finish Round?',
      'Are you ready to complete your round and view your final scorecard summary?',
      [
        { text: 'Keep Playing', style: 'cancel' },
        {
          text: 'Finish Round',
          style: 'default',
          onPress: () => {
            finishRound();
            router.replace('/round/summary');
          },
        },
      ]
    );
  }

  function handleAbandonRound() {
    Alert.alert(
      'Abandon Round?',
      'Are you sure you want to quit this round? Your progress will not be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: () => {
            abandonRound();
            router.back();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Live Interactive Map Surface */}
      <MapView
        ref={mapRef}
        style={styles.mapView}
        provider={PROVIDER_DEFAULT}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={true}
        pitchEnabled={false}
        moveOnMarkerPress={false}
        loadingEnabled={true}
        initialRegion={{
          latitude: currentHole.teeLat ?? course?.latitude ?? 37.7749,
          longitude: currentHole.teeLng ?? course?.longitude ?? -122.4194,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        }}
      >
        {/* Fairway Trajectory Polyline */}
        {polylineCoords.length >= 2 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor={Colors.blue}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Tee Pad Marker */}
        {teeCoords && (
          <Marker coordinate={teeCoords} title={`Hole ${currentHole.holeNumber} Tee`}>
            <View style={styles.teeMarkerBadge}>
              <Typo style={styles.teeMarkerText}>T{currentHole.holeNumber}</Typo>
            </View>
          </Marker>
        )}

        {/* Basket Target Marker */}
        {basketCoords && (
          <Marker coordinate={basketCoords} title={`Hole ${currentHole.holeNumber} Basket`}>
            <View style={styles.basketMarkerBadge}>
              <DiscGolfBasketIcon size={28} />
            </View>
          </Marker>
        )}

        {/* 3D Circle 1 (33ft) and Circle 2 (66ft) Distance Rings */}
        {basketCoords && (
          <>
            <Circle
              center={basketCoords}
              radius={10.05}
              strokeColor="rgba(59, 130, 246, 0.8)"
              fillColor="rgba(59, 130, 246, 0.15)"
              strokeWidth={1.5}
            />
            <Circle
              center={basketCoords}
              radius={20.1}
              strokeColor="rgba(59, 130, 246, 0.4)"
              fillColor="rgba(59, 130, 246, 0.05)"
              strokeWidth={1}
              lineDashPattern={[4, 4]}
            />
          </>
        )}
      </MapView>

      {/* Top Floating Controls & Header Overlay */}
      <SafeAreaView style={styles.safeTopOverlay} pointerEvents="box-none" edges={['top']}>
        <View style={styles.headerBar} pointerEvents="box-none">
          <TouchableOpacity style={styles.headerCircleBtn} onPress={handleAbandonRound}>
            <Ionicons name="close" size={20} color={Colors.primaryBlack} />
          </TouchableOpacity>

          <View style={styles.headerTitleCard}>
            <Typo variant="bodyMedium" style={styles.courseTitleText} numberOfLines={1}>
              {course?.name ?? 'Active Round'}
            </Typo>
            <Typo variant="caption" style={styles.holeDetailsText}>
              Hole {currentHole.holeNumber} of {holeCount} • Par {currentHole.par} • {currentHole.distanceFt} ft
            </Typo>
          </View>

          {/* Spacer to keep course title perfectly centered */}
          <View style={{ width: 44, height: 44 }} />
        </View>
      </SafeAreaView>

      {/* Fixed Position Overlay Row: Left Telemetry & Right Action Stack */}
      <View style={styles.overlayControlsRow} pointerEvents="box-none">
        <View style={styles.leftTelemetryStack}>
          <View style={styles.telemetryCard}>
            <Ionicons
              name="navigate-outline"
              size={16}
              color={Colors.primaryBlack}
              style={{
                transform: [{ rotate: `${weather?.windDirection ?? 315}deg` }],
              }}
            />
            <Typo style={styles.telemetryVal}>{weather ? `${weather.windSpeed} mph` : '8 mph'}</Typo>
            <Typo style={styles.telemetrySub}>
              {weather ? degreesToCardinal(weather.windDirection) : 'NW'} WIND
            </Typo>
          </View>

          <View style={styles.telemetryCard}>
            <Ionicons name="flag-outline" size={16} color={Colors.blue} />
            <Typo style={styles.telemetryVal}>{liveFeetToBasket} ft</Typo>
            <Typo style={styles.telemetrySub}>TO PIN</Typo>
          </View>
        </View>

        {/* Right Map Type Action Buttons */}
        <View style={styles.rightActionStack}>
          {/* 3D Cinematic Flyover Button */}
          <TouchableOpacity
            style={[styles.blueCircleAction, isFlyingHole && { backgroundColor: '#D97706' }]}
            onPress={handleFlyHole}
            activeOpacity={0.8}
          >
            <Ionicons name={isFlyingHole ? "pause" : "videocam"} size={22} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.blueCircleAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMapType(mapType === 'satellite' ? 'standard' : 'satellite');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={mapType === 'satellite' ? 'map-outline' : 'earth-outline'}
              size={22}
              color={Colors.white}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.blueCircleAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (userLat && userLng && mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: userLat,
                  longitude: userLng,
                  latitudeDelta: 0.003,
                  longitudeDelta: 0.003,
                });
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="locate" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Interactive Scorecard Drawer */}
      <View style={styles.bottomDrawer}>
        <View style={styles.drawerHandle} />

        {/* Hole Picker Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.holeSelectorRow}>
          {Array.from({ length: holeCount }).map((_, idx) => {
            const hNum = idx + 1;
            const isCurrent = idx === currentHoleIndex;
            const score = activeRound?.round?.scores[idx];
            const hasScore = score && score.strokes > 0;

            return (
              <TouchableOpacity
                key={hNum}
                style={[
                  styles.holePill,
                  isCurrent && styles.holePillActive,
                  hasScore && !isCurrent && styles.holePillRecorded,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  goToHole(idx);
                }}
              >
                <Typo style={[styles.holePillNum, isCurrent && styles.holePillNumActive]}>
                  Hole {hNum}
                </Typo>
                {hasScore && (
                  <Typo style={[styles.holePillScore, isCurrent && styles.holePillScoreActive]}>
                    {score.strokes}
                  </Typo>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tactile Stroke Counter Buttons */}
        <View style={styles.strokeSection}>
          <Typo variant="caption" style={styles.strokeSectionTitle}>SELECT STROKES</Typo>
          <View style={styles.strokeButtonsRow}>
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const isSelected = currentStrokes === num;
              const parDiff = num - currentHole.par;
              let badgeColor: string = Colors.primaryBlack;
              if (num === 1) badgeColor = '#D97706'; // Ace gold
              else if (parDiff < 0) badgeColor = Colors.green; // Under par green
              else if (parDiff === 0) badgeColor = Colors.blue; // Par blue
              else if (parDiff > 0) badgeColor = '#EF4444'; // Over par red

              return (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.strokeBtn,
                    isSelected && { backgroundColor: badgeColor, borderColor: badgeColor },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setCurrentStrokes(num);
                    recordScore(currentHole.holeNumber, num);
                  }}
                  activeOpacity={0.8}
                >
                  <Typo style={[styles.strokeBtnText, isSelected && styles.strokeBtnTextSelected]}>
                    {num}
                  </Typo>
                  <Typo style={[styles.strokeBadgeText, isSelected && styles.strokeBadgeTextSelected]}>
                    {num === 1 ? 'ACE' : parDiff === 0 ? 'PAR' : parDiff > 0 ? `+${parDiff}` : `${parDiff}`}
                  </Typo>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Smart Caddie Recommendation Card */}
        <View style={styles.smartRecBanner}>
          <Ionicons name="sparkles" size={16} color={Colors.blue} />
          <View style={{ flex: 1 }}>
            <Typo variant="caption" style={styles.smartRecTitle}>
              RECOMMENDED FLIGHT PATH
            </Typo>
            <Typo variant="caption" style={styles.smartRecSub}>
              <Typo style={{ color: Colors.blue, fontWeight: 'bold' }}>{smartRecommendation.disc}</Typo> • {smartRecommendation.line}
            </Typo>
          </View>
        </View>

        {/* Primary Action Buttons: Next Hole / Finish Round */}
        <View style={styles.actionRow}>
          {currentHoleIndex > 0 && (
            <TouchableOpacity 
              style={styles.prevBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                prevHole();
              }}
            >
              <Ionicons name="arrow-back" size={18} color={Colors.primaryBlack} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.confirmBtn}
            activeOpacity={0.88}
            onPress={() => handleRecordScoreAndAdvance(currentStrokes)}
          >
            <Typo style={styles.confirmBtnText}>
              {currentHoleIndex < holeCount - 1 ? `Next Hole (${currentHoleIndex + 2}) →` : 'Finish Round'}
            </Typo>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryBlack },
  mapView: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },

  // Markers
  teeMarkerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryBlack,
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows.sm,
  },
  teeMarkerText: { color: Colors.white, fontSize: 10, fontFamily: Typography.fontFamily.bold },
  basketMarkerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
    ...Shadows.md,
  },
  mandoBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },

  // Safe Top Overlay Controls
  safeTopOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    marginTop: 34,
  },
  headerCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  headerTitleCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    maxWidth: SCREEN_WIDTH - 120,
    ...Shadows.sm,
  },
  courseTitleText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },
  holeDetailsText: { color: Colors.secondaryText, fontSize: Typography.size.xs },

  // Left & Right Controls
  overlayControlsRow: {
    position: 'absolute',
    top: 185,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    alignItems: 'flex-start',
    zIndex: 99,
  },
  leftTelemetryStack: { gap: 8 },
  telemetryCard: {
    width: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
    ...Shadows.sm,
  },
  telemetryVal: { fontFamily: Typography.fontFamily.bold, fontSize: 11 },
  telemetrySub: { fontSize: 7, color: Colors.secondaryText, fontFamily: Typography.fontFamily.bold },

  rightActionStack: { gap: 12 },
  blueCircleAction: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },

  // Bottom Sheet Drawer
  bottomDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 34,
    gap: 12,
    ...Shadows.md,
  },
  drawerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.gray300, alignSelf: 'center' },

  // Hole Selector
  holeSelectorRow: { gap: 8, paddingVertical: 2 },
  holePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  holePillActive: { backgroundColor: Colors.primaryBlack, borderColor: Colors.primaryBlack },
  holePillRecorded: { backgroundColor: Colors.blueLight, borderColor: Colors.blue },
  holePillNum: { fontSize: 11, fontFamily: Typography.fontFamily.medium, color: Colors.primaryBlack },
  holePillNumActive: { color: Colors.white },
  holePillScore: { fontSize: 11, fontFamily: Typography.fontFamily.bold, color: Colors.blue },
  holePillScoreActive: { color: Colors.white },

  // Stroke Section
  strokeSection: { gap: 6 },
  strokeSectionTitle: { letterSpacing: 1, color: Colors.secondaryText, fontSize: 10 },
  strokeButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  strokeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  strokeBtnText: { fontSize: 16, fontFamily: Typography.fontFamily.bold, color: Colors.primaryBlack },
  strokeBtnTextSelected: { color: Colors.white },
  strokeBadgeText: { fontSize: 8, fontFamily: Typography.fontFamily.bold, color: Colors.secondaryText, marginTop: 1 },
  strokeBadgeTextSelected: { color: Colors.white },

  // Lie Row
  // Action Row
  actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  smartRecBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  smartRecTitle: { fontSize: 10, fontFamily: Typography.fontFamily.bold, color: Colors.primaryBlack, letterSpacing: 0.5 },
  smartRecSub: { fontSize: 11, color: Colors.secondaryText },
  prevBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: Colors.blue,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  confirmBtnText: { color: Colors.white, fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },
});
