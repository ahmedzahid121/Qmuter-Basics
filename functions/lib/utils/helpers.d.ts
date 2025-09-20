import { Timestamp } from 'firebase-admin/firestore';
export declare const generateId: () => string;
export declare const createTimestamp: () => Timestamp;
export declare const calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
export declare const isWithinRadius: (centerLat: number, centerLng: number, pointLat: number, pointLng: number, radiusKm: number) => boolean;
export declare const calculateCommunityScore: (upvotes: number, downvotes: number) => number;
export declare const formatCurrency: (amount: number, currency: string) => string;
export declare const calculateCO2Saved: (distanceKm: number) => number;
export declare const calculateMoneySaved: (distanceKm: number, pricePerKm?: number) => number;
export declare const getBadgeTier: (totalCO2Saved: number) => "Bronze" | "Silver" | "Gold" | "Platinum" | "Eco Hero";
export declare const generateRouteName: (startPoint: string, endPoint: string) => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidPhoneNumber: (phone: string) => boolean;
export declare const sanitizeString: (input: string) => string;
export declare const generatePagination: (total: number, page: number, limit: number) => {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};
export declare const createPaginatedQuery: (query: FirebaseFirestore.Query, page: number, limit: number, sortBy?: string, sortOrder?: "asc" | "desc") => FirebaseFirestore.Query<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>;
export declare const docToObject: <T>(doc: FirebaseFirestore.DocumentSnapshot) => T | null;
export declare const snapshotToArray: <T>(snapshot: FirebaseFirestore.QuerySnapshot) => T[];
export declare const isAdmin: (uid: string, admin: any) => Promise<boolean>;
export declare const generateNotificationMessage: (type: string, data: Record<string, any>) => {
    title: string;
    message: string;
};
export declare const calculateRideStats: (rides: any[]) => {
    totalRides: number;
    totalCO2Saved: number;
    totalMoneySaved: number;
    totalRevenue: number;
};
//# sourceMappingURL=helpers.d.ts.map