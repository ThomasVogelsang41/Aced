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
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const { loginAsGuest } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      setIsLoading(false);
      if (authError) {
        setError(authError.message);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Network error connecting to Supabase.');
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
        {/* Official Black Box A Monogram App Icon & Wordmark */}
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

          <Button
            label="Skip Sign In (Explore App)"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => {
              loginAsGuest();
              router.replace('/(tabs)');
            }}
            style={{ marginBottom: Spacing.xl }}
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
  brandIconImg: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: 12,
  },
  wordmarkImg: {
    width: 180,
    height: 40,
    tintColor: Colors.primaryBlack,
    marginBottom: 6,
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
