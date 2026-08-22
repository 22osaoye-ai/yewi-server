import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Coins,
  FileText,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, Typography } from '../../src/components/Theme';
import { useToast } from '../../src/components/Toast';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppInput } from '../../src/components/ui/AppInput';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';
import { Category } from '../../src/types';

// Zonas oficiales de Zaragoza con sus códigos postales
const ZARAGOZA_ZONES = [
  { id: '50001', name: 'Centro / Casco Antiguo', postalCode: '50001' },
  { id: '50002', name: 'San José', postalCode: '50002' },
  { id: '50003', name: 'Casco Histórico / El Gancho', postalCode: '50003' },
  { id: '50004', name: 'Centro / Paseo Sagasta', postalCode: '50004' },
  { id: '50005', name: 'Universidad', postalCode: '50005' },
  { id: '50006', name: 'Centro / Goya', postalCode: '50006' },
  { id: '50007', name: 'San José / Torrero - La Paz', postalCode: '50007' },
  { id: '50008', name: 'Centro / Constitución', postalCode: '50008' },
  { id: '50009', name: 'Romareda', postalCode: '50009' },
  { id: '50010', name: 'Delicias / Bombarda / Monsalud', postalCode: '50010' },
  { id: '50011', name: 'Oliver / Valdefierro', postalCode: '50011' },
  { id: '50012', name: 'Casablanca', postalCode: '50012' },
  { id: '50013', name: 'Las Fuentes', postalCode: '50013' },
  { id: '50014', name: 'La Jota / Arrabal / Vadorrey', postalCode: '50014' },
  { id: '50015', name: 'Actur / Rey Fernando', postalCode: '50015' },
  { id: '50017', name: 'Delicias / Enlaces', postalCode: '50017' },
  { id: '50018', name: 'Actur / Gran Casa', postalCode: '50018' },
  { id: '50019', name: 'Parque Goya', postalCode: '50019' },
  { id: '50021', name: 'Miralbueno', postalCode: '50021' },
  { id: '50022', name: 'Valdespartera / Montecanal', postalCode: '50022' },
];

const RADIUS_OPTIONS = [15, 30, 50, 80];

