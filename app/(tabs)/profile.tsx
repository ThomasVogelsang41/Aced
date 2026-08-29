import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Divider } from '../../components/ui/Divider';
import { Colors, Spacing, Layout, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useRoundHistory } from '../../hooks/useRound';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { data: rounds } = useRoundHistory(user?.id ?? null);

  const displayName = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Golfer';
  const totalRounds = rounds?.length ?? 0;

  const avgVsPar =
    rounds && rounds.length > 0
      ? (
          rounds.reduce((acc: number, r: Record<string, unknown>) => {
            const score = Number(r.total_score ?? 0);
            const par = Number(r.total_par ?? 0);
            return acc + (par > 0 ? score - par : 0);
          }, 0) / rounds.length
        ).toFixed(1)
      : null;

  const aces = rounds?.filter(
    (r: Record<string, unknown>) =>
      Array.isArray(r.scores) &&
      r.scores.some((s: Record<string, unknown>) => Number(s.strokes) === 1)
  ).length ?? 0;

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Typo style={styles.avatarInitial}>
              {displayName[0]?.toUpperCase() ?? 'A'}
            </Typo>
          </View>
          <Typo variant="h2">{displayName}</Typo>
          <Typo variant="small" style={styles.email}>{user?.email}</Typo>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatItem label="Rounds" value={String(totalRounds)} />
          <StatItem
            label="Avg vs Par"
            value={avgVsPar !== null ? `${Number(avgVsPar) > 0 ? '+' : ''}${avgVsPar}` : '—'}
          />
          <StatItem label="Aces" value={String(aces)} />
        </View>

        {/* Round history */}
        <View style={styles.section}>
          <Typo variant="label" style={styles.sectionLabel}>Round History</Typo>
          {!rounds || rounds.length === 0 ? (
            <Card>
              <Typo variant="small" style={styles.emptyText}>
                No rounds yet. Go play!
              </Typo>
            </Card>
          ) : (
            rounds.slice(0, 10).map((round: Record<string, unknown>) => {
              const score = Number(round.total_score ?? 0);
              const par = Number(round.total_par ?? 0);
              const diff = score - par;
              return (
                <View key={round.id as string} style={styles.roundRow}>
                  <View style={styles.roundLeft}>
                    <Typo variant="bodyMedium" numberOfLines={1}>
                      {round.course_name as string}
                    </Typo>
                    <Typo variant="small">
                      {new Date(round.started_at as string).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Typo>
                  </View>
                  <Typo
                    variant="bodyMedium"
                    style={[
                      styles.roundScore,
                      diff < 0 && { color: Colors.green },
                      diff > 0 && { color: diff >= 5 ? Colors.red : Colors.orange },
                    ]}
                  >
                    {round.total_score !== null
                      ? `${diff >= 0 ? '+' : ''}${diff}`
                      : '—'}
                  </Typo>
                </View>
              );
            })
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Typo variant="label" style={styles.sectionLabel}>Settings</Typo>
          <Card>
            <SettingRow label="Distance Units" value="ft" onPress={() => {}} />
            <Divider marginVertical={12} />
            <SettingRow label="Skill Level" value="Beginner" onPress={() => {}} />
            <Divider marginVertical={12} />
            <SettingRow label="Throwing Style" value="RHBH" onPress={() => {}} />
          </Card>
        </View>

        {/* Sign out */}
        <Button
          label="Sign Out"
          variant="ghost"
          size="md"
          onPress={handleSignOut}
          style={styles.signOutBtn}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.statItem}>
    <Typo variant="h3">{value}</Typo>
    <Typo variant="caption">{label}</Typo>
  </View>
);

const SettingRow: React.FC<{ label: string; value: string; onPress: () => void }> = ({
  label,
  value,
  onPress,
}) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress}>
    <Typo variant="body">{label}</Typo>
    <View style={styles.settingRight}>
      <Typo variant="small" style={styles.settingValue}>{value}</Typo>
      <Ionicons name="chevron-forward" size={16} color={Colors.gray300} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Layout.screenPaddingH, paddingTop: Spacing.base },
  avatarSection: { alignItems: 'center', marginBottom: Spacing['2xl'], gap: Spacing.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryBlack,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarInitial: {
    fontSize: 36,
    color: Colors.white,
    fontFamily: 'Inter_700Bold',
    lineHeight: 42,
  },
  email: { color: Colors.secondaryText },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    alignItems: 'center',
    gap: 2,
  },
  section: { marginBottom: Spacing.xl },
  sectionLabel: { marginBottom: Spacing.md },
  emptyText: { color: Colors.secondaryText, textAlign: 'center' },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  roundLeft: { flex: 1, paddingRight: Spacing.base, gap: 2 },
  roundScore: { fontFamily: 'Inter_700Bold', color: Colors.primaryBlack },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  settingValue: { color: Colors.secondaryText },
  signOutBtn: { marginTop: Spacing.sm },
});
