// Enums
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
export type CalendarEntryKind = 'APPOINTMENT' | 'BLOCK';
export type BlockReason = 'BREAK' | 'UNAVAILABLE' | 'PERSONAL' | 'CLOSED';
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
  businessServiceId?: string;
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
  kind?: CalendarEntryKind;
  blockReason?: BlockReason | null;
  options?: BookingOption[];
  invoice?: {
    id: string;
    status: InvoiceStatus;
    emailSentAt?: string | null;
    invoiceNumber?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// Calendar entry (booking with guaranteed time fields)
export interface CalendarEntry extends Omit<Booking, 'employee' | 'scheduledAt' | 'scheduledEndAt' | 'kind'> {
  scheduledAt: string;
  scheduledEndAt: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  kind: CalendarEntryKind;
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
  options?: ServiceOption[];
}

export interface ServiceOption {
  id: string;
  businessCategoryId: string;
  name: string;
  description?: string;
  priceCents: number;
  durationMinutes?: number | null;
  groupName?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingOption {
  id: string;
  bookingId: string;
  serviceOptionId?: string | null;
  name: string;
  priceCents: number;
  createdAt: string;
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

// Booking Notes
export type NoteVisibility = 'PRIVATE_BUSINESS';

export interface BookingNote {
  id: string;
  businessId: string;
  clientId: string;
  bookingId: string;
  createdByUserId: string;
  visibility: NoteVisibility;
  content: string;
  structured?: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  booking?: {
    businessService?: { name: string };
    employee?: { firstName: string; lastName: string };
    scheduledAt?: string;
  };
  createdBy?: { id: string; name?: string };
}

// Billing & Invoicing
export type VatMode = 'FRANCHISE_293B' | 'STANDARD';
export type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'CANCELLED';
export type InvoiceLineKind = 'SERVICE' | 'PRODUCT' | 'OTHER';

export interface BusinessBillingSettings {
  id: string;
  businessId: string;
  legalName: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  country: string;
  siret: string;
  vatNumber?: string;
  vatMode: VatMode;
  invoicePrefix: string;
  nextInvoiceSequence: number;
  logoKey?: string;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  kind: InvoiceLineKind;
  label: string;
  quantity: number;
  unitPriceHTCents: number;
  vatRate: number;
  totalHTCents: number;
  totalVATCents: number;
  totalTTCCents: number;
  sortOrder: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  clientId?: string;
  bookingId?: string;
  status: InvoiceStatus;
  invoiceNumber?: string;
  issueDate?: string;
  serviceDate?: string;
  currency: string;
  totalHTCents: number;
  totalVATCents: number;
  totalTTCCents: number;
  vatMode: VatMode;
  snapshot?: Record<string, unknown>;
  pdfKey?: string;
  emailSentAt?: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  lines?: InvoiceLine[];
  client?: { id: string; name?: string; email: string };
  booking?: {
    businessService?: { name: string };
    employee?: { firstName: string; lastName: string };
  };
  createdBy?: { id: string; name?: string };
}

// Invoice Batch
export interface BatchPreviewBooking {
  id: string;
  clientName: string;
  serviceName: string;
  scheduledAt: string;
  priceCents: number;
}

export interface BatchPreviewResult {
  count: number;
  bookings: BatchPreviewBooking[];
}

export interface BatchProgress {
  current: number;
  total: number;
  currentClient: string;
  phase: 'creating' | 'done' | 'error';
}

export interface BatchResult {
  generatedCount: number;
  totalHTCents: number;
  totalVATCents: number;
  totalTTCCents: number;
  invoiceIds: string[];
  errors: string[];
  batchId?: string;
}

export type BatchGenerationStatus = 'COMPLETED' | 'FAILED';

export interface BatchGeneration {
  id: string;
  businessId: string;
  status: BatchGenerationStatus;
  startDate: string;
  endDate: string;
  invoiceCount: number;
  totalHTCents: number;
  totalVATCents: number;
  totalTTCCents: number;
  invoiceIds: string[];
  errors: string[];
  createdAt: string;
  createdBy?: { id: string; name?: string };
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

// Referrals
export type ReferralStatus = 'PENDING' | 'VALIDATED' | 'REJECTED';

export interface Referral {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  instagram: string;
  phone: string;
  status: ReferralStatus;
  notes?: string | null;
  rewardGrantedAt?: string | null;
  validatedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyReferralsResponse {
  data: Referral[];
  freeMonthsEarned: number;
  validatedTowardNext: number;
  nextRewardThreshold: number;
}

export interface AdminReferralBusinessRow {
  businessId: string;
  businessName: string;
  businessSlug: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  freeMonthsEarned: number;
  totalReferrals: number;
  pendingCount: number;
  validatedCount: number;
  rejectedCount: number;
  lastSubmittedAt: string;
}

export interface AdminReferralBusinessDetail {
  business: {
    id: string;
    name: string;
    slug: string;
    freeMonthsEarned: number;
    owner: { name: string | null; email: string };
  };
  referrals: Referral[];
}
