import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

interface TypographyProps extends TextProps {
  variant?:
    | 'display'    // 40px 800
    | 'h1'         // 32px 700
    | 'h2'         // 24px 700
    | 'h3'         // 20px 700
    | 'h4'         // 18px 600
    | 'body'       // 15px 400
    | 'bodyMedium' // 15px 500
    | 'small'      // 13px 400
    | 'caption'    // 11px 400
    | 'label';     // 13px 600 uppercase tracking
  color?: string;
}

export const Typo: React.FC<TypographyProps> = ({
  variant = 'body',
  color,
  style,
  children,
  ...props
}) => {
  return (
    <Text style={[styles[variant], color ? { color } : undefined, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  display: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.size['5xl'],
    letterSpacing: Typography.letterSpacing.tight,
    color: Colors.primaryBlack,
    lineHeight: Typography.size['5xl'] * Typography.lineHeight.tight,
  },
  h1: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size['4xl'],
    letterSpacing: Typography.letterSpacing.tight,
    color: Colors.primaryBlack,
    lineHeight: Typography.size['4xl'] * Typography.lineHeight.snug,
  },
  h2: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size['2xl'],
    letterSpacing: Typography.letterSpacing.tight,
    color: Colors.primaryBlack,
    lineHeight: Typography.size['2xl'] * Typography.lineHeight.snug,
  },
  h3: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    letterSpacing: Typography.letterSpacing.tight,
    color: Colors.primaryBlack,
    lineHeight: Typography.size.xl * Typography.lineHeight.snug,
  },
  h4: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.lg,
    color: Colors.primaryBlack,
  },
  body: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.primaryBlack,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
  },
  bodyMedium: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    color: Colors.primaryBlack,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
  },
  small: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.secondaryText,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
  },
  caption: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.secondaryText,
  },
  label: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.sm,
    color: Colors.secondaryText,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase',
  },
});
