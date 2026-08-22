import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CachedImage } from '../src/components/CachedImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shadows } from '../src/components/Theme';
import { useAuthStore } from '../src/store/auth.store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, activeRole } = useAuthStore();

  // Animaciones de entrada suaves y elegantes
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Redirección si ya está autenticado
  if (isAuthenticated) {
    if (activeRole === 'PROFESSIONAL') {
      return <Redirect href="/(pro)/opportunities" />;
    }
    return <Redirect href="/(client)/home" />;
  }

  return (
    <View style={styles.container}>
      {/* Background Image / Ambient Gradient (Estilo Pantalla 1) */}
      <CachedImage
        uri={'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80'}
        style={styles.backgroundImage}
        resizeMode="cover"
        accessibilityLabel="Background image"
        placeholder={<View style={styles.backgroundImage} />}
      />

      {/* Dark Cinematic Gradient Overlay */}
      <LinearGradient
        colors={[
          'rgba(17, 24, 19, 0.96)',
          'rgba(17, 24, 19, 0.85)',
          'rgba(17, 24, 19, 0.70)',
          'rgba(17, 24, 19, 0.95)',
        ]}
        locations={[0, 0.35, 0.65, 1]}
        style={styles.gradientOverlay}
      />

      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 24, 48),
            paddingBottom: Math.max(insets.bottom + 20, 36),
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Top Brand & Header Section */}
        <View style={styles.topSection}>
          <View style={styles.brandBadge}>
            <View style={styles.diamondEmblem}>
              <View style={styles.diamondDot} />
              <View style={styles.diamondDot} />
              <View style={styles.diamondDot} />
              <View style={styles.diamondDot} />
            </View>
            <Text style={styles.brandBadgeText}>Yewi Zaragoza</Text>
          </View>

          <Text style={styles.title}>Welcome to Yewi</Text>
          <Text style={styles.subtitle}>
            Tu plataforma de confianza para contratar y ofrecer servicios de profesionales en Zaragoza.
          </Text>

          {/* Value Propositions / Bullet Points (Estilo Pantalla 1) */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconWrap}>
                <ShieldCheck size={18} color="#059669" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>Garantía de Pago Escrow</Text>
                <Text style={styles.featureDesc}>
                  Tu dinero permanece 100% retenido y protegido hasta tu total conformidad con el trabajo.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconWrap}>
                <Zap size={18} color="#FBBF24" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>Profesionales Verificados</Text>
                <Text style={styles.featureDesc}>
                  Electricistas, fontaneros, reformas y especialistas locales con tarifas transparentes en Zaragoza.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Direct Buttons Section (Estilo Pantalla 1) */}
        <View style={styles.bottomSection}>
          {/* Soy Cliente Button (White Pill) */}
          <TouchableOpacity
            style={styles.clientButton}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.88}
          >
            <Text style={styles.clientButtonText}>Soy Cliente (Contratar)</Text>
            <ArrowRight size={18} color="#111813" />
          </TouchableOpacity>

          {/* Soy Autónomo Button (Transparent Outline Pill) */}
          <TouchableOpacity
            style={styles.proButton}
            onPress={() => router.push('/(auth)/register-pro' as any)}
            activeOpacity={0.88}
          >
            <Text style={styles.proButtonText}>Soy Autónomo (Vender Servicios)</Text>
          </TouchableOpacity>

          {/* Link to Login */}
          <TouchableOpacity
            style={styles.loginLinkWrap}
            onPress={() => router.push('/(auth)/login' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginLinkHighlight}>Iniciar Sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111813',
  },
  backgroundImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topSection: {
    paddingTop: 10,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  diamondEmblem: {
    width: 14,
    height: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  diamondDot: {
    width: 4,
    height: 4,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 24,
    fontWeight: '500',
  },
  featuresContainer: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 16,
  },
  bottomSection: {
    gap: 12,
    paddingTop: 16,
  },
  clientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 9999,
    gap: 8,
    ...Shadows.floating,
  },
  clientButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111813',
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 56,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  proButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loginLinkWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  loginLinkHighlight: {
    fontWeight: '900',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});
