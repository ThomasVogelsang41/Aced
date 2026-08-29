import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from './ui/Typography';
import { Badge } from './ui/Badge';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import type { BagDisc } from '../types/disc';

interface DiscCardProps {
  disc: BagDisc;
  onPress?: () => void;
  onRemove?: () => void;
  showFlightNumbers?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  distance_driver: 'Distance Driver',
  fairway_driver: 'Fairway Driver',
  midrange: 'Mid-Range',
  putter: 'Putter',
};

const CATEGORY_VARIANTS: Record<string, 'blue' | 'green' | 'orange' | 'gray'> = {
  distance_driver: 'blue',
  fairway_driver: 'green',
  midrange: 'orange',
  putter: 'gray',
};

export const DiscCard: React.FC<DiscCardProps> = ({
  disc,
  onPress,
  onRemove,
  showFlightNumbers = true,
}) => {
  const displayName = disc.nickname ?? disc.name;
  const catLabel = CATEGORY_LABELS[disc.category] ?? disc.category;
  const catVariant = CATEGORY_VARIANTS[disc.category] ?? 'gray';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Color dot */}
      <View
        style={[
          styles.colorDot,
          { backgroundColor: disc.color ?? Colors.gray300 },
        ]}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Typo variant="bodyMedium" style={styles.name} numberOfLines={1}>
            {displayName}
          </Typo>
          {onRemove && (
            <Pressable onPress={onRemove} hitSlop={12} style={styles.removeBtn}>
              <Ionicons name="close" size={16} color={Colors.secondaryText} />
            </Pressable>
          )}
        </View>
        <Typo variant="small">{disc.brand}</Typo>
        <View style={styles.badges}>
          <Badge label={catLabel} variant={catVariant} />
          {disc.plastic && <Badge label={disc.plastic} variant="gray" />}
          {disc.isWorn && <Badge label="Worn" variant="orange" />}
        </View>
        {showFlightNumbers && (
          <View style={styles.flightRow}>
            <FlightNum label="Spd" value={disc.speed} />
            <FlightNum label="Gli" value={disc.glide} />
            <FlightNum label="Tur" value={disc.turn} />
            <FlightNum label="Fad" value={disc.fade} />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const FlightNum: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.flightNum}>
    <Typo variant="caption" style={styles.flightLabel}>{label}</Typo>
    <Typo variant="bodyMedium" style={styles.flightValue}>{value}</Typo>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
  },
  pressed: {
    backgroundColor: Colors.backgroundSoft,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    color: Colors.primaryBlack,
  },
  removeBtn: {
    padding: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  flightRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  flightNum: {
    alignItems: 'center',
  },
  flightLabel: {
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  flightValue: {
    color: Colors.primaryBlack,
  },
});
