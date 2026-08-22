import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  ChevronRight,
  Coins,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wrench,
} from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../src/components/Theme';

export default function SelectRoleScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back & Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <ArrowLeft size={18} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <Text style={styles.logoText}>Yewi</Text>
            <Text style={styles.logoDot}>.</Text>
          </View>
        </View>

        <Text style={styles.screenTitle}>¿Cómo deseas usar Yewi?</Text>
        <Text style={styles.screenSubtitle}>
          Elige el tipo de cuenta que mejor se adapte a tus necesidades
        </Text>

        {/* Tarjeta 1: Cliente */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => router.push('/(auth)/register-client')}
          activeOpacity={0.88}
        >
          <View style={styles.roleCardHeader}>
            <View style={styles.iconCircle}>
              <ShoppingBag size={24} color={Colors.primary} />
            </View>
            <View style={styles.arrowCircle}>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </View>
          </View>

          <Text style={styles.roleCardTitle}>Soy Cliente / Particular</Text>
          <Text style={styles.roleCardDesc}>
            Busco profesionales para reformas, reparaciones o servicios en Zaragoza. Publica proyectos gratis y compara presupuestos.
          </Text>

          <View style={styles.roleCardFooter}>
            <View style={styles.tagPill}>
              <ShieldCheck size={12} color="#059669" />
              <Text style={styles.tagText}>Pago 100% Protegido</Text>
            </View>
            <Text style={styles.actionText}>Crear cuenta cliente →</Text>
          </View>
        </TouchableOpacity>

        {/* Tarjeta 2: Autónomo / Pro */}
        <TouchableOpacity
          style={[styles.roleCard, styles.roleCardPro]}
          onPress={() => router.push('/(auth)/register-pro')}
          activeOpacity={0.88}
        >
          <View style={styles.roleCardHeader}>
            <View style={[styles.iconCircle, styles.iconCirclePro]}>
              <Briefcase size={24} color="#FFFFFF" />
            </View>
            <View style={styles.bonusBadge}>
              <Coins size={12} color="#D97706" />
              <Text style={styles.bonusText}>+50 Créditos</Text>
            </View>
          </View>

          <Text style={styles.roleCardTitle}>Soy Autónomo / Empresa</Text>
          <Text style={styles.roleCardDesc}>
            Quiero captar clientes en Zaragoza, recibir alertas de proyectos cerca de mí y vender paquetes de servicios a precio fijo.
          </Text>

          <View style={styles.roleCardFooter}>
            <View style={[styles.tagPill, styles.tagPillPro]}>
              <Sparkles size={12} color={Colors.primary} />
              <Text style={[styles.tagText, { color: Colors.primary }]}>
                Perfil Verificado
              </Text>
            </View>
            <Text style={[styles.actionText, { color: Colors.primary }]}>
              Comenzar registro Pro →
            </Text>
          </View>
        </TouchableOpacity>

        {/* Iniciar sesión */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
  },
  logoDot: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.coral,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 18,
  },
  roleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 22,
    marginBottom: 16,
  },
  roleCardPro: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePro: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 9999,
    gap: 4,
  },
  bonusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  roleCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 6,
  },
  roleCardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  roleCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  tagPillPro: {
    backgroundColor: 'rgba(27, 67, 50, 0.08)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
});
