import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
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
import { computeGameStatus } from '../../lib/gameEngine';
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

const GAME_MODE_PREMIUM_DETAILS: Record<
  string,
  {
    title: string;
    badge: string;
    tagline: string;
    icon: string;
    objective: string;
    scoringSystem: string;
    tieBreaker: string;
    proTip: string;
    formatColor: string;
  }
> = {
  stroke: {
    title: 'Stroke Play (Standard)',
    badge: 'CLASSIC ACED FORMAT',
    tagline: 'Traditional disc golf layout competition. Lowest total score wins.',
    icon: 'golf-outline',
    objective: 'Complete all 18 holes using the fewest total throws possible.',
    scoringSystem: 'Each throw adds +1 stroke. Equal total score results in a playoff or split win.',
    tieBreaker: 'Sudden death playoff starting from Hole 1 or lowest raw score on back 9.',
    proTip: 'Eliminate double bogeys. Par is always your best friend on long technical fairways.',
    formatColor: '#2563EB',
  },
  skins: {
    title: 'Skins Challenge',
    badge: 'HOLE-BY-HOLE BATTLE',
    tagline: 'Outscore your group on a single hole to claim the Skin. Ties carry over!',
    icon: 'flame-outline',
    objective: 'Win individual holes cleanly. If two players tie for lowest score, the skin carries over to the next hole!',
    scoringSystem: 'Each hole is worth 1 Skin. Carryovers accumulate value until a player wins a hole outright.',
    tieBreaker: 'Final carryover skins on Hole 18 trigger a CTP (Closest to Pin) throw-off.',
    proTip: 'Play aggressively when the skin pot carries over to 3+ skins!',
    formatColor: '#D97706',
  },
  match: {
    title: 'Match Play (Head to Head)',
    badge: '1-ON-1 DUEL',
    tagline: 'Win more individual holes than your opponent. Track 1-UP, 2-UP, or All Square.',
    icon: 'trophy-outline',
    objective: 'Beat your opponent on each hole to take control of the match.',
    scoringSystem: 'Win a hole = +1 UP. Tie a hole = Halved (No change). Match ends when lead exceeds remaining holes.',
    tieBreaker: 'Extra holes played from Hole 1 under sudden death if All Square after 18.',
    proTip: 'Watch your opponent’s lie before selecting your disc line.',
    formatColor: '#10B981',
  },
  best_shot: {
    title: 'Teams (Best Shot Doubles)',
    badge: 'TEAMWORK FORMAT',
    tagline: 'Teammates throw from the tee and choose the best lie for every shot.',
    icon: 'people-outline',
    objective: 'Pair up with a teammate and maximize your team scoring power.',
    scoringSystem: 'Both players throw; the team chooses the best result and both throw their next shot from that spot.',
    tieBreaker: 'Team with the most total eagles and birdies wins tiebreakers.',
    proTip: 'Have the safer player throw first from the tee so the anchor can go for maximum distance!',
    formatColor: '#8B5CF6',
  },
  disc_roulette: {
    title: 'Disc Roulette',
    badge: 'BAG CHAOS CHALLENGE',
    tagline: 'A random disc from your active My Bag is auto-assigned on each hole!',
    icon: 'dice-outline',
    objective: 'Execute shots with whatever disc mold the ACED Roulette Wheel assigns you on the tee pad.',
    scoringSystem: 'Standard stroke play scoring applies, but disc selection is strictly restricted by ACED Roulette.',
    tieBreaker: 'Players select 1 wildcard disc for a final CTP challenge on tie.',
    proTip: 'Adapt your throw angle (hyzer/anhyzer) to compensate for overstable or understable assigned discs.',
    formatColor: '#EC4899',
  },
  birdie_battle: {
    title: 'Birdie Battle',
    badge: 'AGGRESSIVE POINTS',
    tagline: 'Earn big points for Birdies, Eagles, and Aces. Negative points for double bogeys!',
    icon: 'target-outline',
    objective: 'Accumulate maximum bonus points by attacking the basket.',
    scoringSystem: 'Ace = +5 pts | Eagle = +3 pts | Birdie = +2 pts | Par = +1 pt | Bogey = 0 pts | Double+ = -1 pt',
    tieBreaker: 'Player with the highest single-hole point score wins ties.',
    proTip: 'Go for green on par 4s — the reward for an Eagle (+3) far outweighs a conservative layup.',
    formatColor: '#059669',
  },
  one_disc: {
    title: 'One Disc Challenge',
    badge: 'SINGLE MOLD MASTERY',
    tagline: 'Select 1 disc mold from your bag for the entire 18-hole round!',
    icon: 'disc-outline',
    objective: 'Play the entire 18 holes using only 1 designated disc mold.',
    scoringSystem: 'Standard stroke play scoring. Throws made with unassigned discs incur a +2 stroke penalty.',
    tieBreaker: 'Player with the lowest score on the hardest rated hole wins ties.',
    proTip: 'Choose a versatile fairway driver or neutral putter/midrange that handles both drives & putts.',
    formatColor: '#6366F1',
  },
};

