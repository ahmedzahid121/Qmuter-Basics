import { Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Generate unique IDs
export const generateId = (): string => uuidv4();

// Create timestamps
export const createTimestamp = (): Timestamp => Timestamp.now();

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Check if a point is within a radius of another point
export const isWithinRadius = (
  centerLat: number, 
  centerLng: number, 
  pointLat: number, 
  pointLng: number, 
  radiusKm: number
): boolean => {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng);
  return distance <= radiusKm;
};

// Calculate community score based on upvotes and downvotes
export const calculateCommunityScore = (upvotes: number, downvotes: number): number => {
  const total = upvotes + downvotes;
  if (total === 0) return 0;
  return Math.round(((upvotes - downvotes) / total) * 100);
};

// Format currency
export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
};

// Calculate CO2 savings (rough estimate: 0.2 kg CO2 per km saved)
export const calculateCO2Saved = (distanceKm: number): number => {
  return Math.round(distanceKm * 0.2 * 100) / 100; // Round to 2 decimal places
};

// Calculate money saved (compared to public transport)
export const calculateMoneySaved = (distanceKm: number, pricePerKm: number = 0.3): number => {
  return Math.round(distanceKm * pricePerKm * 100) / 100;
};

// Determine badge tier based on total CO2 saved
export const getBadgeTier = (totalCO2Saved: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Eco Hero' => {
  if (totalCO2Saved >= 500) return 'Eco Hero';
  if (totalCO2Saved >= 250) return 'Platinum';
  if (totalCO2Saved >= 100) return 'Gold';
  if (totalCO2Saved >= 50) return 'Silver';
  return 'Bronze';
};

// Generate route name suggestions
export const generateRouteName = (startPoint: string, endPoint: string): string => {
  const start = startPoint.split(',')[0].trim();
  const end = endPoint.split(',')[0].trim();
  return `${start} → ${end}`;
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{7,}$/;
  return phoneRegex.test(phone);
};

// Sanitize string input
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Generate pagination info
export const generatePagination = (
  total: number, 
  page: number, 
  limit: number
): { page: number; limit: number; total: number; totalPages: number } => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

// Create Firestore query with pagination
export const createPaginatedQuery = (
  query: FirebaseFirestore.Query,
  page: number,
  limit: number,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) => {
  const offset = (page - 1) * limit;
  return query
    .orderBy(sortBy, sortOrder)
    .limit(limit)
    .offset(offset);
};

// Convert Firestore document to plain object
export const docToObject = <T>(doc: FirebaseFirestore.DocumentSnapshot): T | null => {
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as T;
};

// Convert Firestore query snapshot to array
export const snapshotToArray = <T>(snapshot: FirebaseFirestore.QuerySnapshot): T[] => {
  return snapshot.docs.map(doc => docToObject<T>(doc)).filter(Boolean) as T[];
};

// Check if user is admin
export const isAdmin = async (uid: string, admin: any): Promise<boolean> => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord.customClaims?.role === 'admin';
  } catch (error) {
    return false;
  }
};

// Generate notification message based on type
export const generateNotificationMessage = (
  type: string, 
  data: Record<string, any>
): { title: string; message: string } => {
  switch (type) {
    case 'route-approved':
      return {
        title: 'Route Approved! 🎉',
        message: `Your route "${data.routeName}" has been approved and is now active.`
      };
    case 'route-rejected':
      return {
        title: 'Route Update',
        message: `Your route "${data.routeName}" was not approved. ${data.reason || 'Please review and resubmit.'}`
      };
    case 'booking-confirmed':
      return {
        title: 'Booking Confirmed! ✅',
        message: `Your booking for "${data.routeName}" has been confirmed.`
      };
    case 'ride-reminder':
      return {
        title: 'Ride Reminder',
        message: `Don't forget! Your ride "${data.routeName}" is scheduled for ${data.time}.`
      };
    case 'payment-received':
      return {
        title: 'Payment Received',
        message: `Payment of ${formatCurrency(data.amount, data.currency)} has been received.`
      };
    default:
      return {
        title: 'Notification',
        message: 'You have a new notification.'
      };
  }
};

// Calculate ride statistics
export const calculateRideStats = (rides: any[]): {
  totalRides: number;
  totalCO2Saved: number;
  totalMoneySaved: number;
  totalRevenue: number;
} => {
  return rides.reduce((stats, ride) => {
    const distance = calculateDistance(
      ride.routeInfo.startPoint.lat,
      ride.routeInfo.startPoint.lng,
      ride.routeInfo.endPoint.lat,
      ride.routeInfo.endPoint.lng
    );
    
    return {
      totalRides: stats.totalRides + 1,
      totalCO2Saved: stats.totalCO2Saved + calculateCO2Saved(distance),
      totalMoneySaved: stats.totalMoneySaved + calculateMoneySaved(distance),
      totalRevenue: stats.totalRevenue + (ride.totalRevenue || 0)
    };
  }, {
    totalRides: 0,
    totalCO2Saved: 0,
    totalMoneySaved: 0,
    totalRevenue: 0
  });
}; 