export default function RegisterProStepperScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();

  // Paso actual (1 a 6)
  const [step, setStep] = useState(1);

  // Step 1: Categoría / Especialidad
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Step 2: Nombre y Apellidos
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Step 3: Nombre del Negocio
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');

  // Step 4: Ubicación & Cobertura
  const [selectedZone, setSelectedZone] = useState(ZARAGOZA_ZONES[0]);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(50);

  // Step 5: Datos de Contacto (Teléfono separado)
  const [phoneNumber, setPhoneNumber] = useState('');

  // Step 6: Datos de Acceso & Tarifa
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hourlyRate, setHourlyRate] = useState('35');
  const [isLoading, setIsLoading] = useState(false);

  // Categorías reales de la BD
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories-tree'],
    queryFn: async () => {
      const res: any = await api.get('/categories/tree');
      return res.data || res || [];
    },
  });

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setStep(2);
  };

  const handleNext = () => {
    if (step === 2) {
      if (!firstName.trim() || !lastName.trim()) {
        showToast({
          type: 'error',
          title: 'Campos Requeridos',
          message: 'Por favor introduce tu nombre y apellidos.',
        });
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!businessName.trim()) {
        showToast({
          type: 'error',
          title: 'Razón Social Requerida',
          message: 'Por favor introduce el nombre comercial o razón social de tu actividad.',
        });
        return;
      }
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      if (!phoneNumber.trim()) {
        showToast({
          type: 'error',
          title: 'Teléfono Requerido',
          message: 'Por favor introduce tu número de teléfono móvil de contacto.',
        });
        return;
      }
      setStep(6);
    } else if (step === 6) {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  };

  const handleFinalSubmit = async () => {
    const targetEmail = email.trim().toLowerCase();
    const targetPass = password;

    if (!targetEmail || !targetPass) {
      showToast({
        type: 'error',
        title: 'Datos de Acceso Incompletos',
        message: 'Por favor introduce tu correo corporativo y contraseña de acceso.',
      });
      return;
    }

    if (targetPass.length < 8) {
      showToast({
        type: 'error',
        title: 'Contraseña Débil',
        message: 'La contraseña debe contener al menos 8 caracteres.',
      });
      return;
    }

    try {
      setIsLoading(true);
      const res: any = await api.post('/auth/register', {
        email: targetEmail,
        password: targetPass,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        roles: ['CLIENT', 'PROFESSIONAL'],
        businessName: businessName.trim(),
        bio: bio.trim() || `Profesional de ${selectedCategory?.name || 'servicios'} en Zaragoza.`,
        serviceRadiusKm,
        city: 'Zaragoza',
        postalCode: selectedZone.postalCode,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 35,
        skills: [selectedCategory?.name || 'Servicios del Hogar'],
        latitude: 41.6488,
        longitude: -0.8891,
      });

      const { user, accessToken, refreshToken } = res.data || res;
      await setAuth(user, accessToken, refreshToken);

      showToast({
        type: 'success',
        title: '¡Registro Completado!',
        message: 'Bienvenido a Yewi Pro. Tienes 50 créditos en tu billetera.',
      });

      router.replace('/(pro)/opportunities');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Error al crear tu cuenta profesional. Comprueba tu conexión.';
      showToast({
        type: 'error',
        title: 'Error de Registro',
        message: Array.isArray(msg) ? msg.join(' • ') : msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Stepper Header Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top + 8, 16),
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.navIconButton}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {selectedCategory ? selectedCategory.name : 'Registro Profesional'}
        </Text>

        <TouchableOpacity
          onPress={() => router.replace('/')}
          style={styles.navIconButton}
          activeOpacity={0.8}
        >
          <X size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Segmented Stepper Progress Bar (6 Pasos) */}
      <View style={styles.progressContainer}>
        <View style={styles.segmentedProgressBar}>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <View
              key={s}
              style={[
                styles.progressSegment,
                s <= step ? styles.progressSegmentActive : styles.progressSegmentInactive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressStepLabel}>
          Paso {step} de 6 •{' '}
          {step === 1
            ? 'Especialidad'
            : step === 2
            ? 'Identidad'
            : step === 3
            ? 'Negocio'
            : step === 4
            ? 'Ubicación'
            : step === 5
            ? 'Contacto'
            : 'Acceso'}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ============================================================
            STEP 1: SELECCIONA QUÉ SERVICIO PRESTAS
        ============================================================ */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>¿Qué servicio prestas?</Text>
            <Text style={styles.stepSubtitle}>
              Selecciona tu especialidad principal para recibir solicitudes directas en Zaragoza
            </Text>

            {isLoadingCategories ? (
              <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={{ marginVertical: 30 }}
              />
            ) : (
              <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.categoryListContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.categoryListItem}
                    onPress={() => handleSelectCategory(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryListItemText}>{item.name}</Text>
                    <ChevronRight size={18} color="#8E9892" />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* ============================================================
            STEP 2: ¿CÓMO TE LLAMAS?
        ============================================================ */}
        {step === 2 && (
          <ScrollView
            contentContainerStyle={styles.stepScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stepTitle}>¿Cómo te llamas?</Text>
            <Text style={styles.stepSubtitle}>
              Los clientes verán tu nombre en tu perfil y en los presupuestos que envíes en Zaragoza.
            </Text>

            <View style={styles.formCard}>
              <AppInput
                label="Nombre *"
                placeholder="Introduce tu nombre"
                value={firstName}
                onChangeText={setFirstName}
                autoFocus
              />

              <AppInput
                label="Apellidos *"
                placeholder="Introduce tus apellidos"
                value={lastName}
                onChangeText={setLastName}
              />

              <View style={styles.tipBadge}>
                <View style={styles.tipCheckCircle}>
                  <Check size={14} color="#059669" />
                </View>
                <Text style={styles.tipBadgeText}>
                  Poner en mayúsculas las iniciales del Nombre y Apellidos proporcionará un aspecto más profesional.
                </Text>
              </View>
            </View>

            <AppButton
              title="Continuar"
              onPress={handleNext}
              containerStyle={{ marginTop: 24 }}
            />
          </ScrollView>
        )}

        {/* ============================================================
            STEP 3: ¿CUÁL ES EL NOMBRE DE TU NEGOCIO?
        ============================================================ */}
        {step === 3 && (
          <ScrollView
            contentContainerStyle={styles.stepScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stepTitle}>¿Cuál es el nombre de tu negocio?</Text>
            <Text style={styles.stepSubtitle}>
              Este será el título de tu perfil comercial y el nombre que los clientes asociarán a tus ofertas.
            </Text>

            <View style={styles.formCard}>
              <AppInput
                label="Nombre Comercial o Razón Social *"
                placeholder="Ej. Reformas & Fontanería Ebro"
                value={businessName}
                onChangeText={setBusinessName}
                autoFocus
              />

              <AppInput
                label="Presentación / Biografía Breve"
                placeholder="Más de 10 años de experiencia realizando trabajos de calidad..."
                multiline
                value={bio}
                onChangeText={setBio}
              />

              <View style={styles.tipBadge}>
                <View style={styles.tipCheckCircle}>
                  <Check size={14} color="#059669" />
                </View>
                <Text style={styles.tipBadgeText}>
                  Poner en mayúsculas las iniciales de tu empresa transmitirá mayor confianza y seriedad ante los clientes.
                </Text>
              </View>
            </View>

            <AppButton
              title="Continuar"
              onPress={handleNext}
              containerStyle={{ marginTop: 24 }}
            />
          </ScrollView>
        )}

        {/* ============================================================
            STEP 4: UBICACIÓN & COBERTURA
        ============================================================ */}
        {step === 4 && (
          <ScrollView
            contentContainerStyle={styles.stepScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stepTitle}>¿Dónde prestas servicio?</Text>
            <Text style={styles.stepSubtitle}>
              Configura tu base de operaciones y el radio máximo de desplazamiento.
            </Text>

            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Provincia</Text>
              <View style={styles.staticFieldPill}>
                <MapPin size={16} color={Colors.accent} />
                <Text style={styles.staticFieldText}>Zaragoza (Aragón)</Text>
              </View>

              <Text style={styles.fieldLabel}>Barrio / Zona Principal *</Text>
              <TouchableOpacity
                style={styles.pickerSelector}
                onPress={() => setShowZoneModal(true)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerSelectorTitle}>
                    {selectedZone.name}
                  </Text>
                  <Text style={styles.pickerSelectorSubtitle}>
                    Código Postal: {selectedZone.postalCode}
                  </Text>
                </View>
                <ChevronDown size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                Radio de Cobertura Máximo
              </Text>
              <View style={styles.radiusRow}>
                {RADIUS_OPTIONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.radiusPill,
                      serviceRadiusKm === r && styles.radiusPillActive,
                    ]}
                    onPress={() => setServiceRadiusKm(r)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.radiusPillText,
                        serviceRadiusKm === r && styles.radiusPillTextActive,
                      ]}
                    >
                      {r} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <AppButton
              title="Continuar"
              onPress={handleNext}
              containerStyle={{ marginTop: 24 }}
            />
          </ScrollView>
        )}

        {/* ============================================================
            STEP 5: DATOS DE CONTACTO (Teléfono separado en su propio paso)
        ============================================================ */}
        {step === 5 && (
          <ScrollView
            contentContainerStyle={styles.stepScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stepTitle}>Número de teléfono móvil</Text>
            <Text style={styles.stepSubtitle}>
              Por favor proporciona tu número de móvil para recibir avisos urgentes de clientes en Zaragoza.
            </Text>

            <View style={styles.formCard}>
              <AppInput
                label="Número de teléfono móvil *"
                placeholder="691 66 82 50"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                autoFocus
                leftIcon={<Phone size={16} color={Colors.textSecondary} />}
              />

              <View style={styles.tipBadge}>
                <View style={styles.tipCheckCircle}>
                  <Check size={14} color="#059669" />
                </View>
                <Text style={styles.tipBadgeText}>
                  Solo utilizaremos tu teléfono para coordinar proyectos y notificaciones de pedidos activos.
                </Text>
              </View>
            </View>

            <AppButton
              title="Continuar"
              onPress={handleNext}
              containerStyle={{ marginTop: 24 }}
            />
          </ScrollView>
        )}

        {/* ============================================================
            STEP 6: DATOS DE ACCESO & TARIFA
        ============================================================ */}
        {step === 6 && (
          <ScrollView
            contentContainerStyle={styles.stepScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stepTitle}>Datos de Acceso & Tarifa</Text>
            <Text style={styles.stepSubtitle}>
              Crea tus credenciales de inicio de sesión y define tu tarifa de referencia.
            </Text>

            <View style={styles.formCard}>
              <AppInput
                label="Correo Electrónico Corporativo *"
                placeholder="tu@negocio.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                autoFocus
                leftIcon={<Mail size={16} color={Colors.textSecondary} />}
              />

              <AppInput
                label="Contraseña de Acceso *"
                placeholder="Mínimo 8 caracteres"
                isPassword
                value={password}
                onChangeText={setPassword}
                leftIcon={<Lock size={16} color={Colors.textSecondary} />}
              />

              <AppInput
                label="Tarifa Horaria de Referencia (€ / hora)"
                placeholder="35"
                keyboardType="numeric"
                value={hourlyRate}
                onChangeText={setHourlyRate}
              />

              {/* Bonus de Bienvenida */}
              <View style={styles.bonusBanner}>
                <View style={styles.bonusIconWrap}>
                  <Coins size={24} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bonusTitle}>+50 Créditos de Bienvenida</Text>
                  <Text style={styles.bonusDesc}>
                    Se cargarán en tu billetera para contactar a tus primeros clientes en Zaragoza.
                  </Text>
                </View>
              </View>
            </View>

            <AppButton
              title="Finalizar y Activar (+50 cr.)"
              onPress={handleFinalSubmit}
              isLoading={isLoading}
              containerStyle={{ marginTop: 20 }}
            />
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* ============================================================
          MODAL BOTTOMSHEET: SELECCIONA BARRIO / ZONA
      ============================================================ */}
      <Modal
        visible={showZoneModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowZoneModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona Barrio / Zona</Text>
              <TouchableOpacity
                onPress={() => setShowZoneModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={ZARAGOZA_ZONES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedZone.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.zoneListItem,
                      isSelected && styles.zoneListItemActive,
                    ]}
                    onPress={() => {
                      setSelectedZone(item);
                      setShowZoneModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text
                        style={[
                          styles.zoneListItemTitle,
                          isSelected && styles.zoneListItemTitleActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.zoneListItemSubtitle}>
                        Código Postal: {item.postalCode}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color="#111813" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  navIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111813',
    maxWidth: '70%',
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  segmentedProgressBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: '#111813',
  },
  progressSegmentInactive: {
    backgroundColor: Colors.border,
  },
  progressStepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  stepScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111813',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  categoryListContent: {
    paddingBottom: 60,
  },
  categoryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  categoryListItemText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111813',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    ...Shadows.subtle,
  },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderRadius: 18,
    padding: 12,
    gap: 10,
    marginTop: 8,
  },
  tipCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBadgeText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 16,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111813',
    marginBottom: 6,
  },
  staticFieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceWarm,
    borderRadius: 9999,
    paddingHorizontal: 16,
    height: 50,
    gap: 10,
    marginBottom: 14,
  },
  staticFieldText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111813',
  },
  pickerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerSelectorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111813',
  },
  pickerSelectorSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusPill: {
    flex: 1,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: 9999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  radiusPillActive: {
    backgroundColor: '#111813',
  },
  radiusPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  radiusPillTextActive: {
    color: '#FFFFFF',
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    padding: 14,
    gap: 12,
    marginTop: 8,
  },
  bonusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309',
  },
  bonusDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
    lineHeight: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111813',
  },
  modalCloseBtn: {
    padding: 4,
  },
  zoneListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  zoneListItemActive: {
    backgroundColor: 'rgba(17, 24, 19, 0.04)',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  zoneListItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111813',
  },
  zoneListItemTitleActive: {
    fontWeight: '900',
  },
  zoneListItemSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
