import type { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLogin } from '@/lib/hooks/use-auth';

export function SignInScreen() {
  const router = useRouter();
  const login = useLogin();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [emailFocused, setEmailFocused] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);

  const axiosError = login.error as AxiosError<{ message: string }> | null;
  const errorMessage =
    axiosError?.response?.data?.message ?? axiosError?.message ?? null;

  const handleSubmit = () => {
    if (!email.trim() || !password) return;
    login.mutate(
      { email: email.trim().toLowerCase(), password },
      { onSuccess: () => router.replace('/(app)') },
    );
  };

  const isDisabled = !email.trim() || !password || login.isPending;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to access your saved art.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={[styles.input, emailFocused && styles.inputFocused]}
                placeholder="name@example.com"
                placeholderTextColor="#a8a29e"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={[styles.input, passwordFocused && styles.inputFocused]}
                placeholder="••••••••"
                placeholderTextColor="#a8a29e"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>

            <Pressable style={styles.forgotBtn} hitSlop={8}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>

          {/* API error */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <View style={styles.submitArea}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                isDisabled && styles.primaryBtnDisabled,
                pressed && !isDisabled && styles.primaryBtnPressed,
              ]}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              {login.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={[styles.primaryBtnText, isDisabled && styles.primaryBtnTextDisabled]}>
                  Sign In
                </Text>
              )}
            </Pressable>

            <Text style={styles.switchText}>
              Don't have an account?{' '}
              <Text style={styles.switchLink} onPress={() => router.push('/sign-up')}>
                Sign up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fafaf9',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 20,
    alignSelf: 'flex-start',
    padding: 4,
  },
  backIcon: {
    fontSize: 36,
    color: '#1c1917',
    lineHeight: 40,
  },
  titleBlock: {
    marginBottom: 40,
  },
  title: {
    fontFamily: SERIF,
    fontSize: 32,
    fontWeight: '600',
    color: '#1c1917',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#78716c',
    lineHeight: 22,
  },
  form: {
    gap: 4,
    marginBottom: 8,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#57534e',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 16,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1c1917',
  },
  inputFocused: {
    borderColor: '#a8a29e',
    backgroundColor: '#ffffff',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    color: '#78716c',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    lineHeight: 20,
  },
  submitArea: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  primaryBtn: {
    backgroundColor: '#1c1917',
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBtnPressed: {
    backgroundColor: '#292524',
  },
  primaryBtnDisabled: {
    backgroundColor: '#d6d3d1',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  primaryBtnTextDisabled: {
    color: '#a8a29e',
  },
  switchText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#78716c',
    lineHeight: 22,
  },
  switchLink: {
    fontWeight: '600',
    color: '#1c1917',
  },
});
