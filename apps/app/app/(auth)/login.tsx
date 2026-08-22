import { Link, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shadows } from '../../src/components/Theme';
import { useToast } from '../../src/components/Toast';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppInput } from '../../src/components/ui/AppInput';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const targetEmail = email.trim().toLowerCase();
    const targetPass = password;

    if (!targetEmail || !targetPass) {
      showToast({
        type: 'error',
        title: 'Campos requeridos',
        message: 'Por favor introduce tu correo electrónico y contraseña.',
      });
      return;
    }

    try {
      setIsLoading(true);
      const res: any = await api.post('/auth/login', {
        email: targetEmail,
        password: targetPass,
      });

      const { user, accessToken, refreshToken } = res.data || res;
      await setAuth(user, accessToken, refreshToken);

      showToast({
        type: 'success',
        title: '¡Sesión Iniciada!',
        message: `Bienvenido de nuevo, ${user.profile?.firstName || 'Usuario'}.`,
      });

      if (user.roles?.includes('PROFESSIONAL')) {
        router.replace('/(pro)/opportunities');
      } else {
        router.replace('/(client)/home');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Error de conexión. Verifica tus credenciales o el estado de la red.';
      showToast({
        type: 'error',
        title: 'Error de Autenticación',
        message: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 16, 36),
              paddingBottom: Math.max(insets.bottom + 30, 40),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              style={[
                styles.backBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              activeOpacity={0.8}
            >
              <ArrowLeft size={18} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.logoRow}>
              <Text style={[styles.logoText, { color: colors.text }]}>Yewi</Text>
              <Text style={styles.logoDot}>.</Text>
            </View>
          </View>

          <Text style={[styles.screenTitle, { color: colors.text }]}>
            Iniciar Sesión
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            Accede a tu cuenta para gestionar tus proyectos o cotizaciones
          </Text>

          {/* Form Card using reusable AppInput & AppButton */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppInput
              label="Correo Electrónico"
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={16} color={colors.textSecondary} />}
            />

            <AppInput
              label="Contraseña"
              placeholder="Introduce tu contraseña"
              isPassword
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={16} color={colors.textSecondary} />}
            />

            <AppButton
              title="Iniciar Sesión"
              onPress={handleLogin}
              isLoading={isLoading}
              rightIcon={<ArrowRight size={18} color={isDark ? '#111813' : '#FFFFFF'} />}
              containerStyle={{ marginTop: 8 }}
            />

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                ¿Aún no tienes cuenta?{' '}
              </Text>
              <Link href="/(auth)/select-role" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={[styles.registerLink, { color: colors.accent }]}>
                    Regístrate gratis
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  logoDot: {
    fontSize: 28,
    fontWeight: '900',
    color: '#E05A47',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    marginBottom: 24,
    lineHeight: 18,
  },
  formCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
    ...Shadows.subtle,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
  },
  registerLink: {
    fontWeight: '800',
    fontSize: 13,
  },
});
