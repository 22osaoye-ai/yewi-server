import { Link, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react-native';
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

export default function RegisterClientScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      showToast({
        type: 'error',
        title: 'Campos requeridos',
        message: 'Por favor completa todos los campos marcados con asterisco (*).',
      });
      return;
    }
    if (password.length < 8) {
      showToast({
        type: 'error',
        title: 'Contraseña débil',
        message: 'La contraseña debe contener al menos 8 caracteres.',
      });
      return;
    }

    try {
      setIsLoading(true);
      const res: any = await api.post('/auth/register', {
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        roles: ['CLIENT'],
      });

      const { user, accessToken, refreshToken } = res.data || res;
      await setAuth(user, accessToken, refreshToken);

      showToast({
        type: 'success',
        title: '¡Bienvenido a Yewi!',
        message: 'Tu cuenta de cliente ha sido creada exitosamente.',
      });

      router.replace('/(client)/home');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Error al crear la cuenta. Comprueba tu conexión a la red.';
      showToast({
        type: 'error',
        title: 'Error de Registro',
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
              paddingBottom: Math.max(insets.bottom + 40, 60),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
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
            Registro de Cliente
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            Completa tus datos para publicar proyectos y contratar profesionales en Zaragoza
          </Text>

          {/* Form Card using AppInput & AppButton */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="Nombre *"
                  placeholder="Juan"
                  value={firstName}
                  onChangeText={setFirstName}
                  leftIcon={<User size={16} color={colors.textSecondary} />}
                />
              </View>

              <View style={{ flex: 1 }}>
                <AppInput
                  label="Apellidos *"
                  placeholder="García"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <AppInput
              label="Correo Electrónico *"
              placeholder="ejemplo@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={16} color={colors.textSecondary} />}
            />

            <AppInput
              label="Teléfono Móvil"
              placeholder="+34 600 000 000"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              leftIcon={<Phone size={16} color={colors.textSecondary} />}
            />

            <AppInput
              label="Contraseña *"
              placeholder="Mínimo 8 caracteres"
              isPassword
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={16} color={colors.textSecondary} />}
            />

            {/* Escrow Guarantee Pill */}
            <View style={styles.escrowNotice}>
              <ShieldCheck size={16} color="#059669" />
              <Text style={styles.escrowNoticeText}>
                Garantía Escrow: Tu dinero permanece protegido hasta tu conformidad con el servicio.
              </Text>
            </View>

            <AppButton
              title="Crear Cuenta Cliente"
              onPress={handleRegister}
              isLoading={isLoading}
              rightIcon={<ArrowRight size={18} color={isDark ? '#111813' : '#FFFFFF'} />}
              containerStyle={{ marginTop: 8 }}
            />

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                ¿Ya tienes una cuenta?{' '}
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={[styles.loginLink, { color: colors.accent }]}>
                    Inicia sesión
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
    marginBottom: 20,
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
    marginBottom: 20,
    lineHeight: 18,
  },
  formCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    ...Shadows.subtle,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  escrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderRadius: 18,
    padding: 12,
    gap: 8,
    marginVertical: 10,
  },
  escrowNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 16,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 13,
  },
  loginLink: {
    fontWeight: '800',
    fontSize: 13,
  },
});
