import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typo } from './ui/Typography';
import { ScoreChip } from './ui/ScoreChip';
import { Colors, Spacing, Typography } from '../constants/theme';
import type { HoleScore } from '../types/round';

interface ScorecardRowProps {
  score: HoleScore;
  isCurrentHole?: boolean;
}

export const ScorecardRow: React.FC<ScorecardRowProps> = ({ score, isCurrentHole }) => {
  const diff = score.strokes > 0 ? score.strokes - score.par : 0;
  const diffLabel = score.strokes === 0 ? '' : diff === 0 ? 'E' : diff > 0 ? `+${diff}` : String(diff);

  return (
    <View style={[styles.row, isCurrentHole && styles.currentRow]}>
      <View style={styles.holeCol}>
        <Typo variant="bodyMedium" style={styles.holeNum}>{score.holeNumber}</Typo>
        {isCurrentHole && <View style={styles.activeDot} />}
      </View>
      <Typo variant="small" style={styles.parCol}>{score.par}</Typo>
      <View style={styles.scoreCol}>
        {score.strokes > 0 ? (
          <ScoreChip strokes={score.strokes} par={score.par} size="sm" />
        ) : (
          <Typo variant="small" style={styles.dash}>—</Typo>
        )}
      </View>
      <View style={styles.diffCol}>
        <Typo
          variant="small"
          style={[
            styles.diff,
            diff < 0 && styles.diffNeg,
            diff > 0 && styles.diffPos,
          ]}
        >
          {diffLabel}
        </Typo>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  currentRow: {
    backgroundColor: Colors.blueLight,
  },
  holeCol: {
    width: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  holeNum: {
    color: Colors.primaryBlack,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.blue,
  },
  parCol: {
    width: 32,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  scoreCol: {
    flex: 1,
    alignItems: 'center',
  },
  diffCol: {
    width: 40,
    alignItems: 'flex-end',
  },
  diff: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.secondaryText,
  },
  diffNeg: {
    color: Colors.green,
  },
  diffPos: {
    color: Colors.orange,
  },
  dash: {
    color: Colors.gray300,
  },
});
