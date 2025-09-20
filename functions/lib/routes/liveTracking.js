"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const liveTrackingService_1 = require("../services/liveTrackingService");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
const liveTrackingService = new liveTrackingService_1.LiveTrackingService();
// Apply middleware
router.use(auth_1.cors);
router.use((0, auth_1.rateLimit)(200, 15 * 60 * 1000)); // Higher rate limit for location updates
// Start live tracking for a trip
router.post('/start', auth_1.authenticateUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const validatedData = (0, validation_1.validateRequest)(validation_1.startTrackingSchema, req.body);
        const result = await liveTrackingService.startTracking(validatedData);
        if (result.success) {
            res.status(201).json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to start tracking'
        });
    }
});
// Update location for driver or rider
router.post('/update-location', auth_1.authenticateUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const validatedData = (0, validation_1.validateRequest)(validation_1.updateLocationSchema, req.body);
        // Verify user is part of this trip
        const { tripId, role } = validatedData;
        const trackingData = await liveTrackingService.getLiveTrackingData(tripId);
        if (!trackingData.success) {
            return res.status(404).json({ success: false, error: 'Trip not found' });
        }
        const trip = trackingData.data;
        const userId = req.user.uid;
        if (role === 'driver' && trip.driverId !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized to update driver location' });
        }
        if (role === 'rider' && trip.riderId !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized to update rider location' });
        }
        const result = await liveTrackingService.updateLocation(validatedData);
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update location'
        });
    }
});
// Get live tracking data for a trip
router.get('/trip/:tripId', auth_1.authenticateUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const { tripId } = req.params;
        const result = await liveTrackingService.getLiveTrackingData(tripId);
        if (result.success) {
            // Verify user is part of this trip
            const trip = result.data;
            const userId = req.user.uid;
            if (trip.driverId !== userId && trip.riderId !== userId) {
                return res.status(403).json({ success: false, error: 'Unauthorized to view this trip' });
            }
            res.json(result);
        }
        else {
            res.status(404).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get tracking data'
        });
    }
});
// Get user's active trips
router.get('/active', auth_1.authenticateUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const result = await liveTrackingService.getUserActiveTrips(req.user.uid);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get active trips'
        });
    }
});
// End live tracking for a trip
router.post('/end/:tripId', auth_1.authenticateUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const { tripId } = req.params;
        // Verify user is part of this trip
        const trackingData = await liveTrackingService.getLiveTrackingData(tripId);
        if (!trackingData.success) {
            return res.status(404).json({ success: false, error: 'Trip not found' });
        }
        const trip = trackingData.data;
        const userId = req.user.uid;
        if (trip.driverId !== userId && trip.riderId !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized to end this trip' });
        }
        const result = await liveTrackingService.endTracking(tripId);
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to end tracking'
        });
    }
});
// Manual ETA check and notification trigger
router.post('/check-etas/:tripId', auth_1.authenticateUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const { tripId } = req.params;
        // Verify user is part of this trip
        const trackingData = await liveTrackingService.getLiveTrackingData(tripId);
        if (!trackingData.success) {
            return res.status(404).json({ success: false, error: 'Trip not found' });
        }
        const trip = trackingData.data;
        const userId = req.user.uid;
        if (trip.driverId !== userId && trip.riderId !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized to access this trip' });
        }
        // Trigger ETA check and notifications
        await liveTrackingService.checkETAsAndNotify(tripId);
        res.json({
            success: true,
            message: 'ETA check completed'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to check ETAs'
        });
    }
});
// Get trip status
router.get('/status/:tripId', auth_1.authenticateUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const { tripId } = req.params;
        const result = await liveTrackingService.getLiveTrackingData(tripId);
        if (result.success) {
            // Verify user is part of this trip
            const trip = result.data;
            const userId = req.user.uid;
            if (trip.driverId !== userId && trip.riderId !== userId) {
                return res.status(403).json({ success: false, error: 'Unauthorized to view this trip' });
            }
            // Return only the status information
            res.json({
                success: true,
                data: {
                    tripId: trip.tripId,
                    status: trip.tripStatus,
                    pickupLocation: trip.pickupLocation,
                    dropoffLocation: trip.dropoffLocation,
                    driverLocation: trip.driverLocation,
                    riderLocation: trip.riderLocation
                }
            });
        }
        else {
            res.status(404).json(result);
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get trip status'
        });
    }
});
// Health check for live tracking
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Live tracking service is running',
        timestamp: new Date().toISOString()
    });
});
// Apply error handling middleware
router.use(auth_1.errorHandler);
exports.default = router;
//# sourceMappingURL=liveTracking.js.map