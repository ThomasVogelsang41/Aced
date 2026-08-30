import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from './ui/Typography';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface Course3DViewProps {
  courseName: string;
  totalHoles?: number;
  currentHole?: number;
}

const MOCK_3D_HOLES = [
  { hole: 1, par: 3, distance: '345 ft', elevation: '-12 ft (Downhill)', flightPath: 'RHBH Hyzer Flip', description: 'Dogleg right past the pine tree cluster. Aim left of the main fairway tree.' },
  { hole: 2, par: 4, distance: '512 ft', elevation: '+8 ft (Uphill)', flightPath: 'RHBH Distance Driver', description: 'Long open fairway with OB pond on left. Basket protected by rock wall.' },
  { hole: 3, par: 3, distance: '280 ft', elevation: 'Even (Flat)', flightPath: 'RHBH Straight Midrange', description: 'Tight wooded tunnel shot. Mando pole on left tree at 180 ft.' },
  { hole: 4, par: 3, distance: '390 ft', elevation: '-18 ft (Downhill)', flightPath: 'RHBH Anhyzer Flex', description: 'Elevated tee pad overlooking water hazard. Watch out for tailwind.' },
  { hole: 5, par: 5, distance: '680 ft', elevation: '+15 ft (Uphill)', flightPath: 'RHBH Roller / Power Drive', description: 'Monster par 5 through open field into wooded greens complex.' },
];

