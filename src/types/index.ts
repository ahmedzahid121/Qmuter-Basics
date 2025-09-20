
export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'driver' | 'passenger';
  rating: number;
  
  // Gamification fields
  totalRides: number;
  totalCO2Saved: number; // in kg
  totalMoneySaved: number; // in currency
  badgeTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Eco Hero';
  onboardingComplete: boolean;
};

export type PickupPoint = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export type Route = {
  id: string;
  driverId: string;
  driverInfo: Pick<User, 'displayName' | 'photoURL' | 'rating'>;
  routeName: string;
  startPoint: Omit<PickupPoint, 'id' | 'name'>;
  endPoint: Omit<PickupPoint, 'id' | 'name'>;
  schedule: string; // e.g., "Mon-Fri, 8:00 AM"
  totalSeats: number;
  bookedSeats: number;
  upvotes: number;
  isOfficial: boolean;
};

export type Booking = {
  id: string;
  routeId: string;
  passengerId: string;
  pickupPointId: string;
  dropOffPointId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
};
