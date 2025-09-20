import { db } from '../config/firebase';
import { 
  LiveTrackingData, 
  UpdateLocationRequest, 
  StartTrackingRequest,
  LiveLocation,
  TripStatus,
  NotificationFlags,
  ApiResponse,
  GeoLocation
} from '../types';
import { 
  generateId, 
  calculateDistance,
  createTimestamp
} from '../utils/helpers';

export class LiveTrackingService {
  private liveTrackingCollection = db.collection('liveTracking');
  private notificationsCollection = db.collection('notifications');

  // Start live tracking for a trip
  async startTracking(tripData: StartTrackingRequest): Promise<ApiResponse<LiveTrackingData>> {
    try {
      const tripId = tripData.tripId;
      const now = Date.now();

      // Initialize live tracking data
      const liveTrackingData: LiveTrackingData = {
        tripId,
        driverId: tripData.driverId,
        riderId: tripData.riderId,
        routeId: tripData.routeId,
        pickupLocation: tripData.pickupLocation,
        dropoffLocation: tripData.dropoffLocation,
        driverLocation: {
          lat: 0,
          lng: 0,
          timestamp: now
        },
        riderLocation: {
          lat: 0,
          lng: 0,
          timestamp: now
        },
        tripStatus: {
          status: 'en_route_to_pickup',
          driverArrived: false,
          riderArrived: false,
          driverETA: 0,
          riderETA: 0,
          lastUpdated: now
        },
        notified: {
          driver10: false,
          driver5: false,
          rider10: false,
          rider5: false,
          driverArrived: false,
          riderArrived: false,
          bothArrived: false
        },
        createdAt: now,
        updatedAt: now
      };

      await this.liveTrackingCollection.doc(tripId).set(liveTrackingData);

      return {
        success: true,
        data: liveTrackingData,
        message: 'Live tracking started successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start tracking'
      };
    }
  }

  // Update location for driver or rider
  async updateLocation(request: UpdateLocationRequest): Promise<ApiResponse<void>> {
    try {
      const { tripId, role, lat, lng, accuracy, speed, heading } = request;
      const now = Date.now();

      // Create location object
      const location: LiveLocation = {
        lat,
        lng,
        timestamp: now,
        accuracy,
        speed,
        heading
      };

      // Update location in Firestore
      const updateData: any = {
        updatedAt: now,
        [`${role}Location`]: location,
        'tripStatus.lastUpdated': now
      };

      await this.liveTrackingCollection.doc(tripId).update(updateData);

      // Trigger ETA calculation and notification checks
      await this.checkETAsAndNotify(tripId);

      return {
        success: true,
        message: 'Location updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update location'
      };
    }
  }