export const Course3DView: React.FC<Course3DViewProps> = ({
  courseName,
  totalHoles = 18,
  currentHole = 1,
}) => {
  const [selectedHoleIdx, setSelectedHoleIdx] = useState(currentHole - 1);
  const [cameraPitch, setCameraPitch] = useState<'3D' | 'TopDown'>('3D');

  const holeData = MOCK_3D_HOLES[selectedHoleIdx % MOCK_3D_HOLES.length];

  // Animated disc flight position along 3D trajectory curve
  const flightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    flightAnim.setValue(0);
    const animLoop = Animated.loop(
      Animated.timing(flightAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    animLoop.start();
    return () => animLoop.stop();
  }, [selectedHoleIdx]);

  // Interpolate animated disc position along 3D arc
  const discX = flightAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [30, 160, 260],
  });

  const discY = flightAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [180, 50, 90],
  });

  return (
    <View style={styles.container}>
      {/* 3D Canvas Perspective Container */}
      <View style={[styles.canvas3D, cameraPitch === 'TopDown' && styles.canvasTopDown]}>
        {/* Grid & Terrain Satellite Mesh Mockup */}
        <View style={styles.terrainBackground}>
          <View style={styles.gridOverlay} />
          {/* Contour Lines */}
          <View style={styles.contourCircle1} />
          <View style={styles.contourCircle2} />
        </View>

        {/* 3D Tee Pad Marker */}
        <View style={styles.teePadMarker}>
          <View style={styles.teePadBase}>
            <Typo style={styles.teePadText}>TEE {holeData.hole}</Typo>
          </View>
        </View>

        {/* 3D Flight Trajectory Arc */}
        <View style={styles.trajectoryPathContainer}>
          {/* Dashed trajectory line */}
          <View style={styles.trajectoryCurve} />
          {/* Animated 3D Disc traveling along trajectory */}
          <Animated.View
            style={[
              styles.animatedDisc3D,
              {
                transform: [
                  { translateX: discX },
                  { translateY: discY },
                ],
              },
            ]}
          >
            <Ionicons name="disc" size={22} color={Colors.blue} />
          </Animated.View>
        </View>

        {/* 3D Basket Goal Marker */}
        <View style={styles.basketMarker3D}>
          <View style={styles.flagPole}>
            <View style={styles.flagBanner}>
              <Typo style={styles.flagText}>P{holeData.par}</Typo>
            </View>
          </View>
          <View style={styles.basketChains}>
            <Ionicons name="hardware-chip-outline" size={18} color={Colors.primaryBlack} />
          </View>
          <View style={styles.basketBase} />
        </View>

        {/* 3D Camera Controls overlay */}
        <View style={styles.cameraControlsRow}>
          <TouchableOpacity
            style={[styles.camBtn, cameraPitch === '3D' && styles.camBtnActive]}
            onPress={() => setCameraPitch('3D')}
          >
            <Ionicons name="cube-outline" size={14} color={cameraPitch === '3D' ? Colors.white : Colors.primaryBlack} />
            <Typo style={[styles.camText, cameraPitch === '3D' && styles.camTextActive]}>3D Flyover</Typo>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.camBtn, cameraPitch === 'TopDown' && styles.camBtnActive]}
            onPress={() => setCameraPitch('TopDown')}
          >
            <Ionicons name="map-outline" size={14} color={cameraPitch === 'TopDown' ? Colors.white : Colors.primaryBlack} />
            <Typo style={[styles.camText, cameraPitch === 'TopDown' && styles.camTextActive]}>2D Map</Typo>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hole Specs & Controls Footer */}
      <View style={styles.specsCard}>
        <View style={styles.holeHeaderRow}>
          <TouchableOpacity
            style={styles.navHoleBtn}
            disabled={selectedHoleIdx === 0}
            onPress={() => setSelectedHoleIdx((prev) => Math.max(0, prev - 1))}
          >
            <Ionicons name="chevron-back" size={20} color={selectedHoleIdx === 0 ? Colors.gray300 : Colors.primaryBlack} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Typo variant="h2" style={styles.holeTitle}>Hole {holeData.hole}</Typo>
            <Typo variant="caption" style={styles.holeSub}>Par {holeData.par} • {holeData.distance}</Typo>
          </View>

          <TouchableOpacity
            style={styles.navHoleBtn}
            disabled={selectedHoleIdx === totalHoles - 1}
            onPress={() => setSelectedHoleIdx((prev) => Math.min(totalHoles - 1, prev + 1))}
          >
            <Ionicons name="chevron-forward" size={20} color={selectedHoleIdx === totalHoles - 1 ? Colors.gray300 : Colors.primaryBlack} />
          </TouchableOpacity>
        </View>

        <View style={styles.specBadgesRow}>
          <View style={styles.specBadge}>
            <Ionicons name="navigate-outline" size={14} color={Colors.blue} />
            <Typo variant="caption" style={styles.badgeText}>{holeData.distance}</Typo>
          </View>
          <View style={styles.specBadge}>
            <Ionicons name="trending-down-outline" size={14} color={Colors.green} />
            <Typo variant="caption" style={styles.badgeText}>{holeData.elevation}</Typo>
          </View>
          <View style={styles.specBadge}>
            <Ionicons name="swap-horizontal-outline" size={14} color={Colors.orange} />
            <Typo variant="caption" style={styles.badgeText}>{holeData.flightPath}</Typo>
          </View>
        </View>

        <Typo variant="small" style={styles.descriptionText}>{holeData.description}</Typo>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    ...Shadows.md,
  },

  // 3D Canvas
  canvas3D: {
    height: 240,
    backgroundColor: '#1E293B',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  canvasTopDown: {
    backgroundColor: '#0F172A',
  },
  terrainBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#15803D', // Fairway Green
    opacity: 0.85,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contourCircle1: {
    position: 'absolute',
    top: 40,
    left: 80,
    width: 180,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  contourCircle2: {
    position: 'absolute',
    top: 70,
    left: 120,
    width: 100,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Tee Pad
  teePadMarker: {
    position: 'absolute',
    left: 20,
    bottom: 30,
  },
  teePadBase: {
    width: 50,
    height: 26,
    backgroundColor: '#94A3B8',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teePadText: {
    fontSize: 9,
    color: Colors.primaryBlack,
    fontFamily: Typography.fontFamily.bold,
  },

  // Trajectory Path & Animated Disc
  trajectoryPathContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  trajectoryCurve: {
    position: 'absolute',
    top: 70,
    left: 45,
    width: 250,
    height: 100,
    borderTopWidth: 2.5,
    borderColor: Colors.blue,
    borderStyle: 'dashed',
    borderRadius: 120,
  },
  animatedDisc3D: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Basket Goal
  basketMarker3D: {
    position: 'absolute',
    right: 30,
    top: 50,
    alignItems: 'center',
  },
  flagPole: {
    height: 36,
    width: 3,
    backgroundColor: Colors.white,
    alignItems: 'center',
    position: 'relative',
  },
  flagBanner: {
    position: 'absolute',
    top: 0,
    right: -24,
    backgroundColor: Colors.red,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
  },
  flagText: {
    color: Colors.white,
    fontSize: 8,
    fontFamily: Typography.fontFamily.bold,
  },
  basketChains: {
    width: 24,
    height: 20,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryBlack,
  },
  basketBase: {
    width: 14,
    height: 4,
    backgroundColor: '#64748B',
    borderRadius: 2,
  },

  // Camera Toggle overlay
  cameraControlsRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    backgroundColor: 'rgba(9, 9, 10, 0.75)',
    borderRadius: BorderRadius.full,
    padding: 3,
    gap: 4,
  },
  camBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  camBtnActive: {
    backgroundColor: Colors.blue,
  },
  camText: {
    fontSize: 10,
    color: Colors.gray400,
    fontFamily: Typography.fontFamily.medium,
  },
  camTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },

  // Specs Footer Card
  specsCard: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  holeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navHoleBtn: {
    padding: Spacing.xs,
  },
  holeTitle: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.bold,
  },
  holeSub: {
    color: Colors.secondaryText,
    fontSize: Typography.size.xs,
  },

  specBadgesRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'space-between',
  },
  specBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.md,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primaryBlack,
  },

  descriptionText: {
    color: Colors.secondaryText,
    fontSize: Typography.size.xs,
    lineHeight: 16,
  },
});
