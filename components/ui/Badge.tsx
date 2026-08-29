import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typo } from './Typography';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/theme';

type BadgeVariant = 'blue' | 'green' | 'orange' | 'red' | 'gray';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  blue:   { bg: Colors.blueLight,   text: Colors.blue },
  green:  { bg: Colors.greenLight,  text: Colors.green },
  orange: { bg: Colors.orangeLight, text: Colors.orange },
  red:    { bg: Colors.redLight,    text: Colors.red },
  gray:   { bg: Colors.gray100,     text: Colors.secondaryText },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'gray' }) => {
  const { bg, text } = VARIANT_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Typo style={[styles.text, { color: text }]}>{label}</Typo>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.xs,
    letterSpacing: 0.3,
  },
});