  // Get live tracking data for a trip
  async getLiveTrackingData(tripId: string): Promise<ApiResponse<LiveTrackingData>> {
    try {
      const doc = await this.liveTrackingCollection.doc(tripId).get();
      
      if (!doc.exists) {
        throw new Error('Live tracking data not found');
      }

      const data = doc.data() as LiveTrackingData;
      
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tracking data'
      };
    }
  }

  // Check ETAs and send notifications
  async checkETAsAndNotify(tripId: string): Promise<void> {
    try {
      const doc = await this.liveTrackingCollection.doc(tripId).get();
      
      if (!doc.exists) {
        return;
      }

      const trackingData = doc.data() as LiveTrackingData;
      const { driverLocation, riderLocation, pickupLocation, tripStatus, notified } = trackingData;

      // Calculate ETAs
      const driverETA = await this.calculateETA(driverLocation, pickupLocation, 'driving');
      const riderETA = await this.calculateETA(riderLocation, pickupLocation, 'walking');

      // Check arrival status
      const driverArrived = this.hasArrived(driverLocation, pickupLocation);
      const riderArrived = this.hasArrived(riderLocation, pickupLocation);

      // Update trip status
      const updatedTripStatus: TripStatus = {
        ...tripStatus,
        driverETA,
        riderETA,
        driverArrived,
        riderArrived,
        lastUpdated: Date.now()
      };

      // Determine if both have arrived
      if (driverArrived && riderArrived && !notified.bothArrived) {
        updatedTripStatus.status = 'en_route_to_dropoff';
      }

      // Prepare notification updates
      const notificationUpdates: Partial<NotificationFlags> = {};

      // Check driver ETA notifications
      if (driverETA <= 10 && !notified.driver10) {
        await this.sendNotification(trackingData.riderId, 'driver-eta', {
          title: 'Driver is 10 minutes away! 🚗',
          message: `Your driver is approximately ${driverETA} minutes away from the pickup location.`,
          data: { tripId, eta: driverETA, type: 'driver-eta' }
        });
        notificationUpdates.driver10 = true;
      }

      if (driverETA <= 5 && !notified.driver5) {
        await this.sendNotification(trackingData.riderId, 'driver-eta', {
          title: 'Driver is 5 minutes away! 🚗',
          message: `Your driver is approximately ${driverETA} minutes away. Please be ready at the pickup location.`,
          data: { tripId, eta: driverETA, type: 'driver-eta' }
        });
        notificationUpdates.driver5 = true;
      }

      // Check rider ETA notifications
      if (riderETA <= 10 && !notified.rider10) {
        await this.sendNotification(trackingData.driverId, 'rider-eta', {
          title: 'Rider is 10 minutes away! 🚶',
          message: `Your rider is approximately ${riderETA} minutes away from the pickup location.`,
          data: { tripId, eta: riderETA, type: 'rider-eta' }
        });
        notificationUpdates.rider10 = true;
      }

      if (riderETA <= 5 && !notified.rider5) {
        await this.sendNotification(trackingData.driverId, 'rider-eta', {
          title: 'Rider is 5 minutes away! 🚶',
          message: `Your rider is approximately ${riderETA} minutes away. They should arrive soon.`,
          data: { tripId, eta: riderETA, type: 'rider-eta' }
        });
        notificationUpdates.rider5 = true;
      }

      // Check arrival notifications
      if (driverArrived && !notified.driverArrived) {
        await this.sendNotification(trackingData.riderId, 'arrival-notification', {
          title: 'Driver has arrived! ✅',
          message: 'Your driver has arrived at the pickup location.',
          data: { tripId, type: 'driver-arrived' }
        });
        notificationUpdates.driverArrived = true;
      }

      if (riderArrived && !notified.riderArrived) {
        await this.sendNotification(trackingData.driverId, 'arrival-notification', {
          title: 'Rider has arrived! ✅',
          message: 'Your rider has arrived at the pickup location.',
          data: { tripId, type: 'rider-arrived' }
        });
        notificationUpdates.riderArrived = true;
      }

      // Check if both arrived
      if (driverArrived && riderArrived && !notified.bothArrived) {
        await this.sendNotification(trackingData.driverId, 'arrival-notification', {
          title: 'Both parties arrived! 🎉',
          message: 'Both driver and rider have arrived. You can now proceed to the destination.',
          data: { tripId, type: 'both-arrived' }
        });

        await this.sendNotification(trackingData.riderId, 'arrival-notification', {
          title: 'Both parties arrived! 🎉',
          message: 'Both driver and rider have arrived. You can now proceed to the destination.',
          data: { tripId, type: 'both-arrived' }
        });

        notificationUpdates.bothArrived = true;
      }

      // Update Firestore with new status and notifications
      const updateData: any = {
        tripStatus: updatedTripStatus,
        updatedAt: Date.now()
      };

      if (Object.keys(notificationUpdates).length > 0) {
        updateData.notified = { ...notified, ...notificationUpdates };
      }

      await this.liveTrackingCollection.doc(tripId).update(updateData);

    } catch (error) {
      console.error('Error in checkETAsAndNotify:', error);
    }
  }

  // Calculate ETA using Google Maps Directions API
  async calculateETA(origin: LiveLocation, destination: GeoLocation, mode: 'driving' | 'walking' | 'transit' = 'driving'): Promise<number> {
    try {
      // For now, use a simple distance-based calculation
      // In production, you would use Google Maps Directions API
      const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      
      // Rough ETA calculation based on mode
      let speedKmH = 0;
      switch (mode) {
        case 'driving':
          speedKmH = 30; // Average city speed
          break;
        case 'walking':
          speedKmH = 5; // Average walking speed
          break;
        case 'transit':
          speedKmH = 20; // Average transit speed
          break;
      }

      const etaMinutes = Math.round((distance / speedKmH) * 60);
      return Math.max(0, etaMinutes); // Ensure non-negative
    } catch (error) {
      console.error('Error calculating ETA:', error);
      return 0;
    }
  }

  // Check if user has arrived at pickup location
  hasArrived(userLocation: LiveLocation, pickupLocation: GeoLocation): boolean {
    const distance = calculateDistance(
      userLocation.lat, 
      userLocation.lng, 
      pickupLocation.lat, 
      pickupLocation.lng
    );
    
    // Consider arrived if within 20 meters
    return distance <= 0.02; // 20 meters in kilometers
  }

  // Send notification to user
  async sendNotification(
    userId: string, 
    type: string, 
    notificationData: { title: string; message: string; data?: any }
  ): Promise<void> {
    try {
      const notification = {
        id: generateId(),
        userId,
        type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        read: false,
        createdAt: createTimestamp()
      };

      await this.notificationsCollection.doc(notification.id).set(notification);

      // Here you would also send push notification via FCM
      // await this.sendPushNotification(userId, notificationData);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // End live tracking for a trip
  async endTracking(tripId: string): Promise<ApiResponse<void>> {
    try {
      const updateData = {
        'tripStatus.status': 'completed',
        updatedAt: Date.now()
      };

      await this.liveTrackingCollection.doc(tripId).update(updateData);

      return {
        success: true,
        message: 'Live tracking ended successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to end tracking'
      };
    }
  }

  // Get active trips for a user
  async getUserActiveTrips(userId: string): Promise<ApiResponse<LiveTrackingData[]>> {
    try {
      const driverTrips = await this.liveTrackingCollection
        .where('driverId', '==', userId)
        .where('tripStatus.status', 'in', ['en_route_to_pickup', 'en_route_to_dropoff'])
        .get();

      const riderTrips = await this.liveTrackingCollection
        .where('riderId', '==', userId)
        .where('tripStatus.status', 'in', ['en_route_to_pickup', 'en_route_to_dropoff'])
        .get();

      const allTrips = [...driverTrips.docs, ...riderTrips.docs];
      const trips = allTrips.map(doc => doc.data() as LiveTrackingData);

      return {
        success: true,
        data: trips
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get active trips',
        data: []
      };
    }
  }

  // Clean up old tracking data (scheduled function)
  async cleanupOldTrackingData(): Promise<void> {
    try {
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      const oldTrips = await this.liveTrackingCollection
        .where('updatedAt', '<', oneDayAgo)
        .where('tripStatus.status', '==', 'completed')
        .get();

      const batch = db.batch();
      oldTrips.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${oldTrips.docs.length} old tracking records`);
    } catch (error) {
      console.error('Error cleaning up old tracking data:', error);
    }
  }
} 