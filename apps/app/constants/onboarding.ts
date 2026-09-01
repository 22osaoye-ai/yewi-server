import { OnboardingSlide } from '@/types/onboarding';

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 0,
    tag: 'Comunidad Yewi',
    title1: 'Tu Hogar y',
    title2: 'Tu Talento,',
    title3: 'Unidos',
    badge: 'Conexión Directa',
    headline: 'Conectamos Personas & Profesionales',
    description:
      'Transforma tu espacio trabajando con los mejores autónomos e interioristas de tu zona.',
    features: ['✓ Profesionales Verificados', '✓ Respuestas en <24h', '✓ Presupuestos Gratis'],
    iconName: 'people-outline',
  },
  {
    id: 1,
    tag: 'Autónomos & Freelancers',
    title1: 'Haz Crecer',
    title2: 'Tu Negocio',
    title3: 'Sin Límites',
    badge: 'Más Clientes Directos',
    headline: 'Ofrece tus Servicios & Sé Conocido',
    description:
      'Consigue solicitudes de clientes en tu ciudad y haz crecer tu reputación profesional.',
    features: ['✓ Visibilidad Local', '✓ Cobros Directos', '✓ Clientes Reales'],
    iconName: 'trending-up-outline',
  },
  {
    id: 2,
    tag: 'Excelencia & Seguridad',
    title1: 'Donde la',
    title2: 'Calidad Es',
    title3: 'Garantía',
    badge: '100% Protegido',
    headline: 'Calidad de Trabajo & Pagos Seguros',
    description:
      'Pagos en depósito seguro (Escrow) y valoraciones reales para máxima confianza.',
    features: ['✓ Fianza Escrow Protegida', '✓ Soporte Directo 24/7', '✓ Garantía Yewi'],
    iconName: 'shield-checkmark-outline',
  },
];
