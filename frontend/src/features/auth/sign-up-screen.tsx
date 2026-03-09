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

import { useRegister } from '@/lib/hooks/use-auth';

export function SignUpScreen() {
  const router = useRouter();
  const register = useRegister();

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [focused, setFocused] = React.useState<string | null>(null);

  const axiosError = register.error as AxiosError<{ message: string }> | null;
  const errorMessage =
    axiosError?.response?.data?.message ?? axiosError?.message ?? null;

  const handleSubmit = () => {
    if (!email.trim() || !password) return;
    register.mutate(
      {
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      },
      { onSuccess: () => router.replace('/(app)') },
    );
  };

  const isDisabled = !email.trim() || !password || register.isPending;

  const inputStyle = (name: string) => [
    styles.input,
    focused === name && styles.inputFocused,
  ];

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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join to start saving and discovering art.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* First + Last name row */}
            <View style={styles.nameRow}>
              <View style={[styles.field, styles.nameField]}>
                <Text style={styles.label}>FIRST NAME</Text>
                <TextInput
                  style={inputStyle('firstName')}
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => setFocused('firstName')}
                  onBlur={() => setFocused(null)}
                  autoCapitalize="words"
                  returnKeyType="next"
                  placeholderTextColor="#a8a29e"
                />
              </View>
              <View style={[styles.field, styles.nameField]}>
                <Text style={styles.label}>LAST NAME</Text>
                <TextInput
                  style={inputStyle('lastName')}
                  value={lastName}
                  onChangeText={setLastName}
                  onFocus={() => setFocused('lastName')}
                  onBlur={() => setFocused(null)}
                  autoCapitalize="words"
                  returnKeyType="next"
                  placeholderTextColor="#a8a29e"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={inputStyle('email')}
                placeholder="name@example.com"
                placeholderTextColor="#a8a29e"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={inputStyle('password')}
                placeholder="••••••••"
                placeholderTextColor="#a8a29e"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <Text style={styles.passwordHint}>Minimum 6 characters</Text>
            </View>
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
              {register.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={[styles.primaryBtnText, isDisabled && styles.primaryBtnTextDisabled]}>
                  Create Account
                </Text>
              )}
            </Pressable>

            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchLink} onPress={() => router.push('/login')}>
                Sign in
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
    marginBottom: 36,
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
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  nameField: {
    flex: 1,
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
  },
  passwordHint: {
    fontSize: 11,
    color: '#a8a29e',
    marginTop: 6,
    marginLeft: 4,
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
    paddingTop: 16,
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
