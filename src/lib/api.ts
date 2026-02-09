const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
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

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  // Auth
  async getMe() {
    return this.request<import('@/types').User>('/auth/me');
  }

  // Services
  async searchServices(filters: import('@/types').SearchFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    return this.request<import('@/types').PaginatedResponse<import('@/types').Service>>(
      `/services/search?${params}`
    );
  }

  async suggestServices(query: string, limit = 5) {
    return this.request<import('@/types').ServiceSuggestion[]>(
      `/services/suggest?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  async getService(id: string) {
    return this.request<import('@/types').Service>(`/services/${id}`);
  }

  async createService(data: Partial<import('@/types').Service>) {
    return this.request<import('@/types').Service>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: Partial<import('@/types').Service>) {
    return this.request<import('@/types').Service>(`/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async publishService(id: string) {
    return this.request<import('@/types').Service>(`/services/${id}/publish`, {
      method: 'POST',
    });
  }

  async pauseService(id: string) {
    return this.request<import('@/types').Service>(`/services/${id}/pause`, {
      method: 'POST',
    });
  }

  async deleteService(id: string) {
    return this.request<{ success: boolean }>(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyServices() {
    return this.request<import('@/types').Service[]>('/services/me/services');
  }

  async getUserServices(userId: string) {
    return this.request<import('@/types').Service[]>(`/services/user/${userId}`);
  }

  // Bookings
  async createBooking(data: { serviceId: string; agreedPriceCents?: number; scheduledAt?: string }) {
    return this.request<import('@/types').Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  // Tags
  async suggestTags(query: string) {
    return this.request<import('@/types').Tag[]>(`/tags/suggest?q=${encodeURIComponent(query)}`);
  }

  // Users
  async getProfile(userId: string) {
    return this.request<import('@/types').User>(`/users/${userId}`);
  }

  async updateMyProfile(data: Partial<import('@/types').Profile>) {
    return this.request<import('@/types').Profile>('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Stripe
  async createSubscription(priceId: string) {
    return this.request<{ url: string }>('/stripe/subscribe', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
  }

  async createBoost(serviceId: string) {
    return this.request<{ url: string }>('/stripe/boost', {
      method: 'POST',
      body: JSON.stringify({ serviceId }),
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

  async searchBusinesses(filters: {
    q?: string;
    city?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'popular' | 'rating';
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

  // Profile Images
  async getMyProfileImages() {
    return this.request<import('@/types').ProfileImage[]>('/users/me/images');
  }

  async getProfileImages(userId: string) {
    return this.request<import('@/types').ProfileImage[]>(`/users/${userId}/images`);
  }

  async addProfileImage(url: string) {
    return this.request<import('@/types').ProfileImage>('/users/me/images', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async deleteProfileImage(id: string) {
    return this.request<{ success: boolean }>(`/users/me/images/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderProfileImages(imageIds: string[]) {
    return this.request<import('@/types').ProfileImage[]>('/users/me/images/reorder', {
      method: 'PUT',
      body: JSON.stringify({ imageIds }),
    });
  }
}

export const api = new ApiClient();
