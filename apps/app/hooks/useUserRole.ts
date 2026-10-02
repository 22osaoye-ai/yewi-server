import { useAuthStore, UserProfile } from '@/store/useAuthStore';

/**
 * Determinación exhaustiva y unificada del rol del usuario.
 * Garantiza que cualquier usuario registrado o marcado como profesional
 * sea reconocido de forma consistente en todas las pantallas.
 */
export function isUserProfessional(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return Boolean(
    user.isPro === true ||
    Boolean(user.professionalProfile) ||
    user.roles?.some((r: any) => String(r).toUpperCase().includes('PRO')) ||
    (user as any).role === 'PROFESSIONAL' ||
    (user as any).userType === 'PROFESSIONAL' ||
    (user as any).isSeller === true
  );
}

export function useUserRole() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isProfessional = isUserProfessional(user);
  const isClient = !isProfessional;

  return {
    user,
    isAuthenticated,
    isProfessional,
    isClient,
  };
}
