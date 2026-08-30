import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from './ui/Typography';
import { Colors, Spacing, Typography } from '../constants/theme';

interface TabHeaderProps {
  subtitle?: string;
  title: string;
  showLogo?: boolean;
  showBell?: boolean;
  rightElement?: React.ReactNode;
}

export const TabHeader: React.FC<TabHeaderProps> = ({
  subtitle,
  title,
  showLogo = false,
  showBell = true,
  rightElement,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftCol}>
        {showLogo && (
          <Image
            source={require('../assets/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        )}
        {subtitle && <Typo variant="small" style={styles.subtitle}>{subtitle}</Typo>}
        <Typo variant="display" style={styles.title}>{title}</Typo>
        <View style={styles.blueBar} />
      </View>

      <View style={styles.rightCol}>
        {rightElement}
        {showBell && (
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={24} color={Colors.primaryBlack} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  leftCol: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  brandLogo: {
    width: 180,
    height: 40,
    marginBottom: 8,
    alignSelf: 'flex-start',
    tintColor: Colors.primaryBlack,
  },
  subtitle: {
    color: Colors.secondaryText,
    fontSize: Typography.size.xs,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 28,
    color: Colors.primaryBlack,
    lineHeight: 32,
  },
  blueBar: {
    height: 4,
    width: 28,
    backgroundColor: Colors.blue,
    borderRadius: 2,
    marginTop: 4,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bellBtn: {
    padding: 8,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.blue,
  },
});
