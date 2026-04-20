export type UserRole = 'DONOR' | 'RECIPIENT' | 'ADMIN';

export type FoodCategory =
  | 'COOKED_MEAL' | 'RAW_PRODUCE' | 'PACKAGED_FOOD'
  | 'BAKERY' | 'DAIRY' | 'BEVERAGES' | 'OTHER';

export type ListingStatus = 'AVAILABLE' | 'CLAIMED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
export type ClaimStatus   = 'PENDING' | 'CONFIRMED' | 'PICKED_UP' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  organization?: string;
  isActive: boolean;
  createdAt: string;
  unreadNotificationCount?: number;
}

export interface FoodListing {
  id: string;
  title: string;
  description?: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  expiresAt: string;
  status: ListingStatus;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  createdAt: string;
  donor: User;
  claims?: Claim[];
  distanceKm?: number;
}

export interface Claim {
  id: string;
  status: ClaimStatus;
  quantity: number;
  notes?: string;
  scheduledAt?: string;
  pickedUpAt?: string;
  createdAt: string;
  listing: FoodListing;
  recipient: User;
}

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  listing?: FoodListing;
}

export interface AdminStats {
  totalListings: number;
  activeListings: number;
  totalClaims: number;
  completedClaims: number;
  totalUsers: number;
  wasteReducedKg: number;
  topDonors: User[];
}

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  COOKED_MEAL:    'Cooked Meal',
  RAW_PRODUCE:    'Raw Produce',
  PACKAGED_FOOD:  'Packaged Food',
  BAKERY:         'Bakery',
  DAIRY:          'Dairy',
  BEVERAGES:      'Beverages',
  OTHER:          'Other',
};

export const CATEGORY_EMOJI: Record<FoodCategory, string> = {
  COOKED_MEAL:    '🍱',
  RAW_PRODUCE:    '🥦',
  PACKAGED_FOOD:  '📦',
  BAKERY:         '🍞',
  DAIRY:          '🥛',
  BEVERAGES:      '🧃',
  OTHER:          '🍽️',
};
