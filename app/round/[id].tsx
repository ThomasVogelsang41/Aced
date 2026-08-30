import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from '../../components/ui/Typography';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useRoundStore } from '../../store/roundStore';

const LIE_OPTIONS = [
  { id: 'tree', label: 'Behind a tree', icon: 'tree-outline' },
  { id: 'rough', label: 'In the rough', icon: 'leaf-outline' },
  { id: 'uphill', label: 'Uphill', icon: 'trending-up-outline' },
  { id: 'headwind', label: 'Headwind', icon: 'swap-horizontal-outline', selected: true },
  { id: 'low_ceiling', label: 'Low ceiling', icon: 'cloud-outline' },
  { id: 'circle_2', label: 'Circle 2', icon: 'disc-outline' },
];

export default function ActiveRoundScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeRound, recordScore, nextHole, finishRound } = useRoundStore();
  const [selectedLie, setSelectedLie] = useState('headwind');

  const courseName = activeRound?.round?.courseName ?? 'Maple Ridge DGC';
  const holeIndex = activeRound?.currentHoleIndex ?? 6;

  return (
    <View style={styles.container}>
      {/* Satellite Aerial Map Background */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80' }}
        style={styles.mapBg}
      />

      {/* Trajectory Blue Line & Distance Pill Overlay */}
      <View style={styles.trajectoryOverlay}>
        <View style={styles.basketMarker}>
          <Ionicons name="flag-outline" size={16} color={Colors.white} />
        </View>
        <View style={styles.blueTrajectoryLine} />
        <View style={styles.distPillOnLine}>
          <Typo style={styles.distPillText}>285 ft</Typo>
        </View>
        <View style={styles.teeMarker} />
      </View>

      <SafeAreaView style={styles.safeContent} edges={['top']}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.headerCircleBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={Colors.primaryBlack} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Typo variant="bodyMedium" style={styles.courseTitleText}>{courseName}</Typo>
            <Typo variant="caption" style={styles.holeDetailsText}>
              Hole {holeIndex + 1} • Par 4 • 612 ft
            </Typo>
          </View>
          <TouchableOpacity style={styles.headerCircleBtn}>
            <Ionicons name="bookmark-outline" size={18} color={Colors.primaryBlack} />
          </TouchableOpacity>
        </View>

        {/* Map Overlay Floating Buttons */}
        <View style={styles.mapOverlayControls}>
          {/* Left Vertical Telemetry Stack */}
          <View style={styles.leftTelemetryStack}>
            <TelemetryPill icon="swap-horizontal-outline" val="3 mph" sub="HEADWIND" />
            <TelemetryPill icon="sunny-outline" val="72°" sub="TEMP" />
            <TelemetryPill icon="water-outline" val="62%" sub="HUMIDITY" />
            <TelemetryPill icon="triangle-outline" val="892 ft" sub="ELEVATION" />
          </View>

          {/* Right Vertical Blue Action Buttons */}
          <View style={styles.rightActionStack}>
            <RightBlueBtn icon="crosshairs" label="TARGET" />
            <RightBlueBtn icon="cube-outline" label="3D" />
            <RightBlueBtn icon="locate" label="LOCATE" />
          </View>
        </View>

        {/* Bottom Lie Selection Drawer */}
        <View style={styles.bottomDrawer}>
          <View style={styles.drawerHandle} />
          <Typo variant="h3" style={styles.drawerTitle}>What's your lie?</Typo>

          {/* Lie Options Grid */}
          <View style={styles.lieGrid}>
            {LIE_OPTIONS.map((opt) => {
              const isSel = selectedLie === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.lieItemBtn, isSel && styles.lieItemBtnSelected]}
                  onPress={() => setSelectedLie(opt.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={16}
                    color={isSel ? Colors.white : Colors.primaryBlack}
                  />
                  <Typo style={[styles.lieItemText, isSel && styles.lieItemTextSelected]}>
                    {opt.label}
                  </Typo>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Smart Recommendation Banner */}
          <TouchableOpacity style={styles.smartRecBanner} activeOpacity={0.9}>
            <Ionicons name="sparkles" size={18} color={Colors.blue} />
            <View style={{ flex: 1 }}>
              <Typo variant="bodyMedium" style={styles.smartRecTitle}>Smart recommendation</Typo>
              <Typo variant="caption" style={styles.smartRecSub}>
                <Typo style={{ color: Colors.blue, fontWeight: 'bold' }}>Explorer</Typo> • Stable Fairway Driver
              </Typo>
            </View>
            <View style={styles.discMiniCircle}>
              <Typo style={styles.discMiniText}>EXPLORER</Typo>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
          </TouchableOpacity>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmBtn}
            activeOpacity={0.88}
            onPress={() => {
              recordScore(holeIndex + 1, 3);
              nextHole();
              router.push('/round/scorecard');
            }}
          >
            <Typo style={styles.confirmBtnText}>Confirm</Typo>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const TelemetryPill: React.FC<{ icon: string; val: string; sub: string }> = ({
  icon,
  val,
  sub,
}) => (
  <View style={styles.telemetryCard}>
    <Ionicons name={icon as any} size={18} color={Colors.primaryBlack} />
    <Typo style={styles.telemetryVal}>{val}</Typo>
    <Typo style={styles.telemetrySub}>{sub}</Typo>
  </View>
);

const RightBlueBtn: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <TouchableOpacity style={styles.blueCircleAction}>
    <Ionicons name={icon as any} size={18} color={Colors.white} />
    <Typo style={styles.blueActionLabel}>{label}</Typo>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  mapBg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.85 },
  safeContent: { flex: 1, justifyContent: 'space-between' },

  // Trajectory Overlay
  trajectoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basketMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    top: -60,
  },
  blueTrajectoryLine: {
    width: 3,
    height: 180,
    backgroundColor: Colors.blue,
  },
  distPillOnLine: {
    position: 'absolute',
    backgroundColor: Colors.blue,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    top: '48%',
  },
  distPillText: { color: Colors.white, fontSize: 11, fontFamily: Typography.fontFamily.bold },
  teeMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.blue,
    borderWidth: 2,
    borderColor: Colors.white,
    bottom: -60,
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  headerCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  headerTitleBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.xl,
  },
  courseTitleText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },
  holeDetailsText: { color: Colors.secondaryText, fontSize: Typography.size.xs },

  // Controls Overlay
  mapOverlayControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    flex: 1,
  },
  leftTelemetryStack: { gap: 8 },
  telemetryCard: {
    width: 68,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
    ...Shadows.sm,
  },
  telemetryVal: { fontFamily: Typography.fontFamily.bold, fontSize: 12 },
  telemetrySub: { fontSize: 7, color: Colors.secondaryText, fontFamily: Typography.fontFamily.bold },

  rightActionStack: { gap: 12 },
  blueCircleAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    ...Shadows.md,
  },
  blueActionLabel: { fontSize: 7, color: Colors.white, fontFamily: Typography.fontFamily.bold },

  // Bottom Sheet Drawer
  bottomDrawer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  drawerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.gray300, alignSelf: 'center' },
  drawerTitle: { fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.bold },

  // Lie Grid
  lieGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  lieItemBtn: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lieItemBtnSelected: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  lieItemText: { fontSize: 11, fontFamily: Typography.fontFamily.medium, color: Colors.primaryBlack },
  lieItemTextSelected: { color: Colors.white },

  // Smart Rec Banner
  smartRecBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  smartRecTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },
  smartRecSub: { color: Colors.secondaryText, fontSize: Typography.size.xs },
  discMiniCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discMiniText: { color: Colors.white, fontSize: 6, fontWeight: 'bold' },

  confirmBtn: {
    backgroundColor: Colors.blue,
    borderRadius: BorderRadius.xl,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  confirmBtnText: { color: Colors.white, fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.base },
});
