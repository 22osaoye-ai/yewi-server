export type UserRole = 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  bio?: string;
  country?: string;
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  businessName?: string;
  bio?: string;
  hourlyRate?: number;
  serviceRadiusKm: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  postalCode?: string;
  skills: string[];
  kycStatus: 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  categories: Category[];
  portfolioItems?: PortfolioItem[];
  distanceKm?: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
}

export interface User {
  id: string;
  email: string;
  roles: UserRole[];
  profile?: UserProfile;
  professionalProfile?: ProfessionalProfile;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  baseLeadCreditCost: number;
  subcategories?: Category[];
}

export type GigTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface GigPackage {
  id: string;
  tier: GigTier;
  name?: string;
  title?: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  features?: any;
}

export interface GigExtra {
  id: string;
  title: string;
  description: string;
  price: number;
  extraDays: number;
}

export interface Gig {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  coverImages?: string[];
  galleryImages?: string[];
  startingPrice?: number;
  ratingAvg?: number;
  ratingCount?: number;
  totalReviews?: number;
  category?: Category;
  professional?: {
    businessName?: string;
    user?: {
      profile?: UserProfile;
    };
  };
  packages?: GigPackage[];
  extras?: GigExtra[];
}

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: Category;
  budgetMin?: number;
  budgetMax?: number;
  isUrgent: boolean;
  city: string;
  postalCode: string;
  creditCost: number;
  unlocksCount: number;
  maxUnlocks: number;
  remainingUnlocks: number;
  distanceKm?: number;
  isWithinProRadius: boolean;
  isUnlockedByMe: boolean;
  createdAt: string;
  client: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

export interface QuoteProposal {
  id: string;
  price: number;
  estimatedDays: number;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  professionalProfile?: {
    businessName?: string;
    user?: {
      profile?: UserProfile;
    };
  };
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: 'GIG_PURCHASE' | 'LEAD_CONTRACT';
  status: 'PENDING_REQUIREMENTS' | 'IN_PROGRESS' | 'DELIVERED' | 'REVISION_REQUESTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  escrowStatus: 'HELD' | 'RELEASED' | 'REFUNDED';
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  proEarnings: number;
  deliveryDeadline?: string;
  gigPackage?: GigPackage;
  createdAt: string;
}

export interface Wallet {
  id: string;
  creditBalance: number;
  fiatAvailableBalance: number;
  fiatPendingBalance: number;
}

export interface CreditPackageItem {
  id: string;
  name: string;
  credits: number;
  price: number;
  discount?: string;
  popular?: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  senderId: string;
  type?: string;
  content: string;
  isSensitiveMasked?: boolean;
  attachments?: string[];
  createdAt: string;
  sender?: {
    id: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
    };
  };
}
