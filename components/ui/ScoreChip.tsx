import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typo } from './Typography';
import { Colors, BorderRadius, Typography } from '../../constants/theme';
import type { ScoreRelativeToPar } from '../../types/round';

interface ScoreChipProps {
  strokes: number;
  par: number;
  relative?: ScoreRelativeToPar;
  size?: 'sm' | 'md' | 'lg';
}

const COLORS: Record<ScoreRelativeToPar, { bg: string; text: string; border: string }> = {
  ace:     { bg: '#09090A',         text: '#FFFFFF',       border: '#09090A' },
  eagle:   { bg: Colors.greenLight, text: Colors.green,    border: Colors.green },
  birdie:  { bg: Colors.greenLight, text: Colors.green,    border: Colors.green },
  par:     { bg: '#FFFFFF',         text: Colors.primaryBlack, border: Colors.border },
  bogey:   { bg: Colors.orangeLight, text: Colors.orange,  border: Colors.orange },
  double:  { bg: Colors.redLight,   text: Colors.red,      border: Colors.red },
  triple:  { bg: Colors.redLight,   text: Colors.red,      border: Colors.red },
  unknown: { bg: Colors.gray100,    text: Colors.secondaryText, border: Colors.border },
};

function getRelative(strokes: number, par: number): ScoreRelativeToPar {
  if (strokes === 0) return 'unknown';
  if (strokes === 1) return 'ace';
  const diff = strokes - par;
  if (diff <= -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  if (diff === 2) return 'double';
  return 'triple';
}

function formatScore(strokes: number, par: number): string {
  if (strokes === 0) return '-';
  const diff = strokes - par;
  if (diff === 0) return String(strokes);
  return diff > 0 ? `+${diff}` : String(diff);
}

export const ScoreChip: React.FC<ScoreChipProps> = ({
  strokes,
  par,
  relative,
  size = 'md',
}) => {
  const rel = relative ?? getRelative(strokes, par);
  const { bg, text, border } = COLORS[rel];
  const dim = size === 'sm' ? 28 : size === 'md' ? 36 : 44;
  const fontSize = size === 'sm' ? Typography.size.sm : size === 'md' ? Typography.size.base : Typography.size.lg;

  return (
    <View
      style={[
        styles.chip,
        { width: dim, height: dim, backgroundColor: bg, borderColor: border },
        rel === 'ace' && styles.aceChip,
      ]}
    >
      <Typo style={[styles.text, { color: text, fontSize }]}>
        {strokes === 0 ? '—' : formatScore(strokes, par)}
      </Typo>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aceChip: {
    borderWidth: 2,
  },
  text: {
    fontFamily: Typography.fontFamily.bold,
  },
});
