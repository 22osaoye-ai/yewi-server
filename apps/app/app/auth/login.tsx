import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSignIn, useSSO, useAuth, useUser } from '@clerk/expo';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppTheme } from '@/hooks/useAppTheme';
import { translateClerkError } from '@/utils/clerkErrorTranslator';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated, needsProfileCompletion } = useAuthStore();
  const { signIn, errors } = useSignIn();
  const { startSSOFlow } = useSSO();
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  const [useEmailForm, setUseEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (needsProfileCompletion) {
        router.replace('/auth/complete-profile');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, needsProfileCompletion, router]);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Campos obligatorios', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (!signIn) {
      showAlert('Error', 'Servicio de autenticación no inicializado aún.');
      return;
    }

    setIsLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        const errorMsg = translateClerkError(
          errors || error,
          'Correo o contraseña incorrectos.'
        );
        showAlert('Error de autenticación', errorMsg);
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return;
            router.replace('/(tabs)');
          },
        });
      }
    } catch (error: any) {
      const errorMsg = translateClerkError(error, 'Credenciales inválidas.');
      showAlert('Error de autenticación', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleButtonPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setIsLoading(true);
    try {
      if (isSignedIn && user) {
        // Ya está iniciada la sesión en Clerk
        if (isAuthenticated) {
          router.replace('/(tabs)');
          return;
        }
      }

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      const rawMsg = (err?.message || '').toLowerCase();
      if (
        rawMsg.includes('already signed') ||
        rawMsg.includes('session_already_exists') ||
        err?.errors?.[0]?.code === 'session_already_exists'
      ) {
        // La sesión ya existe en Clerk
        if (isAuthenticated) {
          router.replace('/(tabs)');
        }
        return;
      }

      console.error('Google SSO Error:', err);
      showAlert('Error Google', translateClerkError(err, 'No se pudo iniciar sesión con Google.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top + 12, 28),
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom + 20, 32) + 40,
          justifyContent: 'space-between',
        }}
      >
        <View>
          {/* Header matching Reference Screenshots */}
          <AuthHeader
            title="Únete a Yewi"
            subtitle="Crea una cuenta y descubre miles de servicios para el hogar, conecta con profesionales y gestiona tus pedidos con garantía."
            onBack={() => router.back()}
            showLogo
            align="left"
          />

          {/* Legal Terms Disclaimer */}
          <Text
            style={{
              fontSize: 12.5,
              fontFamily: 'Satoshi-Regular',
              color: colors.textSecondary,
              marginBottom: 32,
              lineHeight: 20,
            }}
          >
            Al unirte, aceptas los{' '}
            <Text
              style={{
                fontFamily: 'Satoshi-Bold',
                textDecorationLine: 'underline',
                color: colors.textPrimary,
              }}
            >
              Términos de Servicio de Yewi
            </Text>
          </Text>

          {!useEmailForm ? (
            /* FLOW 1: LANDING SOCIAL AUTH CHOICE */
            <View className="mb-6">
              <SocialAuthButtons
                onGooglePress={handleGoogleButtonPress}
                variant="stacked"
              />

              {/* Use Email Instead Link */}
              <ThemedTouchable
                onPress={() => setUseEmailForm(true)}
                haptic="selection"
                style={{ paddingVertical: 12, alignItems: 'center' }}
              >
                <Text
                  style={{
                    fontSize: 14.5,
                    fontFamily: 'Satoshi-Bold',
                    color: colors.textPrimary,
                    textDecorationLine: 'underline',
                  }}
                >
                  Usar correo electrónico en su lugar
                </Text>
              </ThemedTouchable>
            </View>
          ) : (
            /* FLOW 2: EMAIL FORM */
            <View className="mb-6">
              <AuthInput
                label="Correo Electrónico"
                leftIcon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <AuthInput
                label="Contraseña"
                leftIcon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                isPassword
              />

              <ThemedTouchable
                onPress={() =>
                  showAlert('Recuperar Contraseña', 'Se ha enviado una guía a tu correo.')
                }
                haptic="light"
                style={{ alignSelf: 'flex-end', marginBottom: 24, paddingVertical: 4 }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontFamily: 'Satoshi-Bold',
                    color: colors.primary,
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Text>
              </ThemedTouchable>

              <AuthButton
                title="Iniciar Sesión"
                onPress={handleEmailLogin}
                isLoading={isLoading}
                variant="primary"
              />

              <SocialAuthButtons
                onGooglePress={handleGoogleButtonPress}
                variant="side-by-side"
              />
            </View>
          )}
        </View>

        {/* Clean Single Bottom Register Action */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
          }}
        >
          <Text
            style={{
              fontSize: 13.5,
              fontFamily: 'Satoshi-Regular',
              color: colors.textSecondary,
            }}
          >
            ¿No tienes cuenta aún?
          </Text>
          <ThemedTouchable
            onPress={() => router.push('/auth/register')}
            haptic="selection"
          >
            <Text
              style={{
                fontSize: 14.5,
                fontFamily: 'Satoshi-Black',
                color: colors.primary,
              }}
            >
              Registrarse →
            </Text>
          </ThemedTouchable>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttonText="Entendido"
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}
