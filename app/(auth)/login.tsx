import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, Link } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Typo } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      router.replace('/(tabs)');
    }
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
        {/* Logo mark */}
        <View style={styles.logoBox}>
          <View style={styles.logoInner}>
            <Typo style={styles.logoA}>A</Typo>
          </View>
          <Typo style={styles.wordmark}>ACED</Typo>
          <Typo variant="small" style={styles.tagline}>DISC GOLF. ELEVATED.</Typo>
        </View>

        <View style={styles.form}>
          <Typo variant="h2" style={styles.title}>Welcome back</Typo>
          <Typo variant="small" style={styles.subtitle}>Sign in to your ACED account</Typo>

          {error && (
            <View style={styles.errorBox}>
              <Typo variant="small" style={styles.errorText}>{error}</Typo>
            </View>
          )}

          <View style={styles.fields}>
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
                placeholder="Your password"
                placeholderTextColor={Colors.gray400}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>
          </View>

          <Button
            label="Sign In"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            onPress={handleLogin}
            style={styles.cta}
          />

          <View style={styles.footer}>
            <Typo variant="small">Don't have an account?</Typo>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Typo variant="small" style={styles.link}>Sign up free</Typo>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.white },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoInner: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.primaryBlack,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoA: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 42,
    color: Colors.white,
    lineHeight: 50,
  },
  wordmark: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 28,
    letterSpacing: 6,
    color: Colors.primaryBlack,
    marginBottom: 4,
  },
  tagline: {
    color: Colors.secondaryText,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  form: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.secondaryText,
    marginBottom: Spacing.xl,
  },
  errorBox: {
    backgroundColor: Colors.redLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.red,
  },
  errorText: {
    color: Colors.red,
  },
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
  cta: {
    marginBottom: Spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  link: {
    color: Colors.blue,
    fontFamily: Typography.fontFamily.semiBold,
  },
});