const GolfScorecardStrip: React.FC<{
  currentHoleIndex: number;
  scores: Array<{ holeNumber: number; strokes: number }>;
  onSelectHole: (idx: number) => void;
}> = ({ currentHoleIndex, scores, onSelectHole }) => {
  const players = [
    { name: 'Thomas' },
    { name: 'Jake' },
    { name: 'Mike' },
  ];

  return (
    <View style={styles.golfScorecardContainer}>
      <Typo variant="caption" style={styles.scorecardTitleText}>LIVE GOLF SCORECARD</Typo>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.golfScorecardGrid}>
        {/* Player Name Column */}
        <View style={styles.scorecardColHeader}>
          <View style={styles.scorecardCellHeaderBox}>
            <Typo style={styles.scorecardCellHeaderText}>HOLE</Typo>
          </View>
          {players.map((p, i) => (
            <View key={i} style={styles.scorecardCellPlayerBox}>
              <Typo style={styles.scorecardPlayerName} numberOfLines={1}>{p.name}</Typo>
            </View>
          ))}
        </View>

        {/* 18 Hole Columns */}
        {Array.from({ length: 18 }).map((_, idx) => {
          const hNum = idx + 1;
          const isCurrent = idx === currentHoleIndex;
          const userStrokes = scores[idx]?.strokes ?? 0;

          // Simulated group scores for demo parity
          const jakeStrokes = userStrokes > 0 ? (userStrokes === 3 ? 3 : Math.max(2, userStrokes - 1)) : 0;
          const mikeStrokes = userStrokes > 0 ? (userStrokes === 3 ? 4 : Math.max(3, userStrokes + 1)) : 0;

          return (
            <TouchableOpacity
              key={hNum}
              style={[styles.scorecardHoleCol, isCurrent && styles.scorecardHoleColActive]}
              onPress={() => onSelectHole(idx)}
            >
              <View style={[styles.scorecardHoleHeaderBox, isCurrent && styles.scorecardHoleHeaderBoxActive]}>
                <Typo style={[styles.scorecardHoleNum, isCurrent && styles.scorecardHoleNumActive]}>{hNum}</Typo>
              </View>

              {/* Thomas Score */}
              <View style={styles.scorecardScoreBox}>
                <Typo style={[styles.scorecardScoreCell, userStrokes > 0 && styles.scorecardRecordedUser]}>
                  {userStrokes > 0 ? userStrokes : '-'}
                </Typo>
              </View>

              {/* Jake Score */}
              <View style={styles.scorecardScoreBox}>
                <Typo style={[styles.scorecardScoreCell, jakeStrokes > 0 && styles.scorecardRecordedP2]}>
                  {jakeStrokes > 0 ? jakeStrokes : '-'}
                </Typo>
              </View>

              {/* Mike Score */}
              <View style={styles.scorecardScoreBox}>
                <Typo style={[styles.scorecardScoreCell, mikeStrokes > 0 && styles.scorecardRecordedP3]}>
                  {mikeStrokes > 0 ? mikeStrokes : '-'}
                </Typo>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

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

  const [is3DMode, setIs3DMode] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isScoreInputModalOpen, setIsScoreInputModalOpen] = useState(false);
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState(false);

  const [currentStrokes, setCurrentStrokes] = useState<number>(
    currentHoleScore?.strokes && currentHoleScore.strokes > 0 ? currentHoleScore.strokes : currentHole.par
  );

  useEffect(() => {
    const existing = activeRound?.round?.scores[currentHoleIndex]?.strokes;
    setCurrentStrokes(existing && existing > 0 ? existing : currentHole.par);
  }, [currentHoleIndex, activeRound]);

  const currentGameType = activeRound?.round?.gameType ?? 'stroke';
  const gameDetails = GAME_MODE_PREMIUM_DETAILS[currentGameType] ?? GAME_MODE_PREMIUM_DETAILS.stroke;

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
  // Compute active game status summary using game engine
  const gameSummary = React.useMemo(() => {
    if (!activeRound?.round) return computeGameStatus();
    const roundPlayers = activeRound.round.players || [];
    const playerScoresMap: { [id: string]: any } = {};
    (activeRound.round.playerScores || []).forEach((ps) => {
      playerScoresMap[ps.playerId] = ps.scores;
    });
    return computeGameStatus(
      activeRound.round.gameType,
      roundPlayers,
      playerScoresMap,
      currentHoleIndex,
      activeRound.round.gameSettings
    );
  }, [activeRound, currentHoleIndex]);

  // Build sleek curved fairway polyline trajectory coordinates
  const polylineCoords = React.useMemo(() => {
    if (currentHole.fairwayPath && currentHole.fairwayPath.length > 2) {
      return currentHole.fairwayPath.map((pt) => ({ latitude: pt.lat, longitude: pt.lng }));
    }
    if (teeCoords && basketCoords) {
      return generateCurvedFlightPath(teeCoords, basketCoords, smartRecommendation.curveFactor, 24);
    }
    return [];
  }, [currentHole, teeCoords, basketCoords, smartRecommendation]);

  function toggle3DPitch() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next3D = !is3DMode;
    setIs3DMode(next3D);

    if (mapRef.current) {
      if (teeCoords && basketCoords) {
        const bearing = getHeadingBearing(teeCoords.latitude, teeCoords.longitude, basketCoords.latitude, basketCoords.longitude);
        const distMeters = (currentHole.distanceFt || 300) * 0.3048;
        const offsetMeters = distMeters * 0.48;
        const reverseRad = (bearing - 180) * (Math.PI / 180);
        const latOffset = (offsetMeters / 111320) * Math.cos(reverseRad);
        const lngOffset = (offsetMeters / (111320 * Math.cos(basketCoords.latitude * (Math.PI / 180)))) * Math.sin(reverseRad);

        mapRef.current.animateCamera(
          {
            center: { latitude: basketCoords.latitude + latOffset, longitude: basketCoords.longitude + lngOffset },
            heading: bearing,
            pitch: next3D ? 65 : 0,
            zoom: Math.max(16.2, Math.min(18.2, 19.5 - distMeters / 120)),
          },
          { duration: 700 }
        );
      } else if (course) {
        mapRef.current.animateCamera(
          {
            center: { latitude: course.latitude, longitude: course.longitude },
            pitch: next3D ? 65 : 0,
            zoom: 17,
          },
          { duration: 700 }
        );
      }
    }
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
            router.replace('/(tabs)');
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
        mapType="satellite"
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        moveOnMarkerPress={false}
        loadingEnabled={true}
        initialRegion={{
          latitude: currentHole.teeLat ?? course?.latitude ?? 37.7749,
          longitude: currentHole.teeLng ?? course?.longitude ?? -122.4194,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        }}
      >
        {/* Sleek Tight Fairway Trajectory Polyline */}
        {polylineCoords.length >= 2 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#2563EB"
            strokeWidth={2.5}
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

          {/* Balanced spacer view replacing white circle button */}
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

        {/* Right Map Action Buttons */}
        <View style={styles.rightActionStack}>
          {/* Locate Me Button */}
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
            <Ionicons name="locate" size={20} color={Colors.white} />
            <Typo style={styles.actionBtnLabel}>GPS</Typo>
          </TouchableOpacity>

          {/* Game Rules & Info Floating Side Button */}
          <TouchableOpacity
            style={[styles.blueCircleAction, { backgroundColor: Colors.primaryBlack }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsLeaderboardOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="book-outline" size={18} color={Colors.white} />
            <Typo style={styles.actionBtnLabel}>RULES</Typo>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dual Bottom Control Bar: White Scorecard Button on Left & Black Input Score Button on Right */}
      <View style={styles.dualBottomBar}>
        {/* Left White Button: Scorecard */}
        <TouchableOpacity
          style={styles.whiteScorecardBtn}
          activeOpacity={0.88}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsScorecardModalOpen(true);
          }}
        >
          <Ionicons name="clipboard-outline" size={20} color={Colors.primaryBlack} />
          <Typo style={styles.whiteScorecardBtnText}>Scorecard</Typo>
        </TouchableOpacity>

        {/* Right Black Button: Input Score */}
        <TouchableOpacity
          style={styles.blackInputScoreBtn}
          activeOpacity={0.88}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsScoreInputModalOpen(true);
          }}
        >
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Typo style={styles.blackInputScoreBtnText}>Input Score</Typo>
        </TouchableOpacity>
      </View>

      {/* INPUT SCORE BOTTOM SHEET DRAWER */}
      <Modal
        visible={isScoreInputModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsScoreInputModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.bottomSheetBackdrop}
          activeOpacity={1}
          onPress={() => setIsScoreInputModalOpen(false)}
        >
          <TouchableOpacity style={styles.bottomSheetCard} activeOpacity={1}>
            <View style={styles.bottomSheetHeader}>
              <View>
                <Typo variant="h3" style={{ fontWeight: 'bold' }}>Input Score — Hole {currentHoleIndex + 1}</Typo>
                <Typo variant="caption" style={{ color: Colors.secondaryText }}>
                  Par {currentHole.par} • {currentHole.distanceFt ?? 310} FT
                </Typo>
              </View>
              <TouchableOpacity style={styles.closeBtnSmall} onPress={() => setIsScoreInputModalOpen(false)}>
                <Ionicons name="close" size={20} color={Colors.primaryBlack} />
              </TouchableOpacity>
            </View>

            {/* Easy Prev / Next Hole Navigation Bar */}
            <View style={styles.holeNavRow}>
              <TouchableOpacity
                style={[styles.holeNavBtn, currentHoleIndex === 0 && styles.holeNavBtnDisabled]}
                disabled={currentHoleIndex === 0}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  prevHole();
                }}
              >
                <Ionicons name="chevron-back" size={16} color={currentHoleIndex === 0 ? Colors.gray400 : Colors.primaryBlack} />
                <Typo style={[styles.holeNavBtnText, currentHoleIndex === 0 && { color: Colors.gray400 }]}>
                  {currentHoleIndex > 0 ? `Prev (Hole ${currentHoleIndex})` : 'Hole 1'}
                </Typo>
              </TouchableOpacity>

              <Typo style={styles.holeNavCurrentText}>Hole {currentHoleIndex + 1} of {holeCount}</Typo>

              <TouchableOpacity
                style={[styles.holeNavBtn, currentHoleIndex === holeCount - 1 && styles.holeNavBtnDisabled]}
                disabled={currentHoleIndex === holeCount - 1}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  nextHole();
                }}
              >
                <Typo style={[styles.holeNavBtnText, currentHoleIndex === holeCount - 1 && { color: Colors.gray400 }]}>
                  {currentHoleIndex < holeCount - 1 ? `Next (Hole ${currentHoleIndex + 2})` : 'Finish'}
                </Typo>
                <Ionicons name="chevron-forward" size={16} color={currentHoleIndex === holeCount - 1 ? Colors.gray400 : Colors.primaryBlack} />
              </TouchableOpacity>
            </View>

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

            {/* Primary Save Action Button */}
            <TouchableOpacity
              style={styles.bottomSheetSaveBtn}
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                handleRecordScoreAndAdvance(currentStrokes);
                setIsScoreInputModalOpen(false);
              }}
            >
              <Typo style={styles.bottomSheetSaveBtnText}>
                {currentHoleIndex < holeCount - 1 ? `Save & Advance to Hole ${currentHoleIndex + 2} →` : 'Save & Finish Round'}
              </Typo>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* GAME RULES & LIVE STANDINGS MODAL */}
      <Modal visible={isLeaderboardOpen} animationType="slide" onRequestClose={() => setIsLeaderboardOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top']}>
          {/* Header */}
          <View style={styles.modalHeaderDown}>
            <View>
              <Typo variant="h2" style={{ fontWeight: 'bold' }}>Game Rules & Standings</Typo>
              <Typo variant="caption" style={{ color: Colors.secondaryText }}>
                {course?.name} • Hole {currentHoleIndex + 1} of {holeCount}
              </Typo>
            </View>
            <TouchableOpacity style={styles.headerCircleBtn} onPress={() => setIsLeaderboardOpen(false)}>
              <Ionicons name="close" size={22} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg, gap: 16 }}>
            {/* Hero Format Card */}
            <View style={[styles.heroFormatCard, { backgroundColor: gameDetails.formatColor }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={styles.heroFormatIconCircle}>
                  <Ionicons name={gameDetails.icon as any} size={24} color={Colors.white} />
                </View>
                <View style={styles.heroFormatBadgeTag}>
                  <Typo style={styles.heroFormatBadgeText}>{gameDetails.badge}</Typo>
                </View>
              </View>

              <Typo style={styles.heroFormatTitle}>{gameDetails.title}</Typo>
              <Typo style={styles.heroFormatTagline}>{gameDetails.tagline}</Typo>
            </View>

            {/* Broadcast Rules Breakdown Grid */}
            <View style={styles.rulesBreakdownContainer}>
              <Typo variant="label" style={{ color: Colors.secondaryText, letterSpacing: 0.8, marginBottom: 4 }}>
                OFFICIAL FORMAT RULEBOOK
              </Typo>

              {/* Rule 1: Objective */}
              <View style={styles.ruleCardItem}>
                <View style={styles.ruleIconBox}>
                  <Ionicons name="flag-outline" size={18} color={gameDetails.formatColor} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Typo style={styles.ruleItemTitle}>OBJECTIVE</Typo>
                  <Typo style={styles.ruleItemBody}>{gameDetails.objective}</Typo>
                </View>
              </View>

              {/* Rule 2: Scoring System */}
              <View style={styles.ruleCardItem}>
                <View style={styles.ruleIconBox}>
                  <Ionicons name="calculator-outline" size={18} color={gameDetails.formatColor} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Typo style={styles.ruleItemTitle}>SCORING SYSTEM</Typo>
                  <Typo style={styles.ruleItemBody}>{gameDetails.scoringSystem}</Typo>
                </View>
              </View>

              {/* Rule 3: Tie-Breaker */}
              <View style={styles.ruleCardItem}>
                <View style={styles.ruleIconBox}>
                  <Ionicons name="repeat-outline" size={18} color={gameDetails.formatColor} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Typo style={styles.ruleItemTitle}>TIE-BREAKER RULE</Typo>
                  <Typo style={styles.ruleItemBody}>{gameDetails.tieBreaker}</Typo>
                </View>
              </View>

              {/* Rule 4: Smart Caddie Pro Tip */}
              <View style={styles.proTipCardItem}>
                <Ionicons name="sparkles" size={18} color="#D97706" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Typo style={{ fontWeight: 'bold', fontSize: 11, color: '#92400E', letterSpacing: 0.5 }}>
                    SMART CADDIE PRO TIP
                  </Typo>
                  <Typo style={{ fontSize: 12, color: '#78350F', lineHeight: 17 }}>
                    {gameDetails.proTip}
                  </Typo>
                </View>
              </View>
            </View>

            {/* Live Standings Section */}
            <View style={styles.standingsSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Typo variant="label" style={{ color: Colors.secondaryText, letterSpacing: 0.8 }}>
                  LIVE GROUP STANDINGS
                </Typo>
                <Typo style={{ fontSize: 11, color: Colors.blue, fontWeight: 'bold' }}>
                  {gameSummary.headline}
                </Typo>
              </View>

              {gameSummary.details.map((player, idx) => (
                <View key={idx} style={styles.standingsRowCard}>
                  <Typo style={styles.standingsRankBadge}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </Typo>
                  <View style={{ flex: 1 }}>
                    <Typo style={{ fontWeight: 'bold', fontSize: 15 }}>{player.playerName}</Typo>
                    <Typo style={{ color: Colors.secondaryText, fontSize: 11 }}>
                      {idx === 0 ? '1st Place' : idx === 1 ? '2nd Place' : '3rd Place'} • Group Competitor
                    </Typo>
                  </View>
                  <View style={[styles.standingsScorePill, { backgroundColor: gameDetails.formatColor }]}>
                    <Typo style={styles.standingsScoreText}>{player.valueText}</Typo>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* LIVE 18-HOLE SCORECARD MODAL */}
      <Modal
        visible={isScorecardModalOpen}
        animationType="slide"
        onRequestClose={() => setIsScorecardModalOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top']}>
          <View style={styles.modalHeaderDown}>
            <View>
              <Typo variant="h2" style={{ fontWeight: 'bold' }}>Round Scorecard</Typo>
              <Typo variant="caption" style={{ color: Colors.secondaryText }}>
                {course?.name ?? 'Disc Golf Course'} • Live Hole {currentHoleIndex + 1}
              </Typo>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsScorecardModalOpen(false)}>
              <Ionicons name="close" size={22} color={Colors.primaryBlack} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg }}>
            <GolfScorecardStrip
              currentHoleIndex={currentHoleIndex}
              scores={activeRound?.round?.scores ?? []}
              onSelectHole={(idx) => {
                goToHole(idx);
                setIsScorecardModalOpen(false);
              }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingTop: 4,
    marginTop: 0,
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
    top: 420,
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
  actionBtnLabel: { color: Colors.white, fontSize: 8, fontFamily: Typography.fontFamily.bold, marginTop: 1 },

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

  // Dynamic Game Status Banner
  gameStatusBanner: {
    backgroundColor: Colors.primaryBlack,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  gameStatusHeadline: { color: Colors.white, fontSize: 13, fontFamily: Typography.fontFamily.bold, letterSpacing: 0.5 },
  gameStatusSubline: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 11, fontFamily: Typography.fontFamily.medium },

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
  // Simplified Two Square Buttons Bar
  twoSquareBar: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    gap: 12,
  },
  dualBottomBar: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    gap: 12,
  },
  whiteScorecardBtn: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  whiteScorecardBtnText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: Colors.primaryBlack,
  },
  blackInputScoreBtn: {
    flex: 1.2,
    height: 56,
    backgroundColor: Colors.primaryBlack,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.md,
  },
  blackInputScoreBtnText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: Colors.white,
  },

  // Modal styles
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderDown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  gameRulesCard: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Premium Hero Format Card
  heroFormatCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 8,
    ...Shadows.md,
  },
  heroFormatIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFormatBadgeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  heroFormatBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  heroFormatTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  heroFormatTagline: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 17,
  },

  // Rules Breakdown Grid
  rulesBreakdownContainer: {
    gap: 10,
  },
  ruleCardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.sm,
  },
  ruleIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleItemTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.secondaryText,
    letterSpacing: 0.8,
  },
  ruleItemBody: {
    fontSize: 13,
    color: Colors.primaryBlack,
    lineHeight: 18,
    fontWeight: '500',
  },
  proTipCardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
    gap: 10,
  },

  // Live Standings
  standingsSection: {
    gap: 8,
    marginTop: 4,
  },
  standingsRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.sm,
  },
  standingsRankBadge: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  standingsScorePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  standingsScoreText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalPrevBtn: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Bottom Sheet Drawer Styles for Input Score
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl + 12,
    gap: 12,
    maxHeight: '82%',
    ...Shadows.md,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holeNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  holeNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  holeNavBtnDisabled: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  holeNavBtnText: { fontSize: 11, fontWeight: 'bold', color: Colors.primaryBlack },
  holeNavCurrentText: { fontSize: 12, fontWeight: 'bold', color: Colors.primaryBlack },

  // Live Golf Scorecard Strip
  golfScorecardContainer: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  scorecardTitleText: { fontSize: 9, fontWeight: 'bold', color: Colors.secondaryText, letterSpacing: 0.8 },
  golfScorecardGrid: { flexDirection: 'row', gap: 4 },
  scorecardColHeader: { width: 56, gap: 2 },
  scorecardCellHeaderBox: { height: 22, justifyContent: 'center' },
  scorecardCellHeaderText: { fontSize: 8, fontWeight: 'bold', color: Colors.secondaryText },
  scorecardCellPlayerBox: { height: 22, justifyContent: 'center' },
  scorecardPlayerName: { fontSize: 10, fontWeight: 'bold', color: Colors.primaryBlack },
  scorecardHoleCol: { width: 28, alignItems: 'center', gap: 2, borderRadius: 4 },
  scorecardHoleColActive: { backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: Colors.blue },
  scorecardHoleHeaderBox: { height: 22, width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 3, backgroundColor: Colors.white },
  scorecardHoleHeaderBoxActive: { backgroundColor: Colors.blue },
  scorecardHoleNum: { fontSize: 10, fontWeight: 'bold', color: Colors.primaryBlack },
  scorecardHoleNumActive: { color: Colors.white },
  scorecardScoreBox: { height: 22, width: '100%', alignItems: 'center', justifyContent: 'center' },
  scorecardScoreCell: { fontSize: 11, fontWeight: 'bold', color: Colors.secondaryText },
  scorecardRecordedUser: { color: Colors.blue, fontWeight: 'bold' },
  scorecardRecordedP2: { color: Colors.primaryBlack, fontWeight: 'bold' },
  scorecardRecordedP3: { color: Colors.primaryBlack, fontWeight: 'bold' },

  bottomSheetSaveBtn: {
    backgroundColor: Colors.primaryBlack,
    borderRadius: BorderRadius.xl,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...Shadows.md,
  },
  bottomSheetSaveBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 15 },
});
