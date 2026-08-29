import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Typo } from './Typography';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  label,
  isLoading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.white : Colors.blue}
        />
      ) : (
        <View style={styles.inner}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Typo
            style={[
              styles.label,
              styles[`label_${variant}`],
              styles[`labelSize_${size}`],
            ]}
          >
            {label}
          </Typo>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  // Variants
  primary: {
    backgroundColor: Colors.blue,
  },
  secondary: {
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.red,
  },
  // Sizes
  size_sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  size_md: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
  },
  size_lg: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: 18,
  },
  // Labels
  label: {
    fontFamily: Typography.fontFamily.semiBold,
  },
  label_primary: {
    color: Colors.white,
  },
  label_secondary: {
    color: Colors.primaryBlack,
  },
  label_ghost: {
    color: Colors.blue,
  },
  label_danger: {
    color: Colors.white,
  },
  labelSize_sm: {
    fontSize: Typography.size.sm,
  },
  labelSize_md: {
    fontSize: Typography.size.base,
  },
  labelSize_lg: {
    fontSize: Typography.size.md,
  },
  // Disabled
  disabled: {
    opacity: 0.45,
  },
});
