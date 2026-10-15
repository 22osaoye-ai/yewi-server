import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, BackHandler, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSignIn, useSSO, useAuth, useUser } from '@clerk/expo';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { useAuthStore, UserProfile } from '@/store/useAuthStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useAppTheme } from '@/hooks/useAppTheme';
import { translateClerkError } from '@/utils/clerkErrorTranslator';
import { biometricService } from '@/services/biometricService';

WebBrowser.maybeCompleteAuthSession();

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
  const [loadingAction, setLoadingAction] = useState<'google' | 'email' | 'biometric' | null>(null);
  const isLoading = loadingAction !== null;
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const [biometricInfo, setBiometricInfo] = useState<{
    label: string;
    icon: 'finger-print-outline' | 'scan-outline' | 'eye-outline';
    isAvailable: boolean;
  }>({
    label: 'Huella digital',
    icon: 'finger-print-outline',
    isAvailable: false,
  });

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  useEffect(() => {
    (async () => {
      const hasHardware = await biometricService.isHardwareSupported();
      const isEnrolled = await biometricService.isEnrolled();
      const { label, icon } = await biometricService.getBiometricType();
      setBiometricInfo({
        label,
        icon,
        isAvailable: hasHardware && isEnrolled,
      });
    })();
  }, []);

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
    } else if (isSignedIn) {
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress ||
        'usuario@yewi.app';
      const fallbackUser: UserProfile = {
        id: user?.id || 'clerk-user',
        email,
        firstName: user?.firstName || (email.includes('@') ? email.split('@')[0] : 'Usuario'),
        lastName: user?.lastName || '',
        roles: ['CLIENT'],
        avatarUrl: user?.imageUrl,
      };
      useAuthStore.getState().setAuth(fallbackUser).then(() => {
        router.replace('/(tabs)');
      });
    }
  }, [isAuthenticated, isSignedIn, user, needsProfileCompletion, router]);

  useEffect(() => {
    const onBackPress = () => {
      if (useEmailForm) {
        setUseEmailForm(false);
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [useEmailForm, router]);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Campos obligatorios', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (!signIn) {
      showAlert('Error', 'Servicio de autenticación no inicializado aún.');
      return;
    }

    setLoadingAction('email');
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        setLoadingAction(null);
        const errorMsg = translateClerkError(
          errors || error,
          'Correo o contraseña incorrectos.'
        );
        showAlert('Error de autenticación', errorMsg);
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize();
      } else {
        setLoadingAction(null);
      }
    } catch (error: any) {
      setLoadingAction(null);
      const errorMsg = translateClerkError(error, 'Credenciales inválidas.');
      showAlert('Error de autenticación', errorMsg);
    }
  };

  const handleGoogleButtonPress = async () => {
    if (isLoading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setLoadingAction('google');
    try {
      if (isSignedIn && user) {
        // Ya está iniciada la sesión en Clerk: sincronizar y entrar inmediatamente
        const email =
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress ||
          `${user.id}@clerk.user`;
        const fallbackUser: UserProfile = {
          id: user.id,
          email,
          firstName: user.firstName || 'Usuario',
          lastName: user.lastName || '',
          roles: ['CLIENT'],
          avatarUrl: user.imageUrl,
        };
        await useAuthStore.getState().setAuth(fallbackUser);
        setLoadingAction(null);
        router.replace('/(tabs)');
        return;
      }

      // Descartar de forma segura cualquier sesión anterior huérfana del navegador
      try {
        WebBrowser.dismissAuthSession();
      } catch {}

      // Usar makeRedirectUri: genera exp:// en Expo Go y yewiapp:// en builds standalone
      const redirectUrl = AuthSession.makeRedirectUri({ path: 'sso-callback' });
      const res = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      const sessionId =
        res.createdSessionId ??
        res.signIn?.createdSessionId ??
        res.signUp?.createdSessionId;

      if (sessionId && res.setActive) {
        await res.setActive({ session: sessionId });
        const email =
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress ||
          (res.signIn as any)?.identifier ||
          (res.signUp as any)?.emailAddress ||
          'usuario@yewi.app';
        const fallbackUser: UserProfile = {
          id: user?.id || sessionId,
          email,
          firstName: user?.firstName || (email.includes('@') ? email.split('@')[0] : 'Usuario'),
          lastName: user?.lastName || '',
          roles: ['CLIENT'],
          avatarUrl: user?.imageUrl,
        };
        await useAuthStore.getState().setAuth(fallbackUser);
        setLoadingAction(null);
        router.replace('/(tabs)');
        return;
      } else {
        setLoadingAction(null);
      }
    } catch (err: any) {
      setLoadingAction(null);
      const rawMsg = (err?.message || '').toLowerCase();

      // Si la sesión ya existe en Clerk
      if (
        rawMsg.includes('already signed') ||
        rawMsg.includes('session_already_exists') ||
        err?.errors?.[0]?.code === 'session_already_exists'
      ) {
        if (user) {
          const email =
            user.primaryEmailAddress?.emailAddress ||
            user.emailAddresses?.[0]?.emailAddress ||
            `${user.id}@clerk.user`;
          const fallbackUser: UserProfile = {
            id: user.id,
            email,
            firstName: user.firstName || 'Usuario',
            lastName: user.lastName || '',
            roles: ['CLIENT'],
            avatarUrl: user.imageUrl,
          };
          await useAuthStore.getState().setAuth(fallbackUser);
        }
        router.replace('/(tabs)');
        return;
      }

      // Si expo-web-browser reporta invalid state o redirect handler huérfano de un intento previo
      if (
        rawMsg.includes('invalid state') ||
        rawMsg.includes('redirect handler') ||
        rawMsg.includes('already open')
      ) {
        console.warn('[Google SSO] Sesión de navegador en estado pendiente. Limpiando...');
        try {
          WebBrowser.dismissAuthSession();
        } catch {}

        if (isSignedIn && user) {
          const email =
            user.primaryEmailAddress?.emailAddress ||
            user.emailAddresses?.[0]?.emailAddress ||
            `${user.id}@clerk.user`;
          const fallbackUser: UserProfile = {
            id: user.id,
            email,
            firstName: user.firstName || 'Usuario',
            lastName: user.lastName || '',
            roles: ['CLIENT'],
            avatarUrl: user.imageUrl,
          };
          await useAuthStore.getState().setAuth(fallbackUser);
          router.replace('/(tabs)');
          return;
        }

        showAlert(
          'Sesión en curso',
          'La ventana del navegador anterior se ha reiniciado. Por favor vuelve a pulsar Continuar con Google.'
        );
        return;
      }

      console.error('Google SSO Error:', err);
      showAlert('Error Google', translateClerkError(err, 'No se pudo iniciar sesión con Google.'));
    }
  };

  const handleBiometricLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const { biometricsEnabled } = usePreferencesStore.getState();

    if (!biometricInfo.isAvailable) {
      showAlert(
        'Biometría no disponible',
        'Este dispositivo no cuenta con sensor biométrico o no hay huellas registradas en el sistema.'
      );
      return;
    }

    const hasCredentials = await biometricService.hasSavedCredentials();
    if (!biometricsEnabled || !hasCredentials) {
      showAlert(
        'Acceso biométrico',
        'Inicia sesión con tu correo o Google y activa la huella digital en tus Ajustes para habilitar este acceso rápido.'
      );
      return;
    }

    setLoadingAction('biometric');
    try {
      const result = await biometricService.loginWithBiometrics();
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.replace('/(tabs)');
      } else {
        setLoadingAction(null);
        if (
          result.error &&
          result.error !== 'user_cancel' &&
          result.error !== 'system_cancel' &&
          result.error !== 'app_cancel' &&
          result.error !== 'user_fallback' &&
          result.error !== 'CANCELLED'
        ) {
          showAlert('Acceso fallido', 'No se pudo verificar tu identidad. Por favor intenta de nuevo.');
        }
      }
    } catch {
      setLoadingAction(null);
      showAlert('Error', 'Ocurrió un problema durante la autenticación biométrica.');
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
            onBack={
              useEmailForm
                ? () => setUseEmailForm(false)
                : router.canGoBack()
                ? () => router.back()
                : undefined
            }
            showLogo
            align="left"
          />

          {/* Legal Terms Disclaimer */}
          <Text
            style={{
              fontSize: 12.5,
              fontFamily: 'PlusJakartaSans-Regular',
              color: colors.textSecondary,
              marginBottom: 32,
              lineHeight: 20,
            }}
          >
            Al unirte, aceptas los{' '}
            <Text
              style={{
                fontFamily: 'PlusJakartaSans-Bold',
                textDecorationLine: 'underline',
                color: colors.textPrimary,
              }}
            >
              Términos de Servicio de Yewi
            </Text>
          </Text>

          {/* Feedback Status Pill */}
          {isLoading && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                backgroundColor: isDark ? 'rgba(2, 132, 199, 0.16)' : 'rgba(2, 132, 199, 0.08)',
                borderColor: isDark ? 'rgba(2, 132, 199, 0.35)' : 'rgba(2, 132, 199, 0.22)',
                borderWidth: 1,
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 999,
                marginBottom: 20,
                alignSelf: 'center',
              }}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: 'PlusJakartaSans-Bold',
                  color: colors.primary,
                }}
              >
                {loadingAction === 'google'
                  ? 'Conectando con Google...'
                  : loadingAction === 'biometric'
                  ? `Verificando ${biometricInfo.label.toLowerCase()}...`
                  : 'Iniciando sesión...'}
              </Text>
            </View>
          )}

          {!useEmailForm ? (
            /* FLOW 1: LANDING SOCIAL AUTH CHOICE */
            <View className="mb-6">
              <SocialAuthButtons
                onGooglePress={handleGoogleButtonPress}
                isLoading={loadingAction === 'google'}
                disabled={isLoading}
                variant="stacked"
              />

              {/* Biometrics Button */}
              <ThemedTouchable
                onPress={handleBiometricLogin}
                disabled={isLoading}
                haptic="medium"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  backgroundColor: colors.surfaceAlt,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 999,
                  paddingVertical: 15,
                  marginTop: 10,
                  opacity: isLoading && loadingAction !== 'biometric' ? 0.6 : 1,
                }}
              >
                {loadingAction === 'biometric' ? (
                  <>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text
                      style={{
                        fontSize: 14.5,
                        fontFamily: 'PlusJakartaSans-Bold',
                        color: colors.primary,
                      }}
                    >
                      Verificando {biometricInfo.label}...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name={biometricInfo.icon}
                      size={20}
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        fontSize: 14.5,
                        fontFamily: 'PlusJakartaSans-Bold',
                        color: colors.textPrimary,
                      }}
                    >
                      Acceder con {biometricInfo.label}
                    </Text>
                  </>
                )}
              </ThemedTouchable>

              {/* Use Email Instead Link */}
              <ThemedTouchable
                onPress={() => setUseEmailForm(true)}
                haptic="selection"
                style={{ paddingVertical: 14, alignItems: 'center' }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: colors.textSecondary,
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
                    fontFamily: 'PlusJakartaSans-Bold',
                    color: colors.primary,
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Text>
              </ThemedTouchable>

              <AuthButton
                title={loadingAction === 'email' ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                onPress={handleEmailLogin}
                isLoading={loadingAction === 'email'}
                disabled={isLoading}
                variant="primary"
              />

              <SocialAuthButtons
                onGooglePress={handleGoogleButtonPress}
                isLoading={loadingAction === 'google'}
                disabled={isLoading}
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
              fontFamily: 'PlusJakartaSans-Regular',
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
                fontFamily: 'PlusJakartaSans-ExtraBold',
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
