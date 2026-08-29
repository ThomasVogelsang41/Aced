import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from './ui/Typography';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import type { DiscRecommendation } from '../types/disc';

interface CaddieRecommendationProps {
  recommendations: DiscRecommendation[];
  distanceFt: number;
  isLoading?: boolean;
}

const CONFIDENCE_LABEL: Record<DiscRecommendation['confidence'], string> = {
  primary: '1st Choice',
  secondary: '2nd Choice',
  alternative: 'Alternative',
};

const CONFIDENCE_COLOR: Record<DiscRecommendation['confidence'], string> = {
  primary: Colors.blue,
  secondary: Colors.primaryBlack,
  alternative: Colors.secondaryText,
};

export const CaddieRecommendation: React.FC<CaddieRecommendationProps> = ({
  recommendations,
  distanceFt,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="bulb-outline" size={16} color={Colors.blue} />
          <Typo variant="label">Smart Caddie</Typo>
        </View>
        <Typo variant="small">Calculating recommendations...</Typo>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="bulb-outline" size={16} color={Colors.blue} />
          <Typo variant="label">Smart Caddie</Typo>
        </View>
        <Typo variant="small" style={styles.emptyText}>
          Add discs to your bag to get recommendations.
        </Typo>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bulb-outline" size={16} color={Colors.blue} />
        <Typo variant="label">Smart Caddie</Typo>
        <Typo variant="caption" style={styles.distance}>{distanceFt} ft</Typo>
      </View>
      {recommendations.map((rec, idx) => (
        <View key={`${rec.disc.bagDiscId}-${idx}`} style={styles.recRow}>
          <View style={styles.recLeft}>
            <Typo
              variant="caption"
              style={[styles.choiceLabel, { color: CONFIDENCE_COLOR[rec.confidence] }]}
            >
              {CONFIDENCE_LABEL[rec.confidence]}
            </Typo>
            <Typo variant="bodyMedium" style={styles.discName} numberOfLines={1}>
              {rec.disc.nickname ?? rec.disc.name}
            </Typo>
            <Typo variant="small" style={styles.reason} numberOfLines={2}>
              {rec.reason}
            </Typo>
          </View>
          <View style={styles.flightNumbers}>
            <FlightPill label="S" value={rec.disc.speed} />
            <FlightPill label="T" value={rec.disc.turn} />
            <FlightPill label="F" value={rec.disc.fade} />
          </View>
        </View>
      ))}
    </View>
  );
};

const FlightPill: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.pill}>
    <Typo style={styles.pillLabel}>{label}</Typo>
    <Typo style={styles.pillValue}>{value}</Typo>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  distance: {
    marginLeft: 'auto',
    color: Colors.secondaryText,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  recLeft: {
    flex: 1,
    gap: 2,
  },
  choiceLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  discName: {
    color: Colors.primaryBlack,
  },
  reason: {
    color: Colors.secondaryText,
  },
  flightNumbers: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minWidth: 30,
  },
  pillLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 9,
    color: Colors.secondaryText,
    textTransform: 'uppercase',
  },
  pillValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.sm,
    color: Colors.primaryBlack,
  },
  emptyText: {
    color: Colors.secondaryText,
  },
});
