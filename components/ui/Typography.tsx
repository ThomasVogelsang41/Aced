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
    letterSpacing: -0.8,
    color: Colors.primaryBlack,
    lineHeight: 44,
  },
  h1: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size['4xl'],
    letterSpacing: -0.5,
    color: Colors.primaryBlack,
    lineHeight: 36,
  },
  h2: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size['2xl'],
    letterSpacing: -0.3,
    color: Colors.primaryBlack,
    lineHeight: 28,
  },
  h3: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    letterSpacing: -0.2,
    color: Colors.primaryBlack,
    lineHeight: 24,
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
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    color: Colors.primaryBlack,
    lineHeight: 22,
  },
  small: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.secondaryText,
    lineHeight: 18,
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
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
