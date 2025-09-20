import { Timestamp } from 'firebase-admin/firestore';

// User Types
export interface QmuterUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'driver' | 'passenger';
  phoneNumber?: string;
  country?: string;
  licenseNumber?: string;
  carModel?: string;
  
  // Gamification fields
  totalRides: number;
  totalCO2Saved: number; // in kg
  totalMoneySaved: number; // in currency
  badgeTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Eco Hero';
  walletBalance: number;
  onboardingComplete: boolean;
  emailVerified?: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Location Types
export interface GeoLocation {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

// Live Tracking Types
export interface LiveLocation {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface TripStatus {
  status: 'en_route_to_pickup' | 'en_route_to_dropoff' | 'completed' | 'cancelled';
  driverArrived: boolean;
  riderArrived: boolean;
  driverETA: number; // minutes
  riderETA: number; // minutes
  lastUpdated: number;
}

export interface NotificationFlags {
  driver10: boolean; // Driver 10 minutes away notification sent
  driver5: boolean;  // Driver 5 minutes away notification sent
  rider10: boolean;  // Rider 10 minutes away notification sent
  rider5: boolean;   // Rider 5 minutes away notification sent
  driverArrived: boolean; // Driver arrived notification sent
  riderArrived: boolean;  // Rider arrived notification sent
  bothArrived: boolean;   // Both arrived notification sent
}

export interface LiveTrackingData {
  tripId: string;
  driverLocation: LiveLocation;
  riderLocation: LiveLocation;
  pickupLocation: GeoLocation;
  dropoffLocation: GeoLocation;
  tripStatus: TripStatus;
  notified: NotificationFlags;
  driverId: string;
  riderId: string;
  routeId: string;
  createdAt: number;
  updatedAt: number;
}

// Route Types
export interface RouteProposal {
  id: string;
  driverId: string;
  driverInfo: {
    displayName: string | null;
    photoURL: string | null;
    rating: number;
  };
  
  // Route details
  routeName: string;
  description?: string;
  startPoint: GeoLocation;
  endPoint: GeoLocation;
  pickupPoints: PickupPoint[];
  
  // Schedule
  schedule: {
    type: 'recurring' | 'one-time';
    days?: string[]; // ['monday', 'tuesday', ...]
    time: string; // "08:00"
    timezone: string;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
  };
  
  // Capacity and pricing
  totalSeats: number;
  pricePerSeat: number;
  currency: string;
  
  // Status and approval
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: Timestamp;
  
  // Community features
  upvotes: number;
  downvotes: number;
  communityScore: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActiveRoute extends RouteProposal {
  status: 'active' | 'inactive';
  bookedSeats: number;
  availableSeats: number;
  currentRides: string[]; // Array of ride IDs
}

// Ride Types
export interface Ride {
  id: string;
  routeId: string;
  routeInfo: {
    routeName: string;
    startPoint: GeoLocation;
    endPoint: GeoLocation;
    schedule: RouteProposal['schedule'];
  };
  
  driverId: string;
  driverInfo: {
    displayName: string | null;
    photoURL: string | null;
    rating: number;
  };
  
  passengers: RidePassenger[];
  maxPassengers: number;
  
  // Ride status
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  
  // Timing
  scheduledDate: string; // ISO date string
  scheduledTime: string; // "08:00"
  actualStartTime?: Timestamp;
  actualEndTime?: Timestamp;
  
  // Financial
  pricePerSeat: number;
  currency: string;
  totalRevenue: number;
  
  // Tracking
  startLocation?: GeoLocation;
  endLocation?: GeoLocation;
  trackingPoints: GeoLocation[];
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RidePassenger {
  userId: string;
  userInfo: {
    displayName: string | null;
    photoURL: string | null;
  };
  pickupPoint: PickupPoint;
  dropoffPoint: PickupPoint;
  status: 'confirmed' | 'cancelled' | 'no-show';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  amount: number;
  joinedAt: Timestamp;
}

// Booking Types
export interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  passengerInfo: {
    displayName: string | null;
    photoURL: string | null;
  };
  
  pickupPoint: PickupPoint;
  dropoffPoint: PickupPoint;
  
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  
  amount: number;
  currency: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  confirmedAt?: Timestamp;
  cancelledAt?: Timestamp;
  completedAt?: Timestamp;
}

// Payment Types
export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'wallet' | 'external';
  transactionId?: string;
  
  // Timestamps
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// Admin Types
export interface AdminAction {
  id: string;
  adminId: string;
  adminInfo: {
    displayName: string | null;
    email: string;
  };
  
  action: 'approve-route' | 'reject-route' | 'suspend-user' | 'activate-user';
  targetType: 'route' | 'user';
  targetId: string;
  
  reason?: string;
  notes?: string;
  
  // Timestamps
  createdAt: Timestamp;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'route-approved' | 'route-rejected' | 'booking-confirmed' | 'ride-reminder' | 'payment-received' | 'driver-eta' | 'rider-eta' | 'arrival-notification';
  title: string;
  message: string;
  data?: Record<string, any>;
  
  read: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  readAt?: Timestamp;
}

// Live Tracking Request Types
export interface UpdateLocationRequest {
  tripId: string;
  role: 'driver' | 'rider';
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface StartTrackingRequest {
  tripId: string;
  driverId: string;
  riderId: string;
  routeId: string;
  pickupLocation: GeoLocation;
  dropoffLocation: GeoLocation;
}

export interface ETARequest {
  origin: GeoLocation;
  destination: GeoLocation;
  mode?: 'driving' | 'walking' | 'transit';
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request Types
export interface CreateRouteRequest {
  routeName: string;
  description?: string;
  startPoint: GeoLocation;
  endPoint: GeoLocation;
  pickupPoints: Omit<PickupPoint, 'id'>[];
  schedule: RouteProposal['schedule'];
  totalSeats: number;
  pricePerSeat: number;
  currency: string;
}

export interface UpdateRouteRequest {
  routeName?: string;
  description?: string;
  startPoint?: GeoLocation;
  endPoint?: GeoLocation;
  pickupPoints?: Omit<PickupPoint, 'id'>[];
  schedule?: RouteProposal['schedule'];
  totalSeats?: number;
  pricePerSeat?: number;
  currency?: string;
}

export interface CreateBookingRequest {
  rideId: string;
  pickupPoint: Omit<PickupPoint, 'id'>;
  dropoffPoint: Omit<PickupPoint, 'id'>;
}

export interface AdminActionRequest {
  action: AdminAction['action'];
  targetType: AdminAction['targetType'];
  targetId: string;
  reason?: string;
  notes?: string;
} 