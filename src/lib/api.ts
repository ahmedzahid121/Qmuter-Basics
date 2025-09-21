import { auth } from "@/lib/firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  'https://australia-southeast2-qmuter-pro.cloudfunctions.net/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Route Management
  async getRoutes(params?: {
    status?: string;
    page?: number;
    limit?: number;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.makeRequest(`/v1/routes?${searchParams.toString()}`);
  }

  async createRoute(routeData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/v1/routes', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  }

  async updateRoute(routeId: string, routeData: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/v1/routes/${routeId}`, {
      method: 'PUT',
      body: JSON.stringify(routeData),
    });
  }

  async deleteRoute(routeId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/v1/routes/${routeId}`, {
      method: 'DELETE',
    });
  }

  async voteOnRoute(routeId: string, vote: 'upvote' | 'downvote'): Promise<ApiResponse<any>> {
    return this.makeRequest(`/v1/routes/${routeId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
  }

  // Booking Management
  async createBooking(bookingData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getBookings(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.makeRequest(`/v1/bookings?${searchParams.toString()}`);
  }

  async updateBooking(bookingId: string, bookingData: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/v1/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(bookingData),
    });
  }

  async cancelBooking(bookingId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/v1/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
  }

  // Live Tracking
  async startTracking(trackingData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/v1/live-tracking/start', {
      method: 'POST',
      body: JSON.stringify(trackingData),
    });
  }

  async updateLocation(locationData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/v1/live-tracking/update-location', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async getTrackingStatus(tripId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/v1/live-tracking/status/${tripId}`);
  }

  // Chat/Messaging
  async getConversations(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/v1/conversations');
  }

  async getMessages(conversationId: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest(`/v1/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, messageData: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // Notifications
  async getNotifications(params?: {
    read?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.makeRequest(`/v1/notifications?${searchParams.toString()}`);
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/v1/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  // User Management
  async updateUserProfile(userData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/v1/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUserStats(): Promise<ApiResponse<any>> {
    return this.makeRequest('/v1/users/stats');
  }

  // Payment/Wallet
  async topUpWallet(amount: number, paymentMethod: string): Promise<ApiResponse<any>> {
    return this.makeRequest('/v1/payments/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod }),
    });
  }

  async getPaymentHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.makeRequest(`/v1/payments/history?${searchParams.toString()}`);
  }

  // Admin Endpoints
  async getPendingRoutes(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.makeRequest(`/v1/admin/routes/pending?${searchParams.toString()}`);
  }

  async approveRoute(routeId: string, notes?: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/v1/admin/routes/${routeId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectRoute(routeId: string, reason: string, notes?: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/v1/admin/routes/${routeId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  }

  async suspendUser(userId: string, reason: string, notes?: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/v1/admin/users/${userId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  }

  async getSystemStats(): Promise<ApiResponse<any>> {
    return this.makeRequest('/v1/admin/stats');
  }
}

export const apiService = new ApiService(); 