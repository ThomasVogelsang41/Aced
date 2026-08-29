import React from 'react';
import { View, ViewProps, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface CardProps extends ViewProps {
  padding?: number;
  pressable?: false;
}

interface PressableCardProps extends TouchableOpacityProps {
  padding?: number;
  pressable: true;
}

export const Card: React.FC<CardProps | PressableCardProps> = ({
  padding = Spacing.base,
  style,
  children,
  ...props
}) => {
  const cardStyle = [
    styles.card,
    { padding },
    style,
  ];

  if ((props as PressableCardProps).pressable) {
    const { pressable, ...rest } = props as PressableCardProps;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={cardStyle}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...(props as ViewProps)}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
});
