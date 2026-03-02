// Enums
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELED';
export type ReviewType = 'REVIEW_PROVIDER';
export type SubscriptionStatus = 'FREE' | 'PRO' | 'CANCELED';
export type BusinessTier = 'STARTER' | 'PRO' | 'PREMIUM';

// User
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
  createdAt: string;
}

// Category
export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children?: Category[];
  _count?: { businessServices: number };
}

// Booking
export interface Booking {
  id: string;
  businessServiceId: string;
  businessService?: BusinessService & {
    business?: Business;
  };
  employeeId: string;
  employee?: Employee;
  requesterId: string;
  requester?: {
    id: string;
    name?: string;
  };
  providerId: string;
  provider?: {
    id: string;
    name?: string;
  };
  status: BookingStatus;
  agreedPriceCents?: number;
  scheduledAt?: string;
  scheduledEndAt?: string;
  completedAt?: string;
  notes?: string;
  rejectionMessage?: string;
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
}

// Review
export interface Review {
  id: string;
  bookingId: string;
  authorId: string;
  author?: {
    id: string;
    name?: string;
  };
  targetUserId: string;
  type: ReviewType;
  score: number;
  comment?: string;
  reply?: string;
  repliedAt?: string;
  booking?: {
    businessService?: { name: string };
    employee?: { firstName: string; lastName: string };
  };
  createdAt: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Business
export interface Business {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  presentation?: string;
  categoryId?: string;
  category?: Category;
  logoUrl?: string;
  coverUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  subscriptionTier: BusinessTier;
  subscriptionStatus: SubscriptionStatus;
  isVerified: boolean;
  isActive: boolean;
  isEarlyAdopter: boolean;
  acceptsOnlineBooking: boolean;
  autoAcceptBookings: boolean;
  isOnVacation: boolean;
  vacationMessage?: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name?: string;
  };
  employees?: Employee[];
  services?: BusinessService[];
  hours?: BusinessHours[];
  categories?: BusinessCategory[];
  images?: BusinessImage[];
  promotions?: BusinessPromotion[];
  _count?: {
    employees: number;
    services: number;
  };
  distance?: number;
}

export interface BusinessService {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  detailedDescription?: string;
  priceCents: number;
  currency: string;
  durationMinutes: number;
  categoryId?: string;
  category?: Category;
  businessCategoryId?: string;
  businessCategory?: BusinessCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  employees?: { employee: Employee }[];
}

export interface Employee {
  id: string;
  businessId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  availabilities?: EmployeeAvailability[];
  services?: { businessService: BusinessService }[];
}

export interface EmployeeAvailability {
  id: string;
  employeeId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface BusinessHours {
  id: string;
  businessId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isClosed: boolean;
}

export interface BusinessCategory {
  id: string;
  businessId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    services: number;
  };
}

export interface BusinessImage {
  id: string;
  businessId: string;
  url: string;
  sortOrder: number;
  createdAt: string;
}

export interface BusinessPromotion {
  id: string;
  businessId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Client Management
export type ClientTrustLevel = 'fiable' | 'peu_fiable' | 'attention';

export interface BusinessClient {
  id: string;
  businessId: string;
  userId: string;
  isBlocked: boolean;
  notes?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };
  stats?: ClientStats;
}

export interface ClientStats {
  totalBookings: number;
  completedBookings: number;
  canceledByClient: number;
  totalRevenueCents: number;
  servicesUsed: string[];
  completionRate: number;
  trustLevel: ClientTrustLevel;
  lastBookingAt: string | null;
}

// Notifications
export type NotificationType =
  | 'BOOKING_NEW'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELED'
  | 'BOOKING_COMPLETED'
  | 'REVIEW_RECEIVED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: string;
  isRead: boolean;
  createdAt: string;
}
