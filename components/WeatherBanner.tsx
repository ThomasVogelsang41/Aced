import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from './ui/Typography';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { degreesToCardinal, windEmoji } from '../lib/openmeteo';
import type { Weather } from '../types/weather';

interface WeatherBannerProps {
  weather: Weather;
  compact?: boolean;
}

export const WeatherBanner: React.FC<WeatherBannerProps> = ({ weather, compact = false }) => {
  const cardinal = degreesToCardinal(weather.windDirection);
  const emoji = windEmoji(weather.windSpeed);

  if (compact) {
    return (
      <View style={styles.compact}>
        <Ionicons name="thermometer-outline" size={14} color={Colors.secondaryText} />
        <Typo variant="small">{weather.temperature}°F</Typo>
        <Typo variant="small" style={styles.separator}>·</Typo>
        <Typo variant="small">{emoji} {weather.windSpeed} mph {cardinal}</Typo>
      </View>
    );
  }

  return (
    <View style={styles.banner}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Ionicons name="thermometer-outline" size={18} color={Colors.secondaryText} />
          <View>
            <Typo variant="caption">Temperature</Typo>
            <Typo variant="bodyMedium">{weather.temperature}°F</Typo>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.item}>
          <Ionicons name="navigate-outline" size={18} color={Colors.secondaryText} />
          <View>
            <Typo variant="caption">Wind</Typo>
            <Typo variant="bodyMedium">
              {weather.windSpeed} mph {cardinal}
            </Typo>
          </View>
        </View>
        {weather.windGust && (
          <>
            <View style={styles.divider} />
            <View style={styles.item}>
              <Ionicons name="flash-outline" size={18} color={Colors.secondaryText} />
              <View>
                <Typo variant="caption">Gusts</Typo>
                <Typo variant="bodyMedium">{weather.windGust} mph</Typo>
              </View>
            </View>
          </>
        )}
      </View>
      <Typo variant="small" style={styles.condition}>{weather.description}</Typo>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  condition: {
    color: Colors.secondaryText,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  separator: {
    color: Colors.gray300,
    marginHorizontal: 2,
  },
});
