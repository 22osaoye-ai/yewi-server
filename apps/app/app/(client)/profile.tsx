import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Check,
  ChevronRight,
  Coins,
  CreditCard,
  Globe,
  Home,
  Lock,
  LogOut,
  MapPin,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  SwitchCamera,
  User,
  X,
  Zap,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { AppSwitch } from '../../src/components/ui/AppSwitch';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';
import { Category } from '../../src/types';

export default function ClientProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, switchRole, updateUser } = useAuthStore();
  const { showToast } = useToast();
  const router = useRouter();

  // Modales dedicados
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showProStepperModal, setShowProStepperModal] = useState(false);

  // Stepper de activación Pro (Paso 1: Categorías, Paso 2: Negocio & Tarifa, Paso 3: Activación)
  const [proStep, setProStep] = useState(1);
  const [selectedProCategory, setSelectedProCategory] = useState<Category | null>(null);

  // Formulario de edición personal
  const [firstName, setFirstName] = useState(user?.profile?.firstName || 'Juan');
  const [lastName, setLastName] = useState(user?.profile?.lastName || 'García');
  const [phoneNumber, setPhoneNumber] = useState(user?.profile?.phoneNumber || '691 66 82 80');
  const [city, setCity] = useState(user?.profile?.city || 'Zaragoza');
  const [address, setAddress] = useState(user?.profile?.address || 'Calle Alfonso I, 14');
  const [postalCode, setPostalCode] = useState(user?.profile?.postalCode || '50001');
  const [isSaving, setIsSaving] = useState(false);

  // Formulario de activación Pro
  const userFullName = `${firstName} ${lastName}`.trim() || 'Juan García';
  const [proBusinessName, setProBusinessName] = useState(userFullName);
  const [proBio, setProBio] = useState('Profesional de servicios en Zaragoza');
  const [proHourlyRate, setProHourlyRate] = useState('35');
  const [isActivatingPro, setIsActivatingPro] = useState(false);

  const isPro = user?.roles.includes('PROFESSIONAL');
  const initial = (firstName || 'J').charAt(0).toUpperCase();

  // Categorías reales de Zaragoza desde la base de datos
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories-tree'],
    queryFn: async () => {
      const res: any = await api.get('/categories/tree');
      return res.data || res || [];
    },
  });

  // Guardar Cambios en el Modal Separado
  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showToast({
        type: 'error',
        title: 'Campos Requeridos',
        message: 'Por favor introduce tu nombre y apellidos.',
      });
      return;
    }

    try {
      setIsSaving(true);
      await api.patch('/users/me/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        city: city.trim(),
        address: address.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
      });

      if (user) {
        const updated = {
          ...user,
          profile: {
            ...user.profile,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: phoneNumber.trim(),
            city: city.trim(),
            address: address.trim(),
            postalCode: postalCode.trim(),
          },
        };
        await updateUser(updated as any);
      }

      showToast({
        type: 'success',
        title: '¡Perfil Actualizado!',
        message: 'Tus datos se han guardado correctamente.',
      });
      setShowEditModal(false);
      setShowLocationModal(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al actualizar perfil.';
      showToast({
        type: 'error',
        title: 'Error',
        message: msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Activar Modo Pro a través del Stepper
  const handleActivatePro = async () => {
    try {
      setIsActivatingPro(true);
      const res: any = await api.put('/professionals/me', {
        businessName: proBusinessName.trim() || userFullName,
        bio: proBio.trim() || `Especialista en ${selectedProCategory?.name || 'servicios'} en Zaragoza.`,
        serviceRadiusKm: 50,
        city: city || 'Zaragoza',
        latitude: 41.6488,
        longitude: -0.8891,
        hourlyRate: proHourlyRate ? parseFloat(proHourlyRate) : 35,
        skills: selectedProCategory ? [selectedProCategory.name] : ['Servicios del Hogar'],
      });

      if (user) {
        const updated = {
          ...user,
          roles: [...user.roles, 'PROFESSIONAL' as const],
          professionalProfile: res.data || res,
        };
        await updateUser(updated);
      }

      showToast({
        type: 'success',
        title: '¡Cuenta Profesional Activada!',
        message: 'Bienvenido al panel Pro con 50 créditos en tu billetera.',
      });

      setShowProStepperModal(false);
      switchRole('PROFESSIONAL');
      router.replace('/(pro)/opportunities');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al activar perfil profesional.';
      showToast({
        type: 'error',
        title: 'Error',
        message: msg,
      });
    } finally {
      setIsActivatingPro(false);
    }
  };

  const handleToggleProRole = (value: boolean) => {
    if (isPro) {
      switchRole('PROFESSIONAL');
      router.replace('/(pro)/opportunities');
    } else {
      // Inicia el stepper de activación Pro con categorías
      setProStep(1);
      setProBusinessName(userFullName);
      setShowProStepperModal(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast({
      type: 'info',
      title: 'Sesión Finalizada',
      message: 'Has salido de tu cuenta.',
    });
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar (Estilo Imagen 2) */}
      <View
        style={[
          styles.topHeader,
          {
            paddingTop: Math.max(insets.top + 8, 16),
          },
        ]}
      >
        <View style={{ width: 40 }} />
        <Text style={styles.topHeaderTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() =>
            showToast({
              type: 'info',
              title: 'Notificaciones',
              message: 'No tienes notificaciones pendientes.',
            })
          }
          activeOpacity={0.8}
        >
          <Bell size={20} color="#111813" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================
            1. HERO USER AVATAR & IDENTITY (Centro Pantalla Imagen 2)
        ============================================================ */}
        <View style={styles.heroSection}>
          <View style={styles.avatarGlowContainer}>
            <View style={styles.avatarLargeCircle}>
              {user?.profile?.avatarUrl ? (
                <Image
                  source={{ uri: user.profile.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarInitialText}>{initial}</Text>
              )}
            </View>
          </View>

          <Text style={styles.userNameText}>{userFullName}</Text>

          <View style={styles.locationRow}>
            <MapPin size={14} color="#6C756F" />
            <Text style={styles.locationText}>
              {city || 'Zaragoza'}, {postalCode || '50001'}
            </Text>
          </View>
        </View>

        {/* ============================================================
            2. STATS ROW (3 Columnas - Estilo Imagen 2)
        ============================================================ */}
        <View style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>AVG. rating</Text>
            <View style={styles.statValueRow}>
              <Star size={14} color="#D97706" fill="#D97706" />
              <Text style={styles.statValueText}>5.0</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Garantía</Text>
            <View style={styles.statValueRow}>
              <ShieldCheck size={14} color="#059669" />
              <Text style={styles.statValueText}>100%</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Servicios</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValueText}>3</Text>
            </View>
          </View>
        </View>

        {/* ============================================================
            3. SWITCH ROLE TOGGLE CON CUSTOM IOS SWITCH ANIMADO
        ============================================================ */}
        <View style={styles.switchRoleCard}>
          <View style={styles.switchRoleTextWrap}>
            <SwitchCamera size={20} color="#111813" />
            <View>
              <Text style={styles.switchRoleTitle}>
                {isPro ? 'Modo Autónomo / Pro' : 'Switch to Hire Mode'}
              </Text>
              <Text style={styles.switchRoleSubtitle}>
                {isPro
                  ? 'Gestionar servicios y presupuestos'
                  : 'Ofrecer servicios profesionales (+50 cr.)'}
              </Text>
            </View>
          </View>

          {/* Custom iOS Switch */}
          <AppSwitch
            value={!!isPro}
            onValueChange={handleToggleProRole}
            activeColor="#111813"
            inActiveColor="#E8E2D5"
          />
        </View>

        {/* ============================================================
            4. GENERAL MENU LIST (Filas con Chevrons - Estilo Imagen 2)
        ============================================================ */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionKicker}>General</Text>

          {/* Fila 1: Profile Setting */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <User size={18} color="#111813" />
            </View>
            <View style={styles.menuRowTextWrap}>
              <Text style={styles.menuRowTitle}>Profile Setting</Text>
              <Text style={styles.menuRowSubtitle}>
                Editar nombre, apellidos y teléfono
              </Text>
            </View>
            <ChevronRight size={18} color="#9BA39E" />
          </TouchableOpacity>

          {/* Fila 2: Location */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <MapPin size={18} color="#111813" />
            </View>
            <View style={styles.menuRowTextWrap}>
              <Text style={styles.menuRowTitle}>Location</Text>
              <Text style={styles.menuRowSubtitle}>
                {address || 'Calle Alfonso I'}, {city || 'Zaragoza'}
              </Text>
            </View>
            <ChevronRight size={18} color="#9BA39E" />
          </TouchableOpacity>

          {/* Fila 3: Manage Withdrawals & Escrow */}
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/(client)/orders' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconCircle}>
              <CreditCard size={18} color="#111813" />
            </View>
            <View style={styles.menuRowTextWrap}>
              <Text style={styles.menuRowTitle}>Manage Withdrawals</Text>
              <Text style={styles.menuRowSubtitle}>
                Historial de transacciones y Escrow
              </Text>
            </View>
            <ChevronRight size={18} color="#9BA39E" />
          </TouchableOpacity>
        </View>

        {/* ============================================================
            5. BOTÓN DE CERRAR SESIÓN SEPARADO (Estilo Original)
        ============================================================ */}
        <AppButton
          title="Cerrar Sesión"
          variant="outline"
          onPress={handleLogout}
          leftIcon={<LogOut size={16} color={Colors.danger} />}
          textStyle={{ color: Colors.danger }}
          containerStyle={styles.logoutButton}
        />
      </ScrollView>

      {/* ============================================================
          STEPPER MODAL CON CATEGORÍAS PARA CAMBIO A MODO PRO
      ============================================================ */}
      <Modal
        visible={showProStepperModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProStepperModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.modalSheet,
                {
                  paddingBottom: Math.max(insets.bottom + 16, 24),
                },
              ]}
            >
              {/* Stepper Header & Progress Bar */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {proStep === 1
                      ? '¿Qué servicio ofreces?'
                      : proStep === 2
                      ? 'Tarifa y Negocio'
                      : 'Activar Modo Pro'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Paso {proStep} de 3 • Usuario: {userFullName}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowProStepperModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color="#111813" />
                </TouchableOpacity>
              </View>

              {/* Segmented Progress Bar */}
              <View style={styles.stepperProgressRow}>
                {[1, 2, 3].map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.stepperSegment,
                      s <= proStep
                        ? styles.stepperSegmentActive
                        : styles.stepperSegmentInactive,
                    ]}
                  />
                ))}
              </View>

              {/* PASO 1: SELECCIONAR CATEGORÍA */}
              {proStep === 1 && (
                <View style={{ maxHeight: 380 }}>
                  <Text style={styles.stepKicker}>
                    Selecciona tu oficio principal en Zaragoza:
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
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.categoryItem}
                          onPress={() => {
                            setSelectedProCategory(item);
                            setProStep(2);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.categoryItemText}>
                            {item.name}
                          </Text>
                          <ChevronRight size={18} color="#9BA39E" />
                        </TouchableOpacity>
                      )}
                    />
                  )}
                </View>
              )}

              {/* PASO 2: TARIFA Y NOMBRE COMERCIAL */}
              {proStep === 2 && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.selectedCatBanner}>
                    <Briefcase size={16} color="#111813" />
                    <Text style={styles.selectedCatText}>
                      Especialidad:{' '}
                      <Text style={{ fontWeight: '900' }}>
                        {selectedProCategory?.name}
                      </Text>
                    </Text>
                  </View>

                  <AppInput
                    label="Nombre Comercial / Razón Social"
                    placeholder={userFullName}
                    value={proBusinessName}
                    onChangeText={setProBusinessName}
                  />

                  <AppInput
                    label="Tarifa Horaria Estimada (€ / hora)"
                    placeholder="35"
                    keyboardType="numeric"
                    value={proHourlyRate}
                    onChangeText={setProHourlyRate}
                  />

                  <AppInput
                    label="Biografía / Especialidades"
                    placeholder="Describe tus servicios..."
                    multiline
                    value={proBio}
                    onChangeText={setProBio}
                  />

                  <View style={styles.stepperActionRow}>
                    <TouchableOpacity
                      style={styles.prevStepBtn}
                      onPress={() => setProStep(1)}
                    >
                      <ArrowLeft size={16} color="#111813" />
                    </TouchableOpacity>

                    <AppButton
                      title="Continuar"
                      onPress={() => setProStep(3)}
                      containerStyle={{ flex: 1 }}
                    />
                  </View>
                </ScrollView>
              )}

              {/* PASO 3: CONFIRMACIÓN Y +50 CRÉDITOS */}
              {proStep === 3 && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Resumen de Activación</Text>
                    <Text style={styles.summaryItem}>
                      • Profesional: <Text style={{ fontWeight: '800' }}>{proBusinessName || userFullName}</Text>
                    </Text>
                    <Text style={styles.summaryItem}>
                      • Especialidad: <Text style={{ fontWeight: '800' }}>{selectedProCategory?.name}</Text>
                    </Text>
                    <Text style={styles.summaryItem}>
                      • Tarifa: <Text style={{ fontWeight: '800' }}>{proHourlyRate} € / hora</Text>
                    </Text>
                    <Text style={styles.summaryItem}>
                      • Cobertura: <Text style={{ fontWeight: '800' }}>Zaragoza (50 km)</Text>
                    </Text>
                  </View>

                  <View style={styles.bonusBanner}>
                    <Coins size={22} color="#D97706" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bonusTitle}>+50 Créditos de Bienvenida</Text>
                      <Text style={styles.bonusDesc}>
                        Se añadirán a tu billetera para recibir y responder solicitudes de clientes.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepperActionRow}>
                    <TouchableOpacity
                      style={styles.prevStepBtn}
                      onPress={() => setProStep(2)}
                    >
                      <ArrowLeft size={16} color="#111813" />
                    </TouchableOpacity>

                    <AppButton
                      title="Activar Modo Pro (+50 cr.)"
                      onPress={handleActivatePro}
                      isLoading={isActivatingPro}
                      leftIcon={<Sparkles size={16} color="#FFFFFF" />}
                      containerStyle={{ flex: 1 }}
                    />
                  </View>
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ============================================================
          MODAL DEDICADO: EDITAR DATOS PERSONALES
      ============================================================ */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.modalSheet,
                {
                  paddingBottom: Math.max(insets.bottom + 16, 24),
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Profile Setting</Text>
                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color="#111813" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      label="Nombre *"
                      placeholder="Juan"
                      value={firstName}
                      onChangeText={setFirstName}
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
                  label="Teléfono Móvil"
                  placeholder="691 66 82 80"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  leftIcon={<Phone size={16} color={Colors.textSecondary} />}
                />

                <AppButton
                  title="Guardar Cambios"
                  onPress={handleSaveProfile}
                  isLoading={isSaving}
                  leftIcon={<Save size={16} color="#FFFFFF" />}
                  containerStyle={{ marginTop: 12 }}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ============================================================
          MODAL DEDICADO: EDITAR UBICACIÓN & DIRECCIÓN
      ============================================================ */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.modalSheet,
                {
                  paddingBottom: Math.max(insets.bottom + 16, 24),
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Location & Address</Text>
                <TouchableOpacity
                  onPress={() => setShowLocationModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color="#111813" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <AppInput
                  label="Dirección / Calle"
                  placeholder="Ej. Calle Alfonso I, 14"
                  value={address}
                  onChangeText={setAddress}
                  leftIcon={<Home size={16} color={Colors.textSecondary} />}
                />

                <View style={styles.row}>
                  <View style={{ flex: 2 }}>
                    <AppInput
                      label="Ciudad"
                      placeholder="Zaragoza"
                      value={city}
                      onChangeText={setCity}
                      leftIcon={<MapPin size={16} color={Colors.accent} />}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      label="C. Postal"
                      placeholder="50001"
                      keyboardType="numeric"
                      value={postalCode}
                      onChangeText={setPostalCode}
                    />
                  </View>
                </View>

                <AppButton
                  title="Actualizar Dirección"
                  onPress={handleSaveProfile}
                  isLoading={isSaving}
                  leftIcon={<Save size={16} color="#FFFFFF" />}
                  containerStyle={{ marginTop: 12 }}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111813',
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 170,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  avatarGlowContainer: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: '#F5ECE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E8E2D5',
  },
  avatarLargeCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#111813',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitialText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111813',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#6C756F',
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 14,
    ...Shadows.subtle,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E9892',
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValueText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111813',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F5ECE3',
  },
  switchRoleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    ...Shadows.subtle,
  },
  switchRoleTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchRoleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111813',
  },
  switchRoleSubtitle: {
    fontSize: 11,
    color: '#6C756F',
    marginTop: 1,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    ...Shadows.subtle,
  },
  menuSectionKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E9892',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE3',
    gap: 12,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowTextWrap: {
    flex: 1,
  },
  menuRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111813',
  },
  menuRowSubtitle: {
    fontSize: 11,
    color: '#6C756F',
    marginTop: 2,
  },
  logoutButton: {
    borderColor: '#E8E2D5',
    backgroundColor: '#FFFFFF',
    marginTop: 6,
    borderRadius: 9999,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 22,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111813',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6C756F',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  stepperProgressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  stepperSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepperSegmentActive: {
    backgroundColor: '#111813',
  },
  stepperSegmentInactive: {
    backgroundColor: '#E8E2D5',
  },
  stepKicker: {
    fontSize: 13,
    color: '#6C756F',
    fontWeight: '600',
    marginBottom: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE3',
  },
  categoryItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111813',
  },
  selectedCatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5ECE3',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 12,
  },
  selectedCatText: {
    fontSize: 13,
    color: '#111813',
  },
  stepperActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  prevStepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    padding: 16,
    gap: 6,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111813',
    marginBottom: 4,
  },
  summaryItem: {
    fontSize: 13,
    color: '#6C756F',
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    padding: 12,
    gap: 10,
    marginTop: 6,
  },
  bonusTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309',
  },
  bonusDesc: {
    fontSize: 11,
    color: '#6C756F',
    marginTop: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
