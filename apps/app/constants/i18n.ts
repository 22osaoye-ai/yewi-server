import { SupportedLanguage } from '@/store/usePreferencesStore';

export const translations = {
  es: {
    // Tabs
    tabHome: 'Inicio',
    tabSearch: 'Buscar',
    tabRequests: 'Solicitudes',
    tabFavorites: 'Guardados',
    tabProfile: 'Perfil',

    // Common & Alerts
    accept: 'De acuerdo',
    confirm: 'Aceptar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    error: 'Error',
    success: 'Éxito',
    loading: 'Cargando...',
    retry: 'Reintentar',
    next: 'Continuar →',
    back: 'Atrás',
    save: 'Guardar Cambios',
    savedListsEmpty: 'No tienes servicios guardados',

    // Notifications Screen
    notificationsTitle: 'Notificaciones',
    markAllRead: 'Marcar todas leídas',
    noNotificationsTitle: 'Sin notificaciones',
    noNotificationsDesc: 'Te avisaremos cuando tengas presupuestos, mensajes o novedades sobre tus servicios.',

    // Vouchers & Promos
    vouchersTitle: 'Cupones y Promociones',
    featuredPromosTitle: 'Promociones Destacadas',
    featuredPromosDesc: 'Descuentos exclusivos de profesionales verificados en Yewi',
    creditVouchersTitle: 'Vales de Crédito y Descuento',
    creditVouchersDesc: 'Canjea tus créditos acumulados en servicios seleccionados',
    requestService: 'Solicitar',

    // Subscription & Pro Modal
    pricingTitle: 'Planes y Precios',
    yewiProTitle: 'Yewi Pro',
    yewiProActive: 'Yewi Pro Activo',
    planProBadge: 'Plan Pro •',
    proPriceMonthly: '9,99 €',
    proPerMonth: '/ mes (EUR)',
    proBilledMonthly: 'facturación mensual sin permanencia',
    proPitch: 'Acceso prioritario a solicitudes, contacto directo de clientes y captación de trabajos en todo tu país.',
    subscribeBtn: 'Suscribirme por 9,99 € / mes',
    manageSubBtn: 'Gestionar Suscripción',
    cancelAnytimeNote: 'Cancela en cualquier momento sin permanencia. Pago seguro vía Stripe.',
    paymentErrorTitle: 'Error en el pago',
    paymentSuccessTitle: '¡Verificación de Suscripción!',
    paymentSuccessMsg: 'Estamos sincronizando tu estado Pro. Tus ventajas se activarán automáticamente.',

    // Profile Screen
    online: 'En línea',
    offline: 'Desconectado',
    verifiedPro: 'Profesional Verificado',
    client: 'Cliente',
    vipMember: 'Miembro VIP',

    // Section 1
    sectionActivity: 'Mi Actividad',
    itemSaved: 'Guardados',
    itemInterests: 'Intereses',
    itemInvite: 'Invitar amigos',

    // Section 2
    sectionAccount: 'Cuenta',
    itemPreferences: 'Preferencias',
    itemAccount: 'Mi Cuenta',

    // Section 3
    sectionResources: 'Recursos',
    itemSupport: 'Soporte',
    itemLegal: 'Términos y privacidad',
    itemSeller: 'Vender en Yewi',
    itemSellerActive: 'Modo Profesional (Activo ✓)',

    // Preferences Screen
    preferencesTitle: 'Preferencias',
    systemSettings: 'Ajustes del Sistema',
    pushNotifications: 'Notificaciones Push',
    pushNotificationsDesc: 'Alertas de presupuestos, pedidos y mensajes',
    darkMode: 'Modo Oscuro',
    darkModeDesc: 'Apariencia de alto contraste y ahorro de energía',
    currency: 'Moneda',
    currencyDesc: 'Precios de servicios y presupuestos',
    language: 'Idioma',
    languageDesc: 'Idioma de la interfaz de usuario',
    selectCurrency: 'Seleccionar Moneda',
    selectLanguage: 'Seleccionar Idioma',

    // Support & Legal
    supportTitle: 'Soporte',
    legalTitle: 'Términos y Privacidad',
    needHelp: '¿Necesitas ayuda personalizada?',
    supportEmailBtn: 'Contactar con Soporte (soporte@yewi.es)',
    faqs: 'Preguntas Frecuentes',

    // Requests & Leads Screen
    requestsTitle: 'Solicitudes y Trabajos',
    myRequestsTab: 'Mis Solicitudes',
    jobOffersTab: 'Oportunidades',
    publishRequestBtn: '+ Publicar Solicitud',
    publishRequestModalTitle: 'Publicar Solicitud de Servicio',
    requestTitleLabel: 'Título del trabajo o reforma *',
    requestCategoryLabel: 'Categoría del servicio *',
    requestDescLabel: 'Descripción detallada de la necesidad *',
    requestBudgetLabel: 'Presupuesto estimado (€)',
    requestCityLabel: 'Localidad / Municipio *',
    requestPostalCodeLabel: 'Código Postal *',
    publishBtn: 'Publicar Solicitud →',
    noRequestsTitle: 'Sin solicitudes activas',
    noRequestsDesc: 'Publica una solicitud para recibir presupuestos de profesionales verificados en tu zona.',
    noLeadsTitle: 'Sin oportunidades en tu zona',
    noLeadsDesc: 'Te avisaremos cuando los clientes de tu área publiquen trabajos de tus especialidades.',

    // Seller Modal
    becomeSellerTitle: 'Registro Profesional',
    becomeSellerSubtitle: 'Completa tus datos profesionales para recibir solicitudes de trabajo en tu zona.',
    stepCompany: 'Empresa o Autónomo',
    stepServices: 'Especialidades',
    stepLocation: 'Ubicación Profesional',
    businessName: 'Nombre comercial o Razón social *',
    taxId: 'NIF / CIF de la empresa *',
    hourlyRate: 'Tarifa orientativa por hora (€/h)',
    serviceRadius: 'Radio de cobertura del servicio (Km)',
    activateProBtn: 'Activar cuenta',

    // Auth
    loginTitle: 'Iniciar Sesión',
    registerTitle: 'Crear Cuenta',
    completeProfileTitle: 'Completar Perfil',
  },
  en: {
    // Tabs
    tabHome: 'Home',
    tabSearch: 'Search',
    tabRequests: 'Requests',
    tabFavorites: 'Saved',
    tabProfile: 'Profile',

    // Common & Alerts
    accept: 'I agree',
    confirm: 'Accept',
    cancel: 'Cancel',
    close: 'Close',
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
    retry: 'Retry',
    next: 'Continue →',
    back: 'Back',
    save: 'Save Changes',
    savedListsEmpty: 'No saved services yet',

    // Notifications Screen
    notificationsTitle: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotificationsTitle: 'No notifications',
    noNotificationsDesc: 'We will notify you when you have quotes, messages or updates about your services.',

    // Vouchers & Promos
    vouchersTitle: 'Coupons & Promos',
    featuredPromosTitle: 'Featured Deals',
    featuredPromosDesc: 'Exclusive discounts from verified professionals on Yewi',
    creditVouchersTitle: 'Credit & Discount Vouchers',
    creditVouchersDesc: 'Redeem your accumulated credits on selected services',
    requestService: 'Request',

    // Subscription & Pro Modal
    pricingTitle: 'Plans & Pricing',
    yewiProTitle: 'Yewi Pro',
    yewiProActive: 'Yewi Pro Active',
    planProBadge: 'Pro Plan •',
    proPriceMonthly: '9.99 €',
    proPerMonth: '/ month (EUR)',
    proBilledMonthly: 'monthly billing, cancel anytime',
    proPitch: 'Priority access to requests, direct client contact, and job leads across your entire country.',
    subscribeBtn: 'Subscribe for 9.99 € / month',
    manageSubBtn: 'Manage Subscription',
    cancelAnytimeNote: 'Cancel anytime with no lock-in. Secure payment via Stripe.',
    paymentErrorTitle: 'Payment Error',
    paymentSuccessTitle: 'Subscription Verification!',
    paymentSuccessMsg: 'We are syncing your Pro status. Your benefits will activate automatically.',

    // Profile Screen
    online: 'Online',
    offline: 'Offline',
    verifiedPro: 'Verified Professional',
    client: 'Client',
    vipMember: 'VIP Member',

    // Section 1
    sectionActivity: 'My Activity',
    itemSaved: 'Saved',
    itemInterests: 'Interests',
    itemInvite: 'Invite friends',

    // Section 2
    sectionAccount: 'Account',
    itemPreferences: 'Preferences',
    itemAccount: 'My Account',

    // Section 3
    sectionResources: 'Resources',
    itemSupport: 'Support',
    itemLegal: 'Terms & Privacy',
    itemSeller: 'Sell on Yewi',
    itemSellerActive: 'Professional Mode (Active ✓)',

    // Preferences Screen
    preferencesTitle: 'Preferences',
    systemSettings: 'System Settings',
    pushNotifications: 'Push Notifications',
    pushNotificationsDesc: 'Alerts for quotes, orders and messages',
    darkMode: 'Dark Mode',
    darkModeDesc: 'High contrast appearance and power saving',
    currency: 'Currency',
    currencyDesc: 'Service prices and quotes currency',
    language: 'Language',
    languageDesc: 'User interface language',
    selectCurrency: 'Select Currency',
    selectLanguage: 'Select Language',

    // Support & Legal
    supportTitle: 'Support',
    legalTitle: 'Terms & Privacy',
    needHelp: 'Need personal assistance?',
    supportEmailBtn: 'Contact Support (soporte@yewi.es)',
    faqs: 'Frequently Asked Questions',

    // Requests & Leads Screen
    requestsTitle: 'Requests & Jobs',
    myRequestsTab: 'My Requests',
    jobOffersTab: 'Job Leads',
    publishRequestBtn: '+ Post Request',
    publishRequestModalTitle: 'Post a Service Request',
    requestTitleLabel: 'Job or project title *',
    requestCategoryLabel: 'Service category *',
    requestDescLabel: 'Detailed description *',
    requestBudgetLabel: 'Estimated budget (€)',
    requestCityLabel: 'City / Municipality *',
    requestPostalCodeLabel: 'Postal code *',
    publishBtn: 'Post Request →',
    noRequestsTitle: 'No active requests',
    noRequestsDesc: 'Post a request to receive quotes from verified professionals in your area.',
    noLeadsTitle: 'No job leads in your area',
    noLeadsDesc: 'We will notify you as soon as clients in your area post jobs matching your specialties.',

    // Seller Modal
    becomeSellerTitle: 'Professional Registration',
    becomeSellerSubtitle: 'Complete your business profile to start receiving service requests in your area.',
    stepCompany: 'Business Details',
    stepServices: 'Specialties',
    stepLocation: 'Business Location',
    businessName: 'Company or Trade Name *',
    taxId: 'Tax ID / VAT Number (NIF/CIF) *',
    hourlyRate: 'Estimated Hourly Rate (€/h)',
    serviceRadius: 'Service Radius (Km)',
    activateProBtn: 'Activate account',

    // Auth
    loginTitle: 'Log In',
    registerTitle: 'Create Account',
    completeProfileTitle: 'Complete Profile',
  },
};

export function getTranslation(lang: SupportedLanguage = 'es') {
  return translations[lang] || translations.es;
}
