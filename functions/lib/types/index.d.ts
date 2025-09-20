import { Timestamp } from 'firebase-admin/firestore';
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
    totalRides: number;
    totalCO2Saved: number;
    totalMoneySaved: number;
    badgeTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Eco Hero';
    walletBalance: number;
    onboardingComplete: boolean;
    emailVerified?: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
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
    driverETA: number;
    riderETA: number;
    lastUpdated: number;
}
export interface NotificationFlags {
    driver10: boolean;
    driver5: boolean;
    rider10: boolean;
    rider5: boolean;
    driverArrived: boolean;
    riderArrived: boolean;
    bothArrived: boolean;
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
export interface RouteProposal {
    id: string;
    driverId: string;
    driverInfo: {
        displayName: string | null;
        photoURL: string | null;
        rating: number;
    };
    routeName: string;
    description?: string;
    startPoint: GeoLocation;
    endPoint: GeoLocation;
    pickupPoints: PickupPoint[];
    schedule: {
        type: 'recurring' | 'one-time';
        days?: string[];
        time: string;
        timezone: string;
        startDate?: string;
        endDate?: string;
    };
    totalSeats: number;
    pricePerSeat: number;
    currency: string;
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
    adminNotes?: string;
    approvedBy?: string;
    approvedAt?: Timestamp;
    upvotes: number;
    downvotes: number;
    communityScore: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface ActiveRoute extends RouteProposal {
    status: 'active' | 'inactive';
    bookedSeats: number;
    availableSeats: number;
    currentRides: string[];
}
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
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    scheduledDate: string;
    scheduledTime: string;
    actualStartTime?: Timestamp;
    actualEndTime?: Timestamp;
    pricePerSeat: number;
    currency: string;
    totalRevenue: number;
    startLocation?: GeoLocation;
    endLocation?: GeoLocation;
    trackingPoints: GeoLocation[];
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
    createdAt: Timestamp;
    updatedAt: Timestamp;
    confirmedAt?: Timestamp;
    cancelledAt?: Timestamp;
    completedAt?: Timestamp;
}
export interface Payment {
    id: string;
    bookingId: string;
    userId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentMethod: 'wallet' | 'external';
    transactionId?: string;
    createdAt: Timestamp;
    completedAt?: Timestamp;
}
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
    createdAt: Timestamp;
}
export interface Notification {
    id: string;
    userId: string;
    type: 'route-approved' | 'route-rejected' | 'booking-confirmed' | 'ride-reminder' | 'payment-received' | 'driver-eta' | 'rider-eta' | 'arrival-notification';
    title: string;
    message: string;
    data?: Record<string, any>;
    read: boolean;
    createdAt: Timestamp;
    readAt?: Timestamp;
}
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
//# sourceMappingURL=index.d.ts.map