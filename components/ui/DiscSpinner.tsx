import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from './Typography';
import { Colors, Spacing, Typography } from '../../constants/theme';

interface DiscSpinnerProps {
  size?: number;
  label?: string;
  color?: string;
}

export const DiscSpinner: React.FC<DiscSpinnerProps> = ({
  size = 40,
  label = 'Loading...',
  color = Colors.primaryBlack,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // 360 degree spin loop
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulse pulse shadow loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.discWrapper}>
        <Animated.View
          style={[
            styles.shadowDot,
            {
              width: size * 0.7,
              height: 6,
              transform: [{ scaleX: pulseAnim }],
            },
          ]}
        />
        <Animated.View
          style={{
            transform: [{ rotate: spin }],
          }}
        >
          <Ionicons name="disc" size={size} color={color} />
        </Animated.View>
      </View>
      {label ? (
        <Typo variant="caption" style={styles.labelText}>
          {label}
        </Typo>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  discWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shadowDot: {
    position: 'absolute',
    bottom: -8,
    borderRadius: 3,
    backgroundColor: 'rgba(9, 9, 10, 0.15)',
  },
  labelText: {
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    letterSpacing: 0.5,
  },
});
