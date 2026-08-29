import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { ScoreChip } from '../../components/ui/ScoreChip';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useRoundStore } from '../../store/roundStore';

// This screen is pushed after finishRound() — but finishRound() clears activeRound.
// We pass the finished round data through router state or persist it temporarily.
// For V1 we read from the profile's recent rounds instead.

export default function ScorecardScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Typo variant="h2">Round Complete</Typo>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="close" size={24} color={Colors.primaryBlack} />
        </TouchableOpacity>
      </View>

      <View style={styles.successBadge}>
        <View style={styles.aceCircle}>
          <Typo style={styles.aceEmoji}>🥏</Typo>
        </View>
        <Typo variant="h2" style={styles.congrats}>Nice round!</Typo>
        <Typo variant="small" style={styles.subtext}>
          Your scorecard has been saved.
        </Typo>
      </View>

      <View style={styles.actions}>
        <Button
          label="View History"
          variant="secondary"
          size="md"
          fullWidth
          onPress={() => router.replace('/(tabs)/profile')}
        />
        <Button
          label="Play Again"
          variant="primary"
          size="md"
          fullWidth
          onPress={() => router.replace('/(tabs)/play')}
          icon={<Ionicons name="play" size={16} color={Colors.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  successBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  aceCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  aceEmoji: { fontSize: 48 },
  congrats: { textAlign: 'center' },
  subtext: { color: Colors.secondaryText, textAlign: 'center' },
  actions: {
    padding: Spacing['2xl'],
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
