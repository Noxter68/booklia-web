// Enums
export type ServiceKind = 'OFFER' | 'REQUEST';
export type ServiceStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED';
export type Urgency = 'URGENT' | 'SOON' | 'FLEXIBLE';
export type Recurrence = 'ONE_TIME' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELED';
export type ReviewType = 'REVIEW_PROVIDER' | 'REVIEW_REQUESTER';
export type SubscriptionStatus = 'FREE' | 'PRO' | 'CANCELED';
export type WeekDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type BusinessTier = 'STARTER' | 'PRO' | 'PREMIUM';

// User & Profile
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  subscriptionStatus: SubscriptionStatus;
  createdAt: string;
  profile?: Profile;
  reputation?: UserReputation;
}

export interface Profile {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  images?: PeopleImage[];
}

export interface PeopleImage {
  id: string;
  profileId: string;
  url: string;
  sortOrder: number;
  createdAt: string;
}

export interface UserReputation {
  userId: string;
  elo: number;
  ratingAvg5: number;
  ratingCount: number;
  completedBookings: number;
  lateCancellationCount: number;
}

// Category & Tag
export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children?: Category[];
  _count?: { services: number };
}

export interface Tag {
  id: string;
  name: string;
}

// Service
export type PricingType = 'HOURLY' | 'FIXED';

export interface Service {
  id: string;
  kind: ServiceKind;
  title: string;
  description: string;
  priceCents?: number;
  pricingType?: PricingType;
  currency: string;
  // Duration
  durationMinutes?: number;
  // Availability
  availableDays?: WeekDay[];
  availableFromTime?: string;
  availableToTime?: string;
  availableFromDate?: string;
  availableToDate?: string;
  // Location
  city?: string;
  latitude?: number;
  longitude?: number;
  // Category & Tags
  categoryId?: string;
  category?: Category;
  tags?: { tag: Tag }[];
  createdByUserId: string;
  createdBy?: {
    id: string;
    profile?: {
      displayName?: string;
      avatarUrl?: string;
      city?: string;
      images?: PeopleImage[];
    };
    reputation?: UserReputation;
  };
  status: ServiceStatus;
  deadlineAt?: string;
  expiresAt: string;
  urgency: Urgency;
  isRecurring: boolean;
  recurrence: Recurrence;
  sessionsCount?: number;
  boostedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

// Booking
export interface Booking {
  id: string;
  // P2P booking
  serviceId?: string;
  service?: Service;
  // Business booking
  businessServiceId?: string;
  businessService?: BusinessService & {
    business?: Business;
  };
  employeeId?: string;
  employee?: Employee;
  // Common fields
  requesterId: string;
  requester?: {
    id: string;
    profile?: { displayName?: string; avatarUrl?: string };
  };
  providerId: string;
  provider?: {
    id: string;
    profile?: { displayName?: string; avatarUrl?: string };
  };
  status: BookingStatus;
  agreedPriceCents?: number;
  scheduledAt?: string;
  completedAt?: string;
  notes?: string;
  // P2P contact info
  requesterPhone?: string;
  requesterAddress?: string;
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
    profile?: { displayName?: string; avatarUrl?: string };
  };
  targetUserId: string;
  type: ReviewType;
  score: number;
  comment?: string;
  reply?: string;
  repliedAt?: string;
  booking?: {
    service?: { title: string };
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

export interface SearchFilters {
  q?: string;
  kind?: ServiceKind;
  categoryId?: string;
  subcategoryId?: string;
  priceMin?: number;
  priceMax?: number;
  urgency?: Urgency;
  isRecurring?: boolean;
  city?: string;
  // Geolocation
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
  offset?: number;
}

// Service suggestion for autocomplete
export interface ServiceSuggestion {
  id: string;
  title: string;
  kind: ServiceKind;
  category?: { name: string };
  createdBy?: {
    profile?: { displayName?: string; city?: string };
  };
}

// Business
export interface Business {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
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
  acceptsOnlineBooking: boolean;
  isOnVacation: boolean;
  vacationMessage?: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name?: string;
    reputation?: UserReputation;
  };
  employees?: Employee[];
  services?: BusinessService[];
  hours?: BusinessHours[];
  categories?: BusinessCategory[];
  images?: BusinessImage[];
  _count?: {
    employees: number;
    services: number;
  };
}

export interface BusinessService {
  id: string;
  businessId: string;
  name: string;
  description?: string;
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

// Booking Comments
export interface BookingComment {
  id: string;
  bookingId: string;
  authorId: string;
  content: string;
  author?: {
    id: string;
    profile?: { displayName?: string; avatarUrl?: string };
  };
  createdAt: string;
  updatedAt: string;
}

// Notifications
export type NotificationType =
  | 'BOOKING_NEW'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_COMMENT'
  | 'REVIEW_RECEIVED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: string;
  serviceId?: string;
  isRead: boolean;
  createdAt: string;
}
