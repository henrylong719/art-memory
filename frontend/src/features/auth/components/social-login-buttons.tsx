/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useCallback, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text, View } from '@/components/ui';
import { useSocialLogin } from '@/lib/hooks/use-auth';

WebBrowser.maybeCompleteAuthSession();

// ─── OAuth Config ────────────────────────────────────────
// Replace these with your actual client IDs from Google & Facebook developer consoles.
// For Expo Go, use the Expo proxy: useProxy: true (dev only).
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '';

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// ─── Icons ───────────────────────────────────────────────
function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function FacebookIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        fill="#1877F2"
      />
    </Svg>
  );
}

// ─── Component ───────────────────────────────────────────
export function SocialLoginButtons() {
  const router = useRouter();
  const socialLogin = useSocialLogin();
  const redirectUri = AuthSession.makeRedirectUri();

  // Google OAuth
  const [googleRequest, googleResponse, googlePromptAsync] =
    AuthSession.useAuthRequest(
      {
        clientId: GOOGLE_CLIENT_ID,
        redirectUri,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Token,
      },
      GOOGLE_DISCOVERY,
    );

  // Facebook OAuth
  const [fbRequest, fbResponse, fbPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: FACEBOOK_APP_ID,
      redirectUri,
      scopes: ['public_profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      extraParams: {
        display: 'popup',
      },
    },
    {
      authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenEndpoint: 'https://graph.facebook.com/v19.0/oauth/access_token',
    },
  );

  const handleSocialResponse = useCallback(
    (
      provider: 'google' | 'facebook',
      response: AuthSession.AuthSessionResult | null,
    ) => {
      if (response?.type === 'success') {
        const token = response.params.access_token;
        if (token) {
          socialLogin.mutate(
            { provider, token },
            { onSuccess: () => router.replace('/(app)') },
          );
        }
      }
    },
    [socialLogin, router],
  );

  useEffect(() => {
    handleSocialResponse('google', googleResponse);
  }, [googleResponse, handleSocialResponse]);

  useEffect(() => {
    handleSocialResponse('facebook', fbResponse);
  }, [fbResponse, handleSocialResponse]);

  const isPending = socialLogin.isPending;

  return (
    <View>
      {/* Divider */}
      <View className="flex-row items-center mb-6" style={{ gap: 16 }}>
        <View className="flex-1 h-px bg-stone-200" />
        <Text className="text-[12px] font-semibold text-stone-400 uppercase tracking-wider">
          Or continue with
        </Text>
        <View className="flex-1 h-px bg-stone-200" />
      </View>

      {/* Social buttons */}
      <View style={{ gap: 12 }} className="mb-8">
        <Pressable
          onPress={() => googlePromptAsync()}
          disabled={!googleRequest || isPending}
          style={{
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#e7e5e4',
            borderRadius: 9999,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending && socialLogin.variables?.provider === 'google' ? (
            <ActivityIndicator size="small" color="#1c1917" />
          ) : (
            <>
              <GoogleIcon />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: '#44403c',
                }}
              >
                Google
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => fbPromptAsync()}
          disabled={!fbRequest || isPending}
          style={{
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#e7e5e4',
            borderRadius: 9999,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending && socialLogin.variables?.provider === 'facebook' ? (
            <ActivityIndicator size="small" color="#1c1917" />
          ) : (
            <>
              <FacebookIcon />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: '#44403c',
                }}
              >
                Facebook
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Error */}
      {socialLogin.error ? (
        <View className="bg-red-50 rounded-xl p-3.5 mb-4 border border-red-200">
          <Text className="text-red-600 text-[13px] leading-5">
            {(socialLogin.error as Error).message ??
              'Social login failed. Please try again.'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
