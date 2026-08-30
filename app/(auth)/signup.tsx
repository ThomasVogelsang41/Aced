import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router, Link } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup() {
    if (!email.trim() || !password || !username.trim()) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });

      setIsLoading(false);
      if (authError) {
        setError(authError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Network error connecting to Supabase.');
    }
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Typo style={styles.checkmark}>✓</Typo>
        </View>
        <Typo variant="h2" style={styles.successTitle}>Check your email</Typo>
        <Typo variant="body" style={styles.successText}>
          We sent a confirmation link to {email}. Open it to activate your account.
        </Typo>
        <Button
          label="Go to Login"
          variant="secondary"
          size="md"
          onPress={() => router.replace('/(auth)/login')}
          style={{ marginTop: Spacing.xl }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Typo style={styles.backArrow}>←</Typo>
          </TouchableOpacity>
          <View style={styles.logoBox}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.brandIconImg}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/logo.png')}
              style={styles.wordmarkImg}
              resizeMode="contain"
            />
          </View>
          <Typo variant="h2">Create account</Typo>
          <Typo variant="small" style={styles.subtitle}>Start tracking your disc golf game</Typo>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Typo variant="small" style={styles.errorText}>{error}</Typo>
          </View>
        )}

        <View style={styles.fields}>
          <View>
            <Typo variant="label" style={styles.fieldLabel}>Username</Typo>
            <TextInput
              style={styles.input}
              placeholder="discgolfpro"
              placeholderTextColor={Colors.gray400}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>
          <View>
            <Typo variant="label" style={styles.fieldLabel}>Email</Typo>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.gray400}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>
          <View>
            <Typo variant="label" style={styles.fieldLabel}>Password</Typo>
            <TextInput
              style={styles.input}
              placeholder="8+ characters"
              placeholderTextColor={Colors.gray400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignup}
            />
          </View>
        </View>

        <Button
          label="Create Account"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          onPress={handleSignup}
          style={styles.cta}
        />

        <View style={styles.footer}>
          <Typo variant="small">Already have an account?</Typo>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Typo variant="small" style={styles.link}>Sign in</Typo>
            </TouchableOpacity>
          </Link>
        </View>

        <Typo variant="caption" style={styles.legal}>
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </Typo>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.white },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: Spacing['2xl'],
  },
  backBtn: {
    marginBottom: Spacing.base,
  },
  backArrow: {
    fontSize: 24,
    color: Colors.primaryBlack,
  },
  logoBox: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  brandIconImg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 8,
  },
  wordmarkImg: {
    width: 140,
    height: 32,
    tintColor: Colors.primaryBlack,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.secondaryText,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: Colors.redLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.red,
  },
  errorText: { color: Colors.red },
  fields: {
    gap: Spacing.base,
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    marginBottom: Spacing.xs,
    color: Colors.secondaryText,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.primaryBlack,
    backgroundColor: Colors.backgroundSoft,
  },
  cta: { marginBottom: Spacing.xl },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  link: {
    color: Colors.blue,
    fontFamily: Typography.fontFamily.semiBold,
  },
  legal: {
    textAlign: 'center',
    color: Colors.gray400,
    lineHeight: 16,
  },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  checkmark: {
    fontSize: 36,
    color: Colors.green,
  },
  successTitle: { marginBottom: Spacing.sm, textAlign: 'center' },
  successText: { color: Colors.secondaryText, textAlign: 'center', lineHeight: 22 },
});
