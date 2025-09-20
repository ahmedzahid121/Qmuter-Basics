"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveTrackingService = void 0;
const firebase_1 = require("../config/firebase");
const helpers_1 = require("../utils/helpers");
class LiveTrackingService {
    constructor() {
        this.liveTrackingCollection = firebase_1.db.collection('liveTracking');
        this.notificationsCollection = firebase_1.db.collection('notifications');
    }
    // Start live tracking for a trip
    startTracking(tripData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tripId = tripData.tripId;
                const now = Date.now();
                // Initialize live tracking data
                const liveTrackingData = {
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
                yield this.liveTrackingCollection.doc(tripId).set(liveTrackingData);
                return {
                    success: true,
                    data: liveTrackingData,
                    message: 'Live tracking started successfully'
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to start tracking'
                };
            }
        });
    }
    // Update location for driver or rider
    updateLocation(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { tripId, role, lat, lng, accuracy, speed, heading } = request;
                const now = Date.now();
                // Create location object
                const location = {
                    lat,
                    lng,
                    timestamp: now,
                    accuracy,
                    speed,
                    heading
                };
                // Update location in Firestore
                const updateData = {
                    updatedAt: now,
                    [`${role}Location`]: location,
                    'tripStatus.lastUpdated': now
                };
                yield this.liveTrackingCollection.doc(tripId).update(updateData);
                // Trigger ETA calculation and notification checks
                yield this.checkETAsAndNotify(tripId);
                return {
                    success: true,
                    message: 'Location updated successfully'
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to update location'
                };
            }
        });
    }
    // Get live tracking data for a trip
    getLiveTrackingData(tripId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doc = yield this.liveTrackingCollection.doc(tripId).get();
                if (!doc.exists) {
                    throw new Error('Live tracking data not found');
                }
                const data = doc.data();
                return {
                    success: true,
                    data
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get tracking data'
                };
            }
        });
    }
    // Check ETAs and send notifications
    checkETAsAndNotify(tripId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doc = yield this.liveTrackingCollection.doc(tripId).get();
                if (!doc.exists) {
                    return;
                }
                const trackingData = doc.data();
                const { driverLocation, riderLocation, pickupLocation, tripStatus, notified } = trackingData;
                // Calculate ETAs
                const driverETA = yield this.calculateETA(driverLocation, pickupLocation, 'driving');
                const riderETA = yield this.calculateETA(riderLocation, pickupLocation, 'walking');
                // Check arrival status
                const driverArrived = this.hasArrived(driverLocation, pickupLocation);
                const riderArrived = this.hasArrived(riderLocation, pickupLocation);
                // Update trip status
                const updatedTripStatus = Object.assign(Object.assign({}, tripStatus), { driverETA,
                    riderETA,
                    driverArrived,
                    riderArrived, lastUpdated: Date.now() });
                // Determine if both have arrived
                if (driverArrived && riderArrived && !notified.bothArrived) {
                    updatedTripStatus.status = 'en_route_to_dropoff';
                }
                // Prepare notification updates
                const notificationUpdates = {};
                // Check driver ETA notifications
                if (driverETA <= 10 && !notified.driver10) {
                    yield this.sendNotification(trackingData.riderId, 'driver-eta', {
                        title: 'Driver is 10 minutes away! 🚗',
                        message: `Your driver is approximately ${driverETA} minutes away from the pickup location.`,
                        data: { tripId, eta: driverETA, type: 'driver-eta' }
                    });
                    notificationUpdates.driver10 = true;
                }
                if (driverETA <= 5 && !notified.driver5) {
                    yield this.sendNotification(trackingData.riderId, 'driver-eta', {
                        title: 'Driver is 5 minutes away! 🚗',
                        message: `Your driver is approximately ${driverETA} minutes away. Please be ready at the pickup location.`,
                        data: { tripId, eta: driverETA, type: 'driver-eta' }
                    });
                    notificationUpdates.driver5 = true;
                }
                // Check rider ETA notifications
                if (riderETA <= 10 && !notified.rider10) {
                    yield this.sendNotification(trackingData.driverId, 'rider-eta', {
                        title: 'Rider is 10 minutes away! 🚶',
                        message: `Your rider is approximately ${riderETA} minutes away from the pickup location.`,
                        data: { tripId, eta: riderETA, type: 'rider-eta' }
                    });
                    notificationUpdates.rider10 = true;
                }
                if (riderETA <= 5 && !notified.rider5) {
                    yield this.sendNotification(trackingData.driverId, 'rider-eta', {
                        title: 'Rider is 5 minutes away! 🚶',
                        message: `Your rider is approximately ${riderETA} minutes away. They should arrive soon.`,
                        data: { tripId, eta: riderETA, type: 'rider-eta' }
                    });
                    notificationUpdates.rider5 = true;
                }
                // Check arrival notifications
                if (driverArrived && !notified.driverArrived) {
                    yield this.sendNotification(trackingData.riderId, 'arrival-notification', {
                        title: 'Driver has arrived! ✅',
                        message: 'Your driver has arrived at the pickup location.',
                        data: { tripId, type: 'driver-arrived' }
                    });
                    notificationUpdates.driverArrived = true;
                }
                if (riderArrived && !notified.riderArrived) {
                    yield this.sendNotification(trackingData.driverId, 'arrival-notification', {
                        title: 'Rider has arrived! ✅',
                        message: 'Your rider has arrived at the pickup location.',
                        data: { tripId, type: 'rider-arrived' }
                    });
                    notificationUpdates.riderArrived = true;
                }
                // Check if both arrived
                if (driverArrived && riderArrived && !notified.bothArrived) {
                    yield this.sendNotification(trackingData.driverId, 'arrival-notification', {
                        title: 'Both parties arrived! 🎉',
                        message: 'Both driver and rider have arrived. You can now proceed to the destination.',
                        data: { tripId, type: 'both-arrived' }
                    });
                    yield this.sendNotification(trackingData.riderId, 'arrival-notification', {
                        title: 'Both parties arrived! 🎉',
                        message: 'Both driver and rider have arrived. You can now proceed to the destination.',
                        data: { tripId, type: 'both-arrived' }
                    });
                    notificationUpdates.bothArrived = true;
                }
                // Update Firestore with new status and notifications
                const updateData = {
                    tripStatus: updatedTripStatus,
                    updatedAt: Date.now()
                };
                if (Object.keys(notificationUpdates).length > 0) {
                    updateData.notified = Object.assign(Object.assign({}, notified), notificationUpdates);
                }
                yield this.liveTrackingCollection.doc(tripId).update(updateData);
            }
            catch (error) {
                console.error('Error in checkETAsAndNotify:', error);
            }
        });
    }
    // Calculate ETA using Google Maps Directions API
    calculateETA(origin_1, destination_1) {
        return __awaiter(this, arguments, void 0, function* (origin, destination, mode = 'driving') {
            try {
                // For now, use a simple distance-based calculation
                // In production, you would use Google Maps Directions API
                const distance = (0, helpers_1.calculateDistance)(origin.lat, origin.lng, destination.lat, destination.lng);
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
            }
            catch (error) {
                console.error('Error calculating ETA:', error);
                return 0;
            }
        });
    }
    // Check if user has arrived at pickup location
    hasArrived(userLocation, pickupLocation) {
        const distance = (0, helpers_1.calculateDistance)(userLocation.lat, userLocation.lng, pickupLocation.lat, pickupLocation.lng);
        // Consider arrived if within 20 meters
        return distance <= 0.02; // 20 meters in kilometers
    }
    // Send notification to user
    sendNotification(userId, type, notificationData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notification = {
                    id: (0, helpers_1.generateId)(),
                    userId,
                    type,
                    title: notificationData.title,
                    message: notificationData.message,
                    data: notificationData.data,
                    read: false,
                    createdAt: (0, helpers_1.createTimestamp)()
                };
                yield this.notificationsCollection.doc(notification.id).set(notification);
                // Here you would also send push notification via FCM
                // await this.sendPushNotification(userId, notificationData);
            }
            catch (error) {
                console.error('Error sending notification:', error);
            }
        });
    }
    // End live tracking for a trip
    endTracking(tripId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updateData = {
                    'tripStatus.status': 'completed',
                    updatedAt: Date.now()
                };
                yield this.liveTrackingCollection.doc(tripId).update(updateData);
                return {
                    success: true,
                    message: 'Live tracking ended successfully'
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to end tracking'
                };
            }
        });
    }
    // Get active trips for a user
    getUserActiveTrips(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const driverTrips = yield this.liveTrackingCollection
                    .where('driverId', '==', userId)
                    .where('tripStatus.status', 'in', ['en_route_to_pickup', 'en_route_to_dropoff'])
                    .get();
                const riderTrips = yield this.liveTrackingCollection
                    .where('riderId', '==', userId)
                    .where('tripStatus.status', 'in', ['en_route_to_pickup', 'en_route_to_dropoff'])
                    .get();
                const allTrips = [...driverTrips.docs, ...riderTrips.docs];
                const trips = allTrips.map(doc => doc.data());
                return {
                    success: true,
                    data: trips
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get active trips',
                    data: []
                };
            }
        });
    }
    // Clean up old tracking data (scheduled function)
    cleanupOldTrackingData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                const oldTrips = yield this.liveTrackingCollection
                    .where('updatedAt', '<', oneDayAgo)
                    .where('tripStatus.status', '==', 'completed')
                    .get();
                const batch = firebase_1.db.batch();
                oldTrips.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                yield batch.commit();
                console.log(`Cleaned up ${oldTrips.docs.length} old tracking records`);
            }
            catch (error) {
                console.error('Error cleaning up old tracking data:', error);
            }
        });
    }
}
exports.LiveTrackingService = LiveTrackingService;
//# sourceMappingURL=liveTrackingService.js.map