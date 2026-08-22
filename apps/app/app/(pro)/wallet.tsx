import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Coins,
  CreditCard,
  DollarSign,
  History,
  Lock,
  Plus,
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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, Typography } from '../../src/components/Theme';
import { useToast } from '../../src/components/Toast';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppInput } from '../../src/components/ui/AppInput';
import { api } from '../../src/services/api';
import { CreditPackageItem, Wallet } from '../../src/types';

export default function ProWalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();

  // Estados de pasarela de pagos
  const [selectedPackForPayment, setSelectedPackForPayment] = useState<CreditPackageItem | null>(null);
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardHolder, setCardHolder] = useState('Juan García');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Estados de retiro
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutIban, setPayoutIban] = useState('');

  // 1. Obtener billetera y transacciones
  const {
    data: wallet,
    isLoading: isLoadingWallet,
    refetch,
    isRefetching,
  } = useQuery<Wallet & { transactions: any[] }>({
    queryKey: ['pro-wallet'],
    queryFn: async () => {
      const res: any = await api.get('/wallet/me');
      return res.data || res;
    },
  });

  // 2. Obtener paquetes de créditos
  const { data: packages = [], isLoading: isLoadingPackages } = useQuery<CreditPackageItem[]>({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const res: any = await api.get('/wallet/packages');
      return res.data || res || [];
    },
  });

  // Iniciar pasarela de pagos para el paquete seleccionado
  const handleOpenPaymentGateway = (pack: CreditPackageItem) => {
    setSelectedPackForPayment(pack);
    setShowPaymentGatewayModal(true);
  };

  // Procesar pago en la pasarela de pagos (Stripe / Escrow)
  const handleProcessPayment = async () => {
    if (!selectedPackForPayment) return;

    try {
      setIsProcessingPayment(true);

      // Paso 1: Crear PaymentIntent seguro en el servidor
      const intentRes: any = await api.post('/wallet/buy-credits/intent', {
        pack: selectedPackForPayment.id,
      });

      const { paymentIntentId } = intentRes.data || intentRes;

      // Paso 2: Confirmar pago validado por la pasarela de pagos
      await api.post('/wallet/buy-credits/confirm', {
        paymentIntentId,
      });

      showToast({
        type: 'success',
        title: '¡Pago Procesado con Éxito!',
        message: `Se han añadido ${selectedPackForPayment.credits} créditos a tu billetera.`,
      });

      setShowPaymentGatewayModal(false);
      setSelectedPackForPayment(null);
      refetch();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al procesar el pago en la pasarela.';
      showToast({
        type: 'error',
        title: 'Fallo en la Pasarela de Pago',
        message: msg,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Solicitar retiro de fondos
  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0 || !payoutIban) {
      showToast({
        type: 'error',
        title: 'Datos Requeridos',
        message: 'Por favor ingresa un monto válido y tu IBAN bancario.',
      });
      return;
    }

    if (wallet && amount > Number(wallet.fiatAvailableBalance)) {
      showToast({
        type: 'error',
        title: 'Saldo Insuficiente',
        message: 'El monto a retirar supera tu saldo disponible.',
      });
      return;
    }

    try {
      setIsWithdrawing(true);
      await api.post('/wallet/request-payout', {
        amount,
        destinationAccount: payoutIban,
      });

      showToast({
        type: 'success',
        title: '¡Retiro Solicitado!',
        message: `Tu solicitud de transferencia de ${amount} € está en proceso.`,
      });

      setShowPayoutModal(false);
      setPayoutAmount('');
      setPayoutIban('');
      refetch();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al solicitar el retiro.';
      showToast({
        type: 'error',
        title: 'Error de Retiro',
        message: msg,
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top + 8, 16),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color="#111813" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Billetera & Créditos</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Balances Card */}
        <View style={styles.balancesCard}>
          {/* Créditos de Contacto */}
          <View style={styles.balanceColumn}>
            <View style={styles.balanceHeaderRow}>
              <Coins size={18} color="#D97706" />
              <Text style={styles.balanceLabel}>Créditos Disponibles</Text>
            </View>
            <Text style={styles.creditValueText}>
              {isLoadingWallet ? '...' : wallet?.creditBalance ?? 0}
            </Text>
            <Text style={styles.balanceSubtext}>
              Para responder solicitudes de clientes
            </Text>
          </View>

          <View style={styles.balanceDivider} />

          {/* Saldo Fiat de Trabajos */}
          <View style={styles.balanceColumn}>
            <View style={styles.balanceHeaderRow}>
              <DollarSign size={18} color="#059669" />
              <Text style={styles.balanceLabel}>Ganancias Disponibles</Text>
            </View>
            <Text style={styles.fiatValueText}>
              {isLoadingWallet
                ? '...'
                : `${Number(wallet?.fiatAvailableBalance || 0).toFixed(2)} €`}
            </Text>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => setShowPayoutModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.withdrawBtnText}>Retirar a Banco</Text>
              <ArrowUpRight size={14} color="#111813" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Credit Packages Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Comprar Paquetes de Créditos</Text>
          <Text style={styles.sectionSubtitle}>
            Procesado a través de pasarela de pago segura con garantía SSL
          </Text>
        </View>

        {isLoadingPackages ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginVertical: 20 }}
          />
        ) : (
          <View style={styles.packagesGrid}>
            {packages.map((pack) => (
              <View
                key={pack.id}
                style={[
                  styles.packageCard,
                  pack.popular && styles.packageCardPopular,
                ]}
              >
                {pack.popular && (
                  <View style={styles.popularBadge}>
                    <Sparkles size={12} color="#FFFFFF" />
                    <Text style={styles.popularBadgeText}>MÁS POPULAR</Text>
                  </View>
                )}

                <View style={styles.packageTopRow}>
                  <Text style={styles.packageName}>{pack.name}</Text>
                  {pack.discount && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-{pack.discount}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.creditsRow}>
                  <Coins size={20} color="#D97706" />
                  <Text style={styles.creditsNumber}>{pack.credits}</Text>
                  <Text style={styles.creditsUnit}>créditos</Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.priceNumber}>{pack.price.toFixed(2)} €</Text>
                  <Text style={styles.priceVat}>IVA incl.</Text>
                </View>

                <AppButton
                  title={`Pagar ${pack.price.toFixed(2)} €`}
                  onPress={() => handleOpenPaymentGateway(pack)}
                  leftIcon={<CreditCard size={15} color="#FFFFFF" />}
                  containerStyle={{ marginTop: 12 }}
                />
              </View>
            ))}
          </View>
        )}

        {/* Transacciones Recientes */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Movimientos de Billetera</Text>
          <Text style={styles.sectionSubtitle}>
            Historial de compras, recargas y retiros
          </Text>
        </View>

        {wallet?.transactions && wallet.transactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {wallet.transactions.map((tx) => (
              <View key={tx.id} style={styles.transactionRow}>
                <View style={styles.txIconCircle}>
                  <History size={16} color="#111813" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txTitle}>
                    {tx.type === 'CREDIT_PURCHASE'
                      ? 'Compra de Créditos'
                      : tx.type === 'LEAD_UNLOCK'
                      ? 'Desbloqueo de Solicitud'
                      : tx.type === 'PAYOUT_WITHDRAWAL'
                      ? 'Retiro a Cuenta Bancaria'
                      : tx.type}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.txAmount,
                      tx.amount > 0 ? styles.txPositive : styles.txNegative,
                    ]}
                  >
                    {tx.amount > 0 ? `+${tx.amount} €` : `${tx.amount} €`}
                  </Text>
                  {tx.creditAmount && (
                    <Text style={styles.txCredits}>
                      +{tx.creditAmount} cr.
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyTxBox}>
            <Text style={styles.emptyTxText}>No hay transacciones registradas aún</Text>
          </View>
        )}
      </ScrollView>

      {/* ============================================================
          MODAL DE PASARELA DE PAGOS SEGURA (STRIPE / ESCROW)
      ============================================================ */}
      <Modal
        visible={showPaymentGatewayModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPaymentGatewayModal(false)}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Lock size={18} color="#059669" />
                  <Text style={styles.modalTitle}>Pasarela de Pago Segura</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowPaymentGatewayModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color="#111813" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Resumen del Paquete */}
                {selectedPackForPayment && (
                  <View style={styles.checkoutSummaryCard}>
                    <View>
                      <Text style={styles.checkoutPackTitle}>
                        {selectedPackForPayment.name}
                      </Text>
                      <Text style={styles.checkoutPackSubtitle}>
                        +{selectedPackForPayment.credits} Créditos para contactar clientes
                      </Text>
                    </View>
                    <Text style={styles.checkoutPrice}>
                      {selectedPackForPayment.price.toFixed(2)} €
                    </Text>
                  </View>
                )}

                {/* Formulario de Tarjeta Bancaria */}
                <View style={styles.cardForm}>
                  <Text style={styles.cardFormLabel}>Datos de Tarjeta Bancaria</Text>

                  <AppInput
                    label="Número de Tarjeta"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    leftIcon={<CreditCard size={16} color="#6C756F" />}
                  />

                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <AppInput
                        label="Caducidad"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChangeText={setCardExpiry}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppInput
                        label="CVC / CVV"
                        placeholder="123"
                        secureTextEntry
                        value={cardCvc}
                        onChangeText={setCardCvc}
                      />
                    </View>
                  </View>

                  <AppInput
                    label="Titular de la Tarjeta"
                    placeholder="Nombre completo"
                    value={cardHolder}
                    onChangeText={setCardHolder}
                  />
                </View>

                {/* Badge de Seguridad SSL */}
                <View style={styles.sslSecurityBadge}>
                  <ShieldCheck size={18} color="#059669" />
                  <Text style={styles.sslSecurityText}>
                    Pago encriptado SSL de 256 bits procesado a través de pasarela bancaria oficial.
                  </Text>
                </View>

                <AppButton
                  title={`Confirmar Pago de ${selectedPackForPayment?.price.toFixed(2)} €`}
                  onPress={handleProcessPayment}
                  isLoading={isProcessingPayment}
                  leftIcon={<Lock size={16} color="#FFFFFF" />}
                  containerStyle={{ marginTop: 14 }}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ============================================================
          MODAL DE SOLICITUD DE RETIRO DE FONDOS
      ============================================================ */}
      <Modal
        visible={showPayoutModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPayoutModal(false)}
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
                <Text style={styles.modalTitle}>Retirar Fondos a Banco</Text>
                <TouchableOpacity
                  onPress={() => setShowPayoutModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color="#111813" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <AppInput
                  label="Cantidad a Retirar (€)"
                  placeholder="Ej. 150.00"
                  keyboardType="numeric"
                  value={payoutAmount}
                  onChangeText={setPayoutAmount}
                />

                <AppInput
                  label="Número de Cuenta / IBAN"
                  placeholder="ES91 2100 0418 4502 0005 1332"
                  autoCapitalize="characters"
                  value={payoutIban}
                  onChangeText={setPayoutIban}
                />

                <AppButton
                  title="Solicitar Transferencia"
                  onPress={handleRequestPayout}
                  isLoading={isWithdrawing}
                  containerStyle={{ marginTop: 14 }}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2D5',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111813',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },
  balancesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    padding: 20,
    marginBottom: 20,
    ...Shadows.subtle,
  },
  balanceColumn: {
    paddingVertical: 6,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111813',
  },
  creditValueText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: -0.5,
  },
  fiatValueText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.5,
  },
  balanceSubtext: {
    fontSize: 11,
    color: '#6C756F',
    marginTop: 2,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: '#F5ECE3',
    marginVertical: 14,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5ECE3',
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 6,
  },
  withdrawBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111813',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111813',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6C756F',
    marginTop: 2,
  },
  packagesGrid: {
    gap: 12,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    padding: 18,
    position: 'relative',
    ...Shadows.subtle,
  },
  packageCardPopular: {
    borderColor: '#111813',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111813',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  packageTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111813',
  },
  discountBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  creditsNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111813',
  },
  creditsUnit: {
    fontSize: 13,
    color: '#6C756F',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111813',
  },
  priceVat: {
    fontSize: 10,
    color: '#8E9892',
  },
  transactionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    padding: 8,
    ...Shadows.subtle,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE3',
    gap: 12,
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111813',
  },
  txDate: {
    fontSize: 11,
    color: '#8E9892',
    marginTop: 1,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txPositive: {
    color: '#059669',
  },
  txNegative: {
    color: '#111813',
  },
  txCredits: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
  },
  emptyTxBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    padding: 24,
    alignItems: 'center',
  },
  emptyTxText: {
    fontSize: 13,
    color: '#8E9892',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
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
  checkoutSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5ECE3',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  checkoutPackTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111813',
  },
  checkoutPackSubtitle: {
    fontSize: 12,
    color: '#6C756F',
    marginTop: 2,
  },
  checkoutPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111813',
  },
  cardForm: {
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    padding: 16,
    marginBottom: 14,
  },
  cardFormLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111813',
    marginBottom: 12,
  },
  sslSecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  sslSecurityText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 15,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
