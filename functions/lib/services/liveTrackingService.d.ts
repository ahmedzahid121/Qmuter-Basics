import { LiveTrackingData, UpdateLocationRequest, StartTrackingRequest, LiveLocation, ApiResponse, GeoLocation } from '../types';
export declare class LiveTrackingService {
    private liveTrackingCollection;
    private notificationsCollection;
    startTracking(tripData: StartTrackingRequest): Promise<ApiResponse<LiveTrackingData>>;
    updateLocation(request: UpdateLocationRequest): Promise<ApiResponse<void>>;
    getLiveTrackingData(tripId: string): Promise<ApiResponse<LiveTrackingData>>;
    checkETAsAndNotify(tripId: string): Promise<void>;
    calculateETA(origin: LiveLocation, destination: GeoLocation, mode?: 'driving' | 'walking' | 'transit'): Promise<number>;
    hasArrived(userLocation: LiveLocation, pickupLocation: GeoLocation): boolean;
    sendNotification(userId: string, type: string, notificationData: {
        title: string;
        message: string;
        data?: any;
    }): Promise<void>;
    endTracking(tripId: string): Promise<ApiResponse<void>>;
    getUserActiveTrips(userId: string): Promise<ApiResponse<LiveTrackingData[]>>;
    cleanupOldTrackingData(): Promise<void>;
}
//# sourceMappingURL=liveTrackingService.d.ts.map