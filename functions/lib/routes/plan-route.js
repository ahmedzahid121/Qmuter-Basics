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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const joi_1 = __importDefault(require("joi"));
const firebase_1 = require("../config/firebase");
const router = (0, express_1.Router)();
// Route suggestion schema
const routeSuggestionSchema = joi_1.default.object({
    origin: joi_1.default.object({
        lat: joi_1.default.number().required(),
        lng: joi_1.default.number().required()
    }).required(),
    destination: joi_1.default.object({
        lat: joi_1.default.number().required(),
        lng: joi_1.default.number().required()
    }).required()
});
// Create route instance schema
const createRouteSchema = joi_1.default.object({
    checkpointStopIds: joi_1.default.array().items(joi_1.default.string()).min(2).required(),
    seatsTotal: joi_1.default.number().integer().min(1).max(6).required(),
    startTime: joi_1.default.string().required(),
    price: joi_1.default.number().positive().required(),
    notes: joi_1.default.string().optional()
});
// Booking schema
const bookingSchema = joi_1.default.object({
    routeInstanceId: joi_1.default.string().required(),
    boardStopId: joi_1.default.string().required(),
    alightStopId: joi_1.default.string().required()
});
// Validation middleware wrapper
const validateSchema = (schema) => {
    return (req, res, next) => {
        try {
            (0, validation_1.validateRequest)(schema, req.body);
            next();
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            });
        }
    };
};
// Get route suggestions
router.post('/suggest', validateSchema(routeSuggestionSchema), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { origin, destination } = req.body;
        // Mock route suggestions based on AT stops
        // In production, this would use GTFS data and shortest path algorithm
        const suggestions = [
            {
                id: 1,
                checkpointStopIds: ['s100', 's134', 's167', 's240'],
                etaMin: 23,
                distanceKm: 15.3,
                zones: 5,
                price: 8.0,
                stops: [
                    { id: 's100', name: 'Britomart Station', address: 'Britomart, Auckland' },
                    { id: 's134', name: 'Newmarket Station', address: 'Newmarket, Auckland' },
                    { id: 's167', name: 'Remuera Station', address: 'Remuera, Auckland' },
                    { id: 's240', name: 'Greenlane Station', address: 'Greenlane, Auckland' }
                ]
            },
            {
                id: 2,
                checkpointStopIds: ['s100', 's145', 's180', 's240'],
                etaMin: 28,
                distanceKm: 16.1,
                zones: 5,
                price: 8.0,
                stops: [
                    { id: 's100', name: 'Britomart Station', address: 'Britomart, Auckland' },
                    { id: 's145', name: 'Parnell Station', address: 'Parnell, Auckland' },
                    { id: 's180', name: 'Eden Terrace Station', address: 'Eden Terrace, Auckland' },
                    { id: 's240', name: 'Greenlane Station', address: 'Greenlane, Auckland' }
                ]
            }
        ];
        res.json({
            success: true,
            data: suggestions
        });
    }
    catch (error) {
        console.error('Error getting route suggestions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get route suggestions'
        });
    }
}));
// Get live routes near location
router.get('/live', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { near, radius = 2000 } = req.query;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        if (!near || typeof near !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Near parameter required'
            });
        }
        const [lat, lng] = near.split(',').map(Number);
        // Get live route instances from Firestore
        const liveRoutesRef = firebase_1.db.collection('routeInstances')
            .where('status', '==', 'LIVE')
            .where('seatsFree', '>', 0);
        const snapshot = yield liveRoutesRef.get();
        const liveRoutes = [];
        for (const doc of snapshot.docs) {
            const routeData = doc.data();
            if (!routeData)
                continue;
            // Simple distance calculation (in production, use proper geospatial queries)
            const distance = Math.sqrt(Math.pow((((_b = routeData.startPoint) === null || _b === void 0 ? void 0 : _b.lat) || 0) - lat, 2) +
                Math.pow((((_c = routeData.startPoint) === null || _c === void 0 ? void 0 : _c.lng) || 0) - lng, 2)) * 111000; // Rough km conversion
            const radiusValue = typeof radius === 'string' ? parseInt(radius) : (typeof radius === 'number' ? radius : 2000);
            if (distance <= radiusValue) {
                // Get driver info
                const driverDoc = yield firebase_1.db.collection('users').doc(routeData.driverId).get();
                const driverData = driverDoc.data();
                liveRoutes.push({
                    id: doc.id,
                    driverName: (driverData === null || driverData === void 0 ? void 0 : driverData.displayName) || 'Anonymous',
                    seatsTotal: routeData.seatsTotal,
                    seatsFree: routeData.seatsFree,
                    startTime: routeData.startTime,
                    price: routeData.price,
                    checkpointStopIds: routeData.checkpointStopIds,
                    stops: routeData.stops || [],
                    etaMin: routeData.etaMin || 25,
                    distanceKm: routeData.distanceKm || 15.0
                });
            }
        }
        res.json({
            success: true,
            data: liveRoutes
        });
    }
    catch (error) {
        console.error('Error getting live routes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get live routes'
        });
    }
}));
// Create live route instance (Driver)
router.post('/', auth_1.authenticateUser, validateSchema(createRouteSchema), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const routeData = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        // Create route instance in Firestore
        const routeInstance = {
            driverId: userId,
            status: 'LIVE',
            seatsTotal: routeData.seatsTotal,
            seatsFree: routeData.seatsTotal,
            startTime: routeData.startTime,
            price: routeData.price,
            notes: routeData.notes,
            checkpointStopIds: routeData.checkpointStopIds,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const docRef = yield firebase_1.db.collection('routeInstances').add(routeInstance);
        res.json({
            success: true,
            data: Object.assign({ id: docRef.id }, routeInstance)
        });
    }
    catch (error) {
        console.error('Error creating route instance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create route instance'
        });
    }
}));
// Create booking (Rider)
router.post('/bookings', auth_1.authenticateUser, validateSchema(bookingSchema), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const bookingData = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        // Create booking in Firestore
        const booking = {
            riderId: userId,
            routeInstanceId: bookingData.routeInstanceId,
            boardStopId: bookingData.boardStopId,
            alightStopId: bookingData.alightStopId,
            status: 'HELD',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const docRef = yield firebase_1.db.collection('bookings').add(booking);
        res.json({
            success: true,
            data: Object.assign({ id: docRef.id }, booking)
        });
    }
    catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create booking'
        });
    }
}));
// Confirm booking
router.post('/bookings/:bookingId/confirm', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { bookingId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        // Update booking status in Firestore
        yield firebase_1.db.collection('bookings').doc(bookingId).update({
            status: 'CONFIRMED',
            updatedAt: new Date()
        });
        res.json({
            success: true,
            data: {
                id: bookingId,
                status: 'CONFIRMED'
            }
        });
    }
    catch (error) {
        console.error('Error confirming booking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to confirm booking'
        });
    }
}));
exports.default = router;
//# sourceMappingURL=plan-route.js.map