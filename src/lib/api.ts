import { translateError } from './error-messages';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;
  private refreshTokenFn: (() => Promise<boolean>) | null = null;
  private isRefreshing = false;
  private refreshQueue: Array<{ resolve: (value: boolean) => void }> = [];

  setToken(token: string | null) {
    this.token = token;
  }

  /** Register a callback to refresh the token (called by AuthClient) */
  setRefreshTokenFn(fn: (() => Promise<boolean>) | null) {
    this.refreshTokenFn = fn;
  }

  /** Wait for an in-flight refresh, or trigger one */
  private async handleTokenRefresh(): Promise<boolean> {
    if (!this.refreshTokenFn) return false;

    // If a refresh is already in progress, queue this request
    if (this.isRefreshing) {
      return new Promise<boolean>((resolve) => {
        this.refreshQueue.push({ resolve });
      });
    }

    this.isRefreshing = true;
    try {
      const success = await this.refreshTokenFn();
      // Resolve all queued requests
      this.refreshQueue.forEach(({ resolve }) => resolve(success));
      this.refreshQueue = [];
      return success;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // On 401, try to refresh token and retry once
    if (response.status === 401 && !isRetry) {
      const refreshed = await this.handleTokenRefresh();
      if (refreshed) {
        return this.request<T>(endpoint, options, true);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = error.message || 'An error occurred';
      throw new Error(translateError(message, response.status));
    }

    return response.json();
  }

  // File upload (doesn't use JSON content-type)
  async uploadFile(file: File, type: 'image' | 'avatar' = 'image'): Promise<{ url: string; key: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}/upload/${type}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    // On 401, try to refresh token and retry once
    if (response.status === 401) {
      const refreshed = await this.handleTokenRefresh();
      if (refreshed) {
        return this.uploadFile(file, type);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  // Download binary file (ZIP, PDF, etc.) with proper auth
  async downloadBlob(url: string): Promise<ArrayBuffer> {
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });

    if (response.status === 401) {
      const refreshed = await this.handleTokenRefresh();
      if (refreshed) {
        return this.downloadBlob(url);
      }
    }

    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement');
    }

    return response.arrayBuffer();
  }

  // Auth
  async getMe() {
    return this.request<import('@/types').User>('/auth/me');
  }

  async verifyEmail(token: string) {
    return this.request<{ success: boolean }>(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean }>('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Bookings

  async getRevenueStats(from: string, to: string) {
    return this.request<{ date: string; revenue: number; count: number }[]>(
      `/bookings/revenue-stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
  }

  async acceptBooking(id: string) {
    return this.request<import('@/types').Booking>(`/bookings/${id}/accept`, {
      method: 'POST',
    });
  }

  async startBooking(id: string) {
    return this.request<import('@/types').Booking>(`/bookings/${id}/start`, {
      method: 'POST',
    });
  }

  async completeBooking(id: string) {
    return this.request<import('@/types').Booking>(`/bookings/${id}/complete`, {
      method: 'POST',
    });
  }

  async cancelBooking(id: string) {
    return this.request<import('@/types').Booking>(`/bookings/${id}/cancel`, {
      method: 'POST',
    });
  }

  async rejectBooking(id: string, message?: string) {
    return this.request<import('@/types').Booking>(`/bookings/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async deleteBooking(id: string) {
    return this.request<{ success: boolean }>(`/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyBookings(role?: 'requester' | 'provider', from?: string, to?: string) {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const queryString = params.toString();
    return this.request<import('@/types').Booking[]>(`/bookings/me${queryString ? `?${queryString}` : ''}`);
  }

  // Reviews
  async createReview(data: {
    bookingId: string;
    type: import('@/types').ReviewType;
    score: number;
    comment?: string;
  }) {
    return this.request<import('@/types').Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserReviews(userId: string) {
    return this.request<import('@/types').Review[]>(`/reviews/user/${userId}`);
  }

  async getBusinessReviews(businessId: string) {
    return this.request<import('@/types').Review[]>(`/reviews/business/${businessId}`);
  }

  async replyToReview(reviewId: string, reply: string) {
    return this.request<import('@/types').Review>(`/reviews/${reviewId}/reply`, {
      method: 'PATCH',
      body: JSON.stringify({ reply }),
    });
  }

  // Categories
  async getCategories() {
    return this.request<import('@/types').Category[]>('/categories');
  }

  // Stripe
  async createSubscription(priceId: string) {
    return this.request<{ url: string }>('/stripe/subscribe', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
  }

  async createBillingPortal() {
    return this.request<{ url: string }>('/stripe/portal', {
      method: 'POST',
    });
  }

  // Business
  async createBusiness(data: {
    name: string;
    description?: string;
    categoryId?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  }) {
    return this.request<import('@/types').Business>('/business', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyBusiness() {
    return this.request<import('@/types').Business>('/business/mine');
  }

  async updateBusiness(data: Partial<import('@/types').Business>) {
    return this.request<import('@/types').Business>('/business', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getBusinessBySlug(slug: string) {
    return this.request<import('@/types').Business>(`/business/${slug}`);
  }

  async getBusinessByOwnerId(userId: string) {
    return this.request<import('@/types').Business | null>(`/business/owner/${userId}`);
  }

  async searchBusinesses(filters: {
    q?: string;
    city?: string;
    categoryId?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'popular' | 'rating' | 'distance';
  }) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    return this.request<import('@/types').PaginatedResponse<import('@/types').Business>>(
      `/business/search?${params}`
    );
  }

  // Business Services
  async createBusinessService(data: {
    name: string;
    description?: string;
    detailedDescription?: string;
    priceCents: number;
    durationMinutes: number;
    categoryId?: string;
    businessCategoryId?: string;
  }) {
    return this.request<import('@/types').BusinessService>('/business/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBusinessService(id: string, data: Partial<import('@/types').BusinessService>) {
    return this.request<import('@/types').BusinessService>(`/business/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBusinessService(id: string) {
    return this.request<{ success: boolean }>(`/business/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Employees
  async createEmployee(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    role?: string;
    bio?: string;
    availabilities?: { dayOfWeek: number; startTime: string; endTime: string }[];
    serviceIds?: string[];
  }) {
    return this.request<import('@/types').Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEmployee(id: string) {
    return this.request<import('@/types').Employee>(`/employees/${id}`);
  }

  async updateEmployee(id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    role?: string;
    bio?: string;
    availabilities?: { dayOfWeek: number; startTime: string; endTime: string }[];
    serviceIds?: string[];
  }) {
    return this.request<import('@/types').Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: string) {
    return this.request<{ success: boolean }>(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  async getEmployeesByBusiness(businessId: string) {
    return this.request<import('@/types').Employee[]>(`/employees/business/${businessId}`);
  }

  async getAvailableSlots(employeeId: string, businessServiceId: string, date: string) {
    const params = new URLSearchParams({
      employeeId,
      businessServiceId,
      date,
    });
    return this.request<{ slots: { time: string; available: boolean }[] }>(
      `/employees/slots?${params}`
    );
  }

  async getAvailableSlotsMultipleDays(
    employeeId: string,
    businessServiceId: string,
    dates: string[]
  ) {
    // Fetch slots for multiple dates in parallel
    const results = await Promise.all(
      dates.map(async (date) => {
        try {
          const result = await this.getAvailableSlots(employeeId, businessServiceId, date);
          return { date, slots: result.slots };
        } catch {
          return { date, slots: [] };
        }
      })
    );
    return results;
  }

  // Business Booking
  async createBusinessBooking(data: {
    businessServiceId: string;
    employeeId: string;
    scheduledAt: string;
    notes?: string;
  }) {
    return this.request<import('@/types').Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Business Hours
  async getBusinessHours(slug: string) {
    return this.request<import('@/types').BusinessHours[]>(`/business/${slug}/hours`);
  }

  async getMyBusinessHours() {
    return this.request<import('@/types').BusinessHours[]>('/business/hours/mine');
  }

  async updateBusinessHours(hours: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isClosed?: boolean;
  }[]) {
    return this.request<import('@/types').BusinessHours[]>('/business/hours', {
      method: 'PUT',
      body: JSON.stringify({ hours }),
    });
  }

  // Business Categories
  async getMyBusinessCategories() {
    return this.request<import('@/types').BusinessCategory[]>('/business/categories/mine');
  }

  async createBusinessCategory(data: { name: string; sortOrder?: number }) {
    return this.request<import('@/types').BusinessCategory>('/business/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBusinessCategory(id: string, data: { name?: string; sortOrder?: number }) {
    return this.request<import('@/types').BusinessCategory>(`/business/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBusinessCategory(id: string) {
    return this.request<{ success: boolean }>(`/business/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Vacation Mode
  async updateVacationMode(isOnVacation: boolean, vacationMessage?: string) {
    return this.request<import('@/types').Business>('/business/vacation', {
      method: 'PUT',
      body: JSON.stringify({ isOnVacation, vacationMessage }),
    });
  }

  // Business Images
  async getMyBusinessImages() {
    return this.request<import('@/types').BusinessImage[]>('/business/images/mine');
  }

  async getBusinessImages(slug: string) {
    return this.request<import('@/types').BusinessImage[]>(`/business/${slug}/images`);
  }

  async addBusinessImage(url: string) {
    return this.request<import('@/types').BusinessImage>('/business/images', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async deleteBusinessImage(id: string) {
    return this.request<{ success: boolean }>(`/business/images/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderBusinessImages(imageIds: string[]) {
    return this.request<import('@/types').BusinessImage[]>('/business/images/reorder', {
      method: 'PUT',
      body: JSON.stringify({ imageIds }),
    });
  }

  // Business Promotions
  async getMyBusinessPromotions() {
    return this.request<import('@/types').BusinessPromotion[]>('/business/promotions/mine');
  }

  async createBusinessPromotion(data: {
    title: string;
    description?: string;
    imageUrl?: string;
    startDate: string;
    endDate: string;
    isActive?: boolean;
  }) {
    return this.request<import('@/types').BusinessPromotion>('/business/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBusinessPromotion(id: string, data: Partial<{
    title: string;
    description: string;
    imageUrl: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>) {
    return this.request<import('@/types').BusinessPromotion>(`/business/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBusinessPromotion(id: string) {
    return this.request<{ success: boolean }>(`/business/promotions/${id}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications(limit = 20) {
    return this.request<{
      notifications: import('@/types').Notification[];
      unreadCount: number;
    }>(`/notifications?limit=${limit}`);
  }

  async getUnreadNotificationsCount() {
    return this.request<{ count: number }>('/notifications/unread-count');
  }

  async markNotificationAsRead(id: string) {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    });
  }

  async deleteNotification(id: string) {
    return this.request<{ success: boolean }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Geocoding
  async searchAddress(query: string, limit = 5) {
    return this.request<{
      suggestions: {
        label: string;
        address: string;
        city: string;
        postalCode: string;
        latitude: number;
        longitude: number;
      }[];
    }>(`/geocoding/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async reverseGeocode(lat: number, lng: number) {
    return this.request<{
      address: {
        label: string;
        address: string;
        city: string;
        postalCode: string;
        latitude: number;
        longitude: number;
      } | null;
    }>(`/geocoding/reverse?lat=${lat}&lng=${lng}`);
  }

  // Business Clients
  async getBusinessClients(search?: string) {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<import('@/types').BusinessClient[]>(`/business/clients${params}`);
  }

  async getClientGrowthStats(from: string, to: string) {
    return this.request<{ baseCount: number; daily: { date: string; count: number }[] }>(
      `/business/clients/growth-stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
  }

  async getBusinessClient(clientId: string) {
    return this.request<import('@/types').BusinessClient>(`/business/clients/${clientId}`);
  }

  async updateBusinessClient(clientId: string, data: {
    isBlocked?: boolean;
    notes?: string;
    phone?: string;
    address?: string;
  }) {
    return this.request<import('@/types').BusinessClient>(`/business/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getBusinessClientBookings(clientId: string) {
    return this.request<import('@/types').Booking[]>(`/business/clients/${clientId}/bookings`);
  }

  // Admin
  async adminCreateBusiness(data: {
    businessName: string;
    ownerEmail: string;
    ownerFirstName: string;
    ownerLastName: string;
    phone?: string;
    city?: string;
    address?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    isEarlyAdopter?: boolean;
    categoryId?: string;
  }) {
    return this.request<{
      business: import('@/types').Business;
      owner: { id: string; email: string; name: string };
      generatedPassword: string;
    }>('/admin/business', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminListBusinesses(page = 1, limit = 20) {
    return this.request<{
      data: (import('@/types').Business & {
        owner: { id: string; email: string; name: string; createdAt: string };
        _count: { services: number; employees: number };
      })[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>(`/admin/businesses?page=${page}&limit=${limit}`);
  }

  async adminGetBusiness(id: string) {
    return this.request<import('@/types').Business>(`/admin/business/${id}`);
  }

  async adminResetBusinessPassword(id: string) {
    return this.request<{ email: string; generatedPassword: string }>(
      `/admin/business/${id}/reset-password`,
      { method: 'PATCH' }
    );
  }

  async adminToggleBusinessActive(id: string) {
    return this.request<import('@/types').Business>(
      `/admin/business/${id}/toggle-active`,
      { method: 'PATCH' }
    );
  }

  async adminVerifyBusiness(id: string) {
    return this.request<import('@/types').Business>(
      `/admin/business/${id}/verify`,
      { method: 'PATCH' }
    );
  }

  async adminToggleEarlyAdopter(id: string) {
    return this.request<import('@/types').Business>(
      `/admin/business/${id}/toggle-early-adopter`,
      { method: 'PATCH' }
    );
  }

  async adminResendVerification(id: string) {
    return this.request<{ sent?: boolean; alreadyVerified?: boolean }>(
      `/admin/business/${id}/resend-verification`,
      { method: 'POST' }
    );
  }

  // ============================================
  // Booking Notes
  // ============================================

  async getBookingNote(bookingId: string) {
    return this.request<import('@/types').BookingNote>(`/booking-notes/${bookingId}`);
  }

  async getClientNotes(clientId: string, limit = 20, offset = 0) {
    return this.request<import('@/types').PaginatedResponse<import('@/types').BookingNote>>(
      `/booking-notes/client/${clientId}?limit=${limit}&offset=${offset}`
    );
  }

  async getClientLastNote(clientId: string) {
    return this.request<import('@/types').BookingNote | null>(
      `/booking-notes/client/${clientId}/last`
    );
  }

  async upsertBookingNote(data: {
    bookingId: string;
    content: string;
    structured?: Record<string, unknown>;
    tags?: string[];
  }) {
    return this.request<import('@/types').BookingNote>('/booking-notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteBookingNote(bookingId: string) {
    return this.request<{ success: boolean }>(`/booking-notes/${bookingId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Billing Settings
  // ============================================

  async getBillingSettings() {
    return this.request<import('@/types').BusinessBillingSettings | null>('/billing/settings');
  }

  async upsertBillingSettings(data: {
    legalName: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
    city: string;
    country?: string;
    siret: string;
    vatNumber?: string;
    vatMode: import('@/types').VatMode;
    invoicePrefix: string;
    logoKey?: string;
    paymentTerms?: string;
  }) {
    return this.request<import('@/types').BusinessBillingSettings>('/billing/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Invoices
  // ============================================

  async createInvoice(data: {
    clientId?: string;
    bookingId?: string;
    serviceDate?: string;
  }) {
    return this.request<import('@/types').Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInvoices(status?: string, search?: string, limit = 20, offset = 0) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    return this.request<import('@/types').PaginatedResponse<import('@/types').Invoice>>(
      `/invoices?${params}`
    );
  }

  async getInvoice(id: string) {
    return this.request<import('@/types').Invoice>(`/invoices/${id}`);
  }

  async addInvoiceLine(invoiceId: string, data: {
    kind?: import('@/types').InvoiceLineKind;
    label: string;
    quantity: number;
    unitPriceHTCents: number;
    vatRate: number;
  }) {
    return this.request<import('@/types').Invoice>(`/invoices/${invoiceId}/lines`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvoiceLine(invoiceId: string, lineId: string, data: {
    kind?: import('@/types').InvoiceLineKind;
    label?: string;
    quantity?: number;
    unitPriceHTCents?: number;
    vatRate?: number;
  }) {
    return this.request<import('@/types').Invoice>(`/invoices/${invoiceId}/lines/${lineId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeInvoiceLine(invoiceId: string, lineId: string) {
    return this.request<import('@/types').Invoice>(`/invoices/${invoiceId}/lines/${lineId}`, {
      method: 'DELETE',
    });
  }

  async finalizeInvoice(invoiceId: string) {
    return this.request<import('@/types').Invoice>(`/invoices/${invoiceId}/finalize`, {
      method: 'POST',
    });
  }

  async cancelInvoice(invoiceId: string) {
    return this.request<import('@/types').Invoice>(`/invoices/${invoiceId}/cancel`, {
      method: 'POST',
    });
  }

  async deleteInvoice(invoiceId: string) {
    return this.request<{ success: boolean }>(`/invoices/${invoiceId}`, {
      method: 'DELETE',
    });
  }

  async getInvoicePdfUrl(invoiceId: string) {
    return this.request<{ url: string }>(`/invoices/${invoiceId}/pdf`);
  }

  // ============================================
  // Invoice Batch
  // ============================================

  async batchPreview(startDate: string, endDate: string) {
    return this.request<import('@/types').BatchPreviewResult>('/invoices/batch/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate }),
    });
  }

  async batchGenerate(startDate: string, endDate: string) {
    return this.request<import('@/types').BatchResult>('/invoices/batch/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate }),
    });
  }

  getBatchDownloadUrl(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    return `${baseUrl}/invoices/batch/download?${params}`;
  }

  async getBatchHistory() {
    return this.request<import('@/types').BatchGeneration[]>('/invoices/batch/history');
  }

  getBatchDownloadByIdUrl(batchId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    return `${baseUrl}/invoices/batch/${batchId}/download`;
  }

  // ============================================
  // Calendar
  // ============================================

  async getCalendarEntries(start: string, end: string, staffId?: string) {
    const params = new URLSearchParams({ start, end });
    if (staffId) params.append('staffId', staffId);
    return this.request<import('@/types').CalendarEntry[]>(
      `/calendar/entries?${params}`,
    );
  }

  async createCalendarAppointment(data: {
    employeeId: string;
    businessServiceId: string;
    scheduledAt: string;
    clientUserId?: string;
    notes?: string;
  }) {
    return this.request<import('@/types').CalendarEntry>(
      '/calendar/appointments',
      { method: 'POST', body: JSON.stringify(data) },
    );
  }

  async createCalendarBlock(data: {
    employeeId: string;
    startAt: string;
    endAt: string;
    blockReason?: import('@/types').BlockReason;
    notes?: string;
  }) {
    return this.request<import('@/types').CalendarEntry>(
      '/calendar/blocks',
      { method: 'POST', body: JSON.stringify(data) },
    );
  }

  async updateCalendarEntry(
    id: string,
    data: {
      employeeId?: string;
      startAt?: string;
      endAt?: string;
      status?: import('@/types').BookingStatus;
      updatedAt?: string;
    },
  ) {
    return this.request<import('@/types').CalendarEntry>(
      `/calendar/entries/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
    );
  }

  async deleteCalendarBlock(id: string) {
    return this.request<{ success: boolean }>(`/calendar/blocks/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